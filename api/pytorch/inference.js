/**
 * 🔥 PYTORCH/ONNX INFERENCE API
 * Production-ready ONNX Runtime inference endpoint
 * Beyaz Şapkalı - Real Data - <100ms Latency Target
 *
 * Features:
 * - ONNX Runtime Node.js integration
 * - Image preprocessing pipeline
 * - Model caching (lazy loading)
 * - Database logging
 * - Error handling with fallback
 * - Security: Input validation, sanitization
 */

const ort = require('onnxruntime-node');
const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { getDatabase } = require('../../database/init-db');
const { handleCORS } = require('../../security/cors-config');
const { applySanitization } = require('../_middleware/sanitize');

// Model cache (lazy loading)
const modelCache = new Map();

/**
 * Get model from database
 */
async function getModelMetadata(modelName) {
  const db = getDatabase();
  try {
    const model = db
      .prepare(
        `
      SELECT * FROM pytorch_models
      WHERE model_name = ? AND deployment_status = 'active'
    `
      )
      .get(modelName);

    if (!model) {
      throw new Error(`Model not found or not active: ${modelName}`);
    }

    return model;
  } finally {
    db.close();
  }
}

/**
 * Load ONNX model (with caching)
 */
async function loadModel(modelPath, modelName) {
  // Check cache first
  if (modelCache.has(modelName)) {
    console.log(`✅ Using cached model: ${modelName}`);
    return modelCache.get(modelName);
  }

  console.log(`📦 Loading model: ${modelName} from ${modelPath}`);

  // Check if file exists
  const fullPath = path.join(process.cwd(), modelPath);
  try {
    await fs.access(fullPath);
  } catch (error) {
    throw new Error(`Model file not found: ${fullPath}`);
  }

  // Load ONNX model
  const session = await ort.InferenceSession.create(fullPath, {
    executionProviders: ['cpu'], // Use 'cuda' if GPU available
    graphOptimizationLevel: 'all',
    enableCpuMemArena: true,
    enableMemPattern: true,
  });

  // Cache the session
  modelCache.set(modelName, session);
  console.log(`✅ Model loaded and cached: ${modelName}`);

  return session;
}

/**
 * Preprocess image for medical imaging models
 * Input: Buffer (JPEG, PNG, etc.)
 * Output: Float32Array tensor [1, 3, 224, 224]
 */
async function preprocessMedicalImage(imageBuffer) {
  try {
    // Validate input
    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error('Input must be a Buffer');
    }

    // Check file size (max 10MB)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      throw new Error('Image too large (max 10MB)');
    }

    // Resize and normalize using sharp
    const processedBuffer = await sharp(imageBuffer)
      .resize(224, 224, {
        fit: 'cover',
        position: 'center',
      })
      .removeAlpha()
      .raw()
      .toBuffer();

    // Convert to Float32Array and normalize (ImageNet stats)
    const float32Data = new Float32Array(3 * 224 * 224);
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    for (let i = 0; i < 224 * 224; i++) {
      const r = processedBuffer[i * 3] / 255.0;
      const g = processedBuffer[i * 3 + 1] / 255.0;
      const b = processedBuffer[i * 3 + 2] / 255.0;

      // Normalize: (x - mean) / std
      float32Data[i] = (r - mean[0]) / std[0];
      float32Data[224 * 224 + i] = (g - mean[1]) / std[1];
      float32Data[2 * 224 * 224 + i] = (b - mean[2]) / std[2];
    }

    // Create ONNX tensor
    const tensor = new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);

    return tensor;
  } catch (error) {
    console.error('Preprocessing error:', error);
    throw new Error(`Image preprocessing failed: ${error.message}`);
  }
}

/**
 * Run inference
 */
async function runInference(session, inputTensor, modelMetadata) {
  const startTime = Date.now();

  try {
    // Get input name from model metadata
    const inputShape = JSON.parse(modelMetadata.input_shape);
    const inputName = Object.keys(inputShape)[0] || 'input';

    // Run inference
    const feeds = { [inputName]: inputTensor };
    const results = await session.run(feeds);

    const inferenceTime = Date.now() - startTime;

    // Get output
    const outputName = Object.keys(results)[0];
    const output = results[outputName];

    return {
      output: output.data,
      outputShape: output.dims,
      inferenceTime,
    };
  } catch (error) {
    console.error('Inference error:', error);
    throw new Error(`Inference failed: ${error.message}`);
  }
}

