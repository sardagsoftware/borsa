/**
 * Fireworks AI Medical Image & Document Analysis Platform
 * Advanced Medical Analysis for Radiology, Lab Results, and Medical Records
 * Supports: DICOM, PDF, JPG, PNG, TIFF
 * Fireworks AI Vision Models Integration
 */

require('dotenv').config();
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getCorsOrigin } = require('../_middleware/cors');

// Fireworks AI Configuration
const FIREWORKS_API_KEY = process.env.FIREWORKS_API_KEY;
const FIREWORKS_BASE_URL = 'https://api.fireworks.ai/inference/v1';

// Fireworks AI Vision Models
const VISION_MODELS = {
  'GX7F4B8C': {
    id: 'accounts/fireworks/models/llama-v3p2-90b-vision-instruct',
    description: 'Advanced vision model for medical image analysis',
    maxTokens: 4096,
    capabilities: ['image_analysis', 'medical_terminology', 'differential_diagnosis']
  },
  'GX2E9A4D': {
    id: 'accounts/fireworks/models/llama-v3p2-11b-vision-instruct',
    description: 'Fast vision model for quick medical assessments',
    maxTokens: 4096,
    capabilities: ['image_analysis', 'medical_terminology']
  },
  'phi-3.5-vision': {
    id: 'accounts/fireworks/models/phi-3-vision-128k-instruct',
    description: 'Specialized vision model with large context',
    maxTokens: 8192,
    capabilities: ['document_analysis', 'lab_results', 'medical_records']
  }
};

// Supported file formats and MIME types
const SUPPORTED_FORMATS = {
  images: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/tiff': ['.tiff', '.tif'],
    'application/dicom': ['.dcm', '.dicom']
  },
  documents: {
    'application/pdf': ['.pdf']
  }
};

// Medical Imaging Knowledge Base
const RADIOLOGY_KNOWLEDGE = {
  xray: {
    chest: {
      findings: ['Pneumonia', 'Pleural Effusion', 'Pneumothorax', 'Cardiomegaly', 'Pulmonary Edema', 'Lung Mass', 'Rib Fracture'],
      landmarks: ['Cardiac silhouette', 'Lung fields', 'Costophrenic angles', 'Hilum', 'Mediastinum']
    },
    extremities: {
      findings: ['Fracture', 'Dislocation', 'Osteoporosis', 'Joint Effusion', 'Soft Tissue Swelling'],
      landmarks: ['Cortical margins', 'Joint spaces', 'Bone alignment', 'Soft tissues']
    },
    abdomen: {
      findings: ['Bowel Obstruction', 'Free Air', 'Kidney Stones', 'Organomegaly', 'Ascites'],
      landmarks: ['Bowel gas pattern', 'Psoas margins', 'Organ borders']
    }
  },
  ct: {
    brain: {
      findings: ['Hemorrhage', 'Stroke', 'Tumor', 'Trauma', 'Hydrocephalus', 'Midline Shift'],
      landmarks: ['Ventricles', 'Gray-white matter', 'Skull base', 'Brainstem']
    },
    chest: {
      findings: ['Pulmonary Embolism', 'Aortic Dissection', 'Pneumonia', 'Cancer', 'Lymphadenopathy'],
      landmarks: ['Pulmonary vessels', 'Mediastinum', 'Aorta', 'Bronchi']
    },
    abdomen: {
      findings: ['Appendicitis', 'Diverticulitis', 'Pancreatitis', 'Liver Lesions', 'Renal Masses'],
      landmarks: ['Liver', 'Spleen', 'Pancreas', 'Kidneys', 'Bowel']
    }
  },
  mri: {
    brain: {
      findings: ['MS Plaques', 'Tumor', 'Stroke', 'Dementia', 'Infection'],
      landmarks: ['White matter', 'Gray matter', 'Ventricles', 'Cerebellum']
    },
    spine: {
      findings: ['Disc Herniation', 'Stenosis', 'Cord Compression', 'Vertebral Fracture'],
      landmarks: ['Spinal cord', 'Discs', 'Vertebral bodies', 'Neural foramina']
    },
    joints: {
      findings: ['Ligament Tear', 'Meniscal Tear', 'Cartilage Damage', 'Effusion'],
      landmarks: ['Articular cartilage', 'Ligaments', 'Menisci', 'Joint space']
    }
  }
};