/**
 * Post-process output (softmax for classification)
 */
function postprocessClassification(logits, classes) {
  // Softmax
  const expScores = Array.from(logits).map(x => Math.exp(x));
  const sumExp = expScores.reduce((a, b) => a + b, 0);
  const probabilities = expScores.map(x => x / sumExp);

  // Get top prediction
  const maxIndex = probabilities.indexOf(Math.max(...probabilities));
  const prediction = classes[maxIndex];
  const confidence = probabilities[maxIndex];

  // Format all probabilities
  const allProbabilities = {};
  classes.forEach((className, index) => {
    allProbabilities[className] = {
      probability: probabilities[index],
      percentage: (probabilities[index] * 100).toFixed(2) + '%',
    };
  });

  return {
    prediction,
    confidence,
    probabilities: allProbabilities,
  };
}

/**
 * Log inference to database
 */
function logInference(modelId, userId, inputHash, inferenceTime, confidence, result) {
  const db = getDatabase();
  try {
    db.prepare(
      `
      INSERT INTO pytorch_inference_logs (
        model_id, user_id, input_hash, inference_time_ms, confidence, result, result_class
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      modelId,
      userId || null,
      inputHash,
      inferenceTime,
      confidence,
      JSON.stringify(result),
      result.prediction
    );
  } catch (error) {
    console.error('Failed to log inference:', error);
  } finally {
    db.close();
  }
}

/**
 * Main inference handler
 */
module.exports = async (req, res) => {
  applySanitization(req, res);
  // CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const overallStartTime = Date.now();

  try {
    // Get request body
    const { model_name = 'chest-xray-classifier-demo', image } = req.body;

    // Validate image input
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image data required',
        usage: 'Send base64-encoded image in "image" field',
      });
    }

    // Convert base64 to buffer
    let imageBuffer;
    try {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base64 image data',
      });
    }

    // Create input hash (for caching and deduplication)
    const inputHash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

    // Get model metadata
    const modelMetadata = await getModelMetadata(model_name);

    // Load model (cached)
    const session = await loadModel(modelMetadata.file_path, model_name);

    // Preprocess image
    const preprocessStartTime = Date.now();
    const inputTensor = await preprocessMedicalImage(imageBuffer);
    const preprocessTime = Date.now() - preprocessStartTime;

    // Run inference
    const { output, inferenceTime } = await runInference(session, inputTensor, modelMetadata);

    // Post-process results
    const outputShape = JSON.parse(modelMetadata.output_shape);
    const classes = outputShape.classes || ['Class 0', 'Class 1', 'Class 2'];

    const result = postprocessClassification(output, classes);

    // Total time
    const totalTime = Date.now() - overallStartTime;

    // Log to database (async, don't wait)
    setImmediate(() => {
      logInference(
        modelMetadata.id,
        req.user?.id,
        inputHash,
        inferenceTime,
        result.confidence,
        result
      );
    });

    // Return response
    res.status(200).json({
      success: true,
      model: {
        name: modelMetadata.model_name,
        version: modelMetadata.model_version,
        type: modelMetadata.model_type,
        domain: modelMetadata.domain,
      },
      prediction: result.prediction,
      confidence: (result.confidence * 100).toFixed(2) + '%',
      probabilities: result.probabilities,
      performance: {
        preprocessing_ms: preprocessTime,
        inference_ms: inferenceTime,
        total_ms: totalTime,
      },
      metadata: {
        input_hash: inputHash.substring(0, 16) + '...',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ PyTorch Inference Error:', error);

    // Log error
    const totalTime = Date.now() - overallStartTime;

    res.status(500).json({
      success: false,
      error: 'Çıkarım işlemi başarısız',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      performance: {
        total_ms: totalTime,
      },
    });
  }
};