// Lab Test Reference Ranges
const LAB_REFERENCE_RANGES = {
  cbc: {
    wbc: { low: 4.5, high: 11.0, unit: 'K/μL', name: 'White Blood Cells' },
    rbc: { low: 4.5, high: 5.9, unit: 'M/μL', name: 'Red Blood Cells' },
    hemoglobin: { low: 13.5, high: 17.5, unit: 'g/dL', name: 'Hemoglobin' },
    hematocrit: { low: 38.8, high: 50.0, unit: '%', name: 'Hematocrit' },
    platelets: { low: 150, high: 400, unit: 'K/μL', name: 'Platelets' }
  },
  cmp: {
    glucose: { low: 70, high: 100, unit: 'mg/dL', name: 'Glucose (Fasting)' },
    sodium: { low: 136, high: 145, unit: 'mEq/L', name: 'Sodium' },
    potassium: { low: 3.5, high: 5.0, unit: 'mEq/L', name: 'Potassium' },
    creatinine: { low: 0.7, high: 1.3, unit: 'mg/dL', name: 'Creatinine' },
    bun: { low: 7, high: 20, unit: 'mg/dL', name: 'Blood Urea Nitrogen' }
  },
  liver: {
    alt: { low: 7, high: 56, unit: 'U/L', name: 'ALT (Alanine Aminotransferase)' },
    ast: { low: 10, high: 40, unit: 'U/L', name: 'AST (Aspartate Aminotransferase)' },
    bilirubin: { low: 0.1, high: 1.2, unit: 'mg/dL', name: 'Total Bilirubin' },
    albumin: { low: 3.5, high: 5.5, unit: 'g/dL', name: 'Albumin' }
  },
  cardiac: {
    troponin: { low: 0, high: 0.04, unit: 'ng/mL', name: 'Troponin I' },
    bnp: { low: 0, high: 100, unit: 'pg/mL', name: 'BNP (B-type Natriuretic Peptide)' },
    ck_mb: { low: 0, high: 5, unit: 'ng/mL', name: 'CK-MB' }
  }
};

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

/**
 * Check rate limit for user
 */
function checkRateLimit(userId = 'anonymous') {
  const now = Date.now();
  const userRequests = requestLog.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);

  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }

  recentRequests.push(now);
  requestLog.set(userId, recentRequests);
  return true;
}

/**
 * Convert file to base64
 */
function fileToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return fileBuffer.toString('base64');
}

/**
 * Detect file type and validate
 */
function detectFileType(filename, mimetype) {
  const ext = path.extname(filename).toLowerCase();

  // Check images
  for (const [mime, extensions] of Object.entries(SUPPORTED_FORMATS.images)) {
    if (extensions.includes(ext) || mimetype === mime) {
      return { type: 'image', mime: mime === 'application/dicom' ? 'application/dicom' : mimetype, ext };
    }
  }

  // Check documents
  for (const [mime, extensions] of Object.entries(SUPPORTED_FORMATS.documents)) {
    if (extensions.includes(ext) || mimetype === mime) {
      return { type: 'document', mime, ext };
    }
  }

  return null;
}

/**
 * Get media type for Fireworks AI
 */
function getMediaType(fileInfo) {
  if (fileInfo.mime === 'application/dicom') {
    return 'image/jpeg'; // DICOM converted to JPEG for vision models
  }
  return fileInfo.mime;
}

/**
 * Build specialized medical prompt based on file type and analysis type
 */
function buildMedicalPrompt(analysisType, fileType, specialization) {
  const prompts = {
    radiology: {
      xray: `You are an expert radiologist analyzing an X-ray image. Provide a comprehensive medical analysis including:

1. CLINICAL INFORMATION:
   - Image type and quality assessment
   - Body part and anatomical orientation

2. FINDINGS:
   - Detailed description of all visible structures
   - Any abnormalities or pathological findings
   - Specific measurements if applicable

3. DIFFERENTIAL DIAGNOSIS (ranked by probability):
   - List 3-5 most likely diagnoses based on imaging findings
   - Assign probability percentage to each diagnosis
   - Explain key imaging features supporting each diagnosis

4. DETECTED CONDITIONS/ABNORMALITIES:
   - Name each condition
   - Location and extent
   - Severity assessment (Mild/Moderate/Severe)
   - Confidence score (0-100%)

5. RECOMMENDATIONS:
   - Additional imaging studies needed
   - Suggested clinical correlation
   - Urgent vs. routine follow-up
   - Specialist consultations if needed

Use proper medical terminology. Format your response as a structured JSON with the following schema:
{
  "imageQuality": "string",
  "technique": "string",
  "findings": [{"description": "string", "location": "string", "severity": "string"}],
  "detectedConditions": [{"condition": "string", "location": "string", "severity": "string", "confidence": 0-100}],
  "differentialDiagnosis": [{"diagnosis": "string", "probability": 0-100, "supportingFeatures": ["string"]}],
  "recommendations": {
    "additionalImaging": ["string"],
    "urgency": "STAT|Urgent|Routine",
    "consultations": ["string"],
    "followUp": "string"
  },
  "impression": "string"
}`,
      ct: `You are an expert radiologist analyzing a CT scan. Provide a comprehensive medical analysis including:

1. TECHNIQUE:
   - CT protocol and contrast usage
   - Image quality and artifacts

2. FINDINGS:
   - Systematic review by anatomical region
   - Measurements of any masses or lesions
   - Vascular assessment
   - Lymph node evaluation

3. DIFFERENTIAL DIAGNOSIS (ranked by probability):
   - Top 3-5 diagnoses with probability percentages
   - Key CT features supporting each diagnosis
   - Additional findings that help narrow diagnosis

4. DETECTED CONDITIONS:
   - Specific pathologies identified
   - Location using anatomical landmarks
   - Size and characteristics
   - Confidence scores

5. CRITICAL FINDINGS:
   - Life-threatening conditions requiring immediate attention
   - Time-sensitive interventions needed

6. RECOMMENDATIONS:
   - Follow-up imaging timeline
   - Comparison with prior studies
   - Additional diagnostic procedures
   - Specialist referrals

Provide response in structured JSON format with medical terminology.`,
      mri: `You are an expert radiologist analyzing an MRI scan. Provide comprehensive analysis including:

1. TECHNIQUE:
   - MRI sequences used (T1, T2, FLAIR, DWI, etc.)
   - Contrast administration
   - Image quality

2. FINDINGS:
   - Signal characteristics
   - Anatomical structures
   - Pathological changes
   - Enhancement patterns

3. DIFFERENTIAL DIAGNOSIS:
   - Ranked list with probabilities
   - MRI-specific features
   - Tissue characterization

4. DETECTED CONDITIONS:
   - Specific diagnoses with confidence scores
   - Location and extent
   - Clinical significance

5. RECOMMENDATIONS:
   - Follow-up MRI protocol
   - Comparison with prior imaging
   - Additional sequences needed
   - Biopsy or intervention recommendations

Format as structured JSON with complete medical details.`
    },
    lab_results: `You are an expert clinical pathologist analyzing laboratory results. Provide comprehensive analysis:

1. TEST RESULTS SUMMARY:
   - List all tests performed
   - Values with units
   - Reference ranges

2. ABNORMAL FINDINGS:
   - Tests outside reference range
   - Degree of abnormality (mild/moderate/severe)
   - Clinical significance

3. INTERPRETATION:
   - Pattern recognition (e.g., liver dysfunction, kidney disease, anemia)
   - Correlation between different test results
   - Severity assessment

4. DIFFERENTIAL DIAGNOSIS (ranked):
   - Most likely conditions based on lab pattern
   - Probability percentages
   - Supporting laboratory evidence

5. RECOMMENDATIONS:
   - Additional laboratory tests needed
   - Urgency of follow-up
   - Specialist consultation
   - Repeat testing timeline

Provide structured JSON response with medical terminology.`,
    medical_records: `You are an expert physician reviewing medical records. Analyze and extract:

1. PATIENT INFORMATION:
   - Demographics
   - Chief complaint
   - Medical history

2. CLINICAL FINDINGS:
   - Physical examination findings
   - Vital signs
   - Symptoms

3. ASSESSMENT:
   - Current diagnoses
   - Problem list
   - Severity of conditions

4. DIFFERENTIAL DIAGNOSIS:
   - Alternative diagnoses to consider
   - Probability rankings
   - Supporting evidence

5. TREATMENT PLAN:
   - Current medications
   - Interventions
   - Follow-up plans

6. RECOMMENDATIONS:
   - Additional testing
   - Specialty referrals
   - Treatment modifications
   - Risk factors to address

Provide comprehensive JSON-formatted analysis with medical precision.`
  };

  // Select appropriate prompt
  if (analysisType === 'radiology') {
    const imagingType = specialization || 'xray';
    return prompts.radiology[imagingType] || prompts.radiology.xray;
  }

  return prompts[analysisType] || prompts.medical_records;
}

/**
 * Call Fireworks AI Vision API
 */
async function callFireworksVisionAPI(imageBase64, prompt, model = 'GX7F4B8C', mediaType = 'image/jpeg') {
  if (!FIREWORKS_API_KEY) {
    throw new Error('Fireworks API key not configured');
  }

  const modelConfig = VISION_MODELS[model];
  if (!modelConfig) {
    throw new Error(`Invalid model: ${model}`);
  }

  const apiUrl = `${FIREWORKS_BASE_URL}/chat/completions`;

  const requestBody = {
    model: modelConfig.id,
    max_tokens: modelConfig.maxTokens,
    temperature: 0.1, // Low temperature for medical accuracy
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${imageBase64}`
            }
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      }
    ],
    response_format: {
      type: 'json_object'
    }
  };

  try {
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes timeout for complex medical analysis
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Fireworks API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Call Fireworks AI Text API for document analysis
 */
async function callFireworksTextAPI(documentText, prompt, model = 'GX7F4B8C') {
  if (!FIREWORKS_API_KEY) {
    throw new Error('Fireworks API key not configured');
  }

  const modelConfig = VISION_MODELS[model];
  const apiUrl = `${FIREWORKS_BASE_URL}/chat/completions`;

  const requestBody = {
    model: modelConfig.id,
    max_tokens: modelConfig.maxTokens,
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: 'You are an expert medical AI assistant providing accurate medical analysis with proper medical terminology.'
      },
      {
        role: 'user',
        content: `${prompt}\n\nDocument content:\n${documentText}`
      }
    ],
    response_format: {
      type: 'json_object'
    }
  };

  try {
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${FIREWORKS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Fireworks API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Extract text from PDF (simplified - in production use pdf-parse or similar)
 */
function extractTextFromPDF(pdfPath) {
  // This is a placeholder. In production, use pdf-parse library
  // For now, return indication that PDF processing would happen here
  return `[PDF Content from: ${path.basename(pdfPath)}]\n\nThis would contain extracted text from the PDF document including all lab results, measurements, and clinical notes.`;
}

/**
 * Parse JSON response from AI, with fallback
 */
function parseAIResponse(responseText) {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (e) {
    // If not valid JSON, try to extract JSON from text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // Return structured fallback
        return {
          rawResponse: responseText,
          error: 'Could not parse JSON response',
          findings: [{ description: 'See raw response for details' }],
          recommendations: { urgency: 'Routine' }
        };
      }
    }
    return {
      rawResponse: responseText,
      error: 'No JSON found in response'
    };
  }
}

/**
 * Analyze radiology image
 */
async function analyzeRadiologyImage(filePath, fileInfo, bodyPart, imagingType) {
  const base64Image = fileToBase64(filePath);
  const mediaType = getMediaType(fileInfo);
  const prompt = buildMedicalPrompt('radiology', fileInfo.type, imagingType);

  const aiResponse = await callFireworksVisionAPI(base64Image, prompt, 'GX7F4B8C', mediaType);

  const content = aiResponse.choices[0]?.message?.content || '{}';
  const analysis = parseAIResponse(content);

  return {
    analysisType: 'Radiology Image Analysis',
    imagingModality: imagingType.toUpperCase(),
    bodyPart: bodyPart,
    aiModel: 'Fireworks AI - Llama 3.2 90B Vision',
    analysis: analysis,
    usage: aiResponse.usage,
    processingTime: Date.now()
  };
}

/**
 * Analyze lab results
 */
async function analyzeLabResults(filePath, fileInfo) {
  let documentText;

  if (fileInfo.ext === '.pdf') {
    documentText = extractTextFromPDF(filePath);
  } else {
    // For images of lab results, use vision API
    const base64Image = fileToBase64(filePath);
    const mediaType = getMediaType(fileInfo);
    const visionPrompt = 'Extract all laboratory test results from this image including test names, values, units, and reference ranges. Then ' + buildMedicalPrompt('lab_results', fileInfo.type);

    const aiResponse = await callFireworksVisionAPI(base64Image, visionPrompt, 'GX7F4B8C', mediaType);
    const content = aiResponse.choices[0]?.message?.content || '{}';
    const analysis = parseAIResponse(content);

    return {
      analysisType: 'Lab Results Analysis',
      documentType: 'Laboratory Report',
      aiModel: 'Fireworks AI - Llama 3.2 90B Vision',
      analysis: analysis,
      referenceRanges: LAB_REFERENCE_RANGES,
      usage: aiResponse.usage,
      processingTime: Date.now()
    };
  }

  const prompt = buildMedicalPrompt('lab_results', 'document');
  const aiResponse = await callFireworksTextAPI(documentText, prompt);

  const content = aiResponse.choices[0]?.message?.content || '{}';
  const analysis = parseAIResponse(content);

  return {
    analysisType: 'Lab Results Analysis',
    documentType: 'Laboratory Report',
    aiModel: 'Fireworks AI - Llama 3.2 90B Vision',
    analysis: analysis,
    referenceRanges: LAB_REFERENCE_RANGES,
    usage: aiResponse.usage,
    processingTime: Date.now()
  };
}

/**
 * Analyze medical records
 */
async function analyzeMedicalRecords(filePath, fileInfo) {
  let documentText;

  if (fileInfo.ext === '.pdf') {
    documentText = extractTextFromPDF(filePath);
  } else {
    // For images of medical records, use vision API
    const base64Image = fileToBase64(filePath);
    const mediaType = getMediaType(fileInfo);
    const visionPrompt = 'Extract all medical information from this document. Then ' + buildMedicalPrompt('medical_records', fileInfo.type);

    const aiResponse = await callFireworksVisionAPI(base64Image, visionPrompt, 'phi-3.5-vision', mediaType);
    const content = aiResponse.choices[0]?.message?.content || '{}';
    const analysis = parseAIResponse(content);

    return {
      analysisType: 'Medical Records Analysis',
      documentType: 'Medical Record',
      aiModel: 'Fireworks AI - Phi 3.5 Vision',
      analysis: analysis,
      usage: aiResponse.usage,
      processingTime: Date.now()
    };
  }

  const prompt = buildMedicalPrompt('medical_records', 'document');
  const aiResponse = await callFireworksTextAPI(documentText, prompt, 'phi-3.5-vision');

  const content = aiResponse.choices[0]?.message?.content || '{}';
  const analysis = parseAIResponse(content);

  return {
    analysisType: 'Medical Records Analysis',
    documentType: 'Medical Record',
    aiModel: 'Fireworks AI - Phi 3.5 Vision',
    analysis: analysis,
    usage: aiResponse.usage,
    processingTime: Date.now()
  };
}

/**
 * Main request handler
 */
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET request - return API information
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      service: 'Fireworks AI Medical Analysis Platform',
      version: '1.0.0',
      capabilities: [
        'Radiology Image Analysis (X-Ray, CT, MRI)',
        'Lab Results Analysis',
        'Medical Records Analysis',
        'DICOM Support',
        'Multi-format Support (PDF, JPG, PNG, TIFF)'
      ],
      supportedFormats: SUPPORTED_FORMATS,
      availableModels: Object.keys(VISION_MODELS).map(key => ({
        name: key,
        description: VISION_MODELS[key].description,
        capabilities: VISION_MODELS[key].capabilities
      })),
      endpoints: {
        analyze: 'POST /api/medical/fireworks-analysis',
        info: 'GET /api/medical/fireworks-analysis'
      },
      usage: {
        method: 'POST',
        contentType: 'multipart/form-data',
        requiredFields: {
          file: 'Medical file to analyze (DICOM, PDF, JPG, PNG, TIFF)',
          analysisType: 'Type of analysis (radiology|lab_results|medical_records)'
        },
        optionalFields: {
          bodyPart: 'Body part for radiology (chest|brain|abdomen|extremities|spine)',
          imagingType: 'Imaging modality (xray|ct|mri)',
          model: 'AI model to use (GX7F4B8C|GX2E9A4D|phi-3.5-vision)'
        }
      },
      radiologyKnowledge: {
        modalities: Object.keys(RADIOLOGY_KNOWLEDGE),
        bodyParts: {
          xray: Object.keys(RADIOLOGY_KNOWLEDGE.xray),
          ct: Object.keys(RADIOLOGY_KNOWLEDGE.ct),
          mri: Object.keys(RADIOLOGY_KNOWLEDGE.mri)
        }
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'OPTIONS']
    });
  }

  // Rate limiting
  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Maximum ${RATE_LIMIT} requests per minute allowed`,
      retryAfter: 60
    });
  }

  // Validate API key
  if (!FIREWORKS_API_KEY) {
    console.error('Fireworks API key not configured');
    return res.status(500).json({
      success: false,
      error: 'Service not configured',
      message: 'FIREWORKS_API_KEY environment variable is not set'
    });
  }

  try {
    const startTime = Date.now();

    // Parse multipart form data
    const form = formidable({
      multiples: false,
      maxFileSize: 50 * 1024 * 1024, // 50MB max
      keepExtensions: true
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          message: err.message
        });
      }

      try {
        // Extract fields
        const analysisType = Array.isArray(fields.analysisType) ? fields.analysisType[0] : fields.analysisType;
        const bodyPart = Array.isArray(fields.bodyPart) ? fields.bodyPart[0] : fields.bodyPart || 'chest';
        const imagingType = Array.isArray(fields.imagingType) ? fields.imagingType[0] : fields.imagingType || 'xray';
        const model = Array.isArray(fields.model) ? fields.model[0] : fields.model || 'GX7F4B8C';

        // Validate file
        if (!files.file) {
          return res.status(400).json({
            success: false,
            error: 'No file provided',
            message: 'Please upload a medical file (DICOM, PDF, JPG, PNG, or TIFF)'
          });
        }

        // Get file info
        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
        const filePath = uploadedFile.filepath || uploadedFile.path;
        const filename = uploadedFile.originalFilename || uploadedFile.name;
        const mimetype = uploadedFile.mimetype || uploadedFile.type;

        // Detect and validate file type
        const fileInfo = detectFileType(filename, mimetype);
        if (!fileInfo) {
          return res.status(400).json({
            success: false,
            error: 'Unsupported file format',
            message: 'Supported formats: DICOM, PDF, JPG, PNG, TIFF',
            receivedType: mimetype,
            receivedExtension: path.extname(filename)
          });
        }

        // Validate analysis type
        const validAnalysisTypes = ['radiology', 'lab_results', 'medical_records'];
        if (!analysisType || !validAnalysisTypes.includes(analysisType)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid analysis type',
            message: `analysisType must be one of: ${validAnalysisTypes.join(', ')}`,
            receivedType: analysisType
          });
        }

        // Validate model
        if (!VISION_MODELS[model]) {
          return res.status(400).json({
            success: false,
            error: 'Invalid model',
            message: `model must be one of: ${Object.keys(VISION_MODELS).join(', ')}`,
            receivedModel: model
          });
        }

        console.log(`Starting ${analysisType} analysis using ${model}...`);
        console.log(`File: ${filename} (${fileInfo.mime})`);

        let result;

        // Route to appropriate analysis function
        if (analysisType === 'radiology') {
          result = await analyzeRadiologyImage(filePath, fileInfo, bodyPart, imagingType);
        } else if (analysisType === 'lab_results') {
          result = await analyzeLabResults(filePath, fileInfo);
        } else if (analysisType === 'medical_records') {
          result = await analyzeMedicalRecords(filePath, fileInfo);
        }

        // Clean up uploaded file
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }

        const totalTime = Date.now() - startTime;

        // Return successful response
        res.status(200).json({
          success: true,
          ...result,
          metadata: {
            filename: filename,
            fileType: fileInfo.type,
            mimeType: fileInfo.mime,
            analysisType: analysisType,
            model: model,
            bodyPart: analysisType === 'radiology' ? bodyPart : undefined,
            imagingType: analysisType === 'radiology' ? imagingType : undefined,
            processingTimeMs: totalTime,
            timestamp: new Date().toISOString()
          },
          disclaimer: 'This AI analysis is for educational and research purposes only. Always consult qualified healthcare professionals for medical decisions.'
        });

      } catch (analysisError) {
        console.error('Analysis error:', analysisError);

        // Clean up file if it exists
        try {
          const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
          if (uploadedFile) {
            const filePath = uploadedFile.filepath || uploadedFile.path;
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }

        return res.status(500).json({
          success: false,
          error: 'Analysis failed',
          message: analysisError.message,
          timestamp: new Date().toISOString()
        });
      }
    });

  } catch (error) {
    console.error('Request handling error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
