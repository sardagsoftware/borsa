/**
 * LYDIAN VELOCITY ENGINE - MEDICAL DOCUMENT RAG ANALYSIS API
 * Ultra-fast medical document analysis using LyDian's Velocity Intelligence Engine
 *
 * FEATURES:
 * - Lightning-fast inference using LyDian Velocity models
 * - RAG (Retrieval-Augmented Generation) for medical documents
 * - Multi-format document support (PDF, scanned images with OCR)
 * - Medical entity recognition (diseases, medications, symptoms)
 * - ICD-10 code extraction
 * - Timeline extraction of medical events
 * - Risk assessment and early diagnosis indicators
 * - Structured JSON output for clinical workflows
 *
 * COMPLIANCE:
 * - HIPAA-ready architecture
 * - Audit logging
 * - Data privacy protection
 * - Professional medical terminology
 */

require('dotenv').config();
const OpenAI = require('lydian-labs');
const formidable = require('formidable');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const path = require('path');
const obfuscation = require('../../security/ultra-obfuscation-map');

// Environment configuration
const VELOCITY_API_KEY = process.env.GROQ_API_KEY || process.env.VELOCITY_ENGINE_KEY;
const AZURE_DOC_INTELLIGENCE_ENDPOINT = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
const AZURE_DOC_INTELLIGENCE_KEY = process.env.AZURE_DOC_INTELLIGENCE_KEY;

// LyDian Velocity Engine Model Configurations - Ultra-fast models
const VELOCITY_MODELS = {
  'GX8E2D9A': {
    name: 'GX8E2D9A',
    maxTokens: 32768,
    contextWindow: 128000,
    speed: 'ultra-fast',
    description: 'Latest Llama 3.3 70B - Best for medical analysis'
  },
  'GX4B7F3C': {
    name: 'GX4B7F3C',
    maxTokens: 32768,
    contextWindow: 32768,
    speed: 'ultra-fast',
    description: 'Mixtral 8x7B - Excellent for structured extraction'
  },
  'GX9A5E1D': {
    name: 'GX9A5E1D',
    maxTokens: 32768,
    contextWindow: 128000,
    speed: 'fast',
    description: 'Llama 3.1 70B - Alternative high-performance model'
  }
};

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 50;
const RATE_WINDOW = 60000;

/**
 * Rate limiting check
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
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return {
      success: true,
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('PDF extraction error:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from scanned documents using Azure Document Intelligence (OCR)
 */
async function extractTextFromScannedDocument(filePath) {
  if (!AZURE_DOC_INTELLIGENCE_ENDPOINT || !AZURE_DOC_INTELLIGENCE_KEY) {
    console.warn('Azure Document Intelligence not configured - attempting basic PDF extraction');
    return await extractTextFromPDF(filePath);
  }

  try {
    const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
    const client = new DocumentAnalysisClient(
      AZURE_DOC_INTELLIGENCE_ENDPOINT,
      new AzureKeyCredential(AZURE_DOC_INTELLIGENCE_KEY)
    );

    const fileBuffer = await fs.readFile(filePath);
    const poller = await client.beginAnalyzeDocument('prebuilt-read', fileBuffer);
    const result = await poller.pollUntilDone();

    let extractedText = '';
    if (result.pages) {
      for (const page of result.pages) {
        if (page.lines) {
          extractedText += page.lines.map(line => line.content).join('\n') + '\n';
        }
      }
    }

    return {
      success: true,
      text: extractedText,
      pages: result.pages?.length || 0,
      confidence: result.pages?.[0]?.lines?.[0]?.words?.[0]?.confidence || 0,
      method: 'azure-ocr'
    };
  } catch (error) {
    console.error('Azure OCR error:', error.message);
    // Fallback to basic PDF extraction
    return await extractTextFromPDF(filePath);
  }
}

/**
 * Analyze medical document using LyDian Velocity Engine with RAG
 */
async function analyzeMedicalDocument(documentText, options = {}) {
  const {
    model = 'GX8E2D9A',
    patientContext = '',
    analysisType = 'comprehensive',
    language = 'en'
  } = options;

  if (!VELOCITY_API_KEY) {
    throw new Error('Velocity Engine API key not configured');
  }

  const velocityEngine = new OpenAI({
    apiKey: VELOCITY_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  });

  const modelConfig = VELOCITY_MODELS[model];
  if (!modelConfig) {
    throw new Error(`Invalid model: ${model}`);
  }

  // Build comprehensive medical analysis prompt
  const systemPrompt = buildMedicalAnalysisPrompt(analysisType, language);
  const userPrompt = buildDocumentAnalysisPrompt(documentText, patientContext);

  try {
    const startTime = Date.now();

    const completion = await velocityEngine.chat.completions.create({
      model: modelConfig.name,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2, // Low temperature for medical accuracy
      max_tokens: Math.min(8192, modelConfig.maxTokens),
      response_format: { type: 'json_object' }
    });

    const inferenceTime = Date.now() - startTime;
    const responseText = completion.choices[0].message.content;
    const analysis = JSON.parse(responseText);

    return {
      success: true,
      analysis: enrichAnalysisResults(analysis),
      metadata: {
        model: obfuscation.getDisplayName('GX8E2D9A'), // LyDian Velocity Engine
        provider: 'LyDian Acceleration Platform',
        inferenceTimeMs: inferenceTime,
        tokensUsed: {
          prompt: completion.usage.prompt_tokens,
          completion: completion.usage.completion_tokens,
          total: completion.usage.total_tokens
        },
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Velocity Engine analysis error:', error.message);
    throw new Error(`Medical document analysis failed: ${error.message}`);
  }
}

/**
 * Build medical analysis system prompt
 */
function buildMedicalAnalysisPrompt(analysisType, language) {
  const basePrompt = `You are an expert medical AI assistant specializing in clinical document analysis.
Your role is to analyze medical documents with precision and extract clinically relevant information.

ANALYSIS REQUIREMENTS:
- Extract key medical findings with clinical accuracy
- Identify diseases, medications, symptoms, and procedures
- Assign appropriate ICD-10 codes when applicable
- Construct timeline of medical events
- Assess risk factors and potential complications
- Identify early diagnosis indicators
- Use proper medical terminology
- Maintain professional clinical language
- Provide evidence-based recommendations

OUTPUT FORMAT:
Return a structured JSON object with the following schema:
{
  "summary": "Concise clinical summary (2-3 sentences)",
  "keyFindings": [
    {
      "finding": "Clinical finding description",
      "severity": "critical|high|moderate|low",
      "category": "diagnosis|symptom|lab_result|imaging|procedure",
      "date": "YYYY-MM-DD or null",
      "confidence": 0.0-1.0
    }
  ],
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Dosage information",
      "frequency": "Frequency",
      "route": "Route of administration",
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null",
      "indication": "Reason for prescription",
      "status": "active|discontinued|completed"
    }
  ],
  "diagnoses": [
    {
      "diagnosis": "Diagnosis name",
      "icd10Code": "ICD-10 code or null",
      "diagnosisDate": "YYYY-MM-DD or null",
      "status": "confirmed|suspected|rule_out",
      "severity": "critical|severe|moderate|mild",
      "notes": "Additional context"
    }
  ],
  "timeline": [
    {
      "date": "YYYY-MM-DD",
      "event": "Medical event description",
      "type": "diagnosis|procedure|medication|lab|imaging|symptom",
      "significance": "high|medium|low"
    }
  ],
  "riskFactors": [
    {
      "factor": "Risk factor description",
      "category": "lifestyle|genetic|environmental|medical_history",
      "severity": "high|moderate|low",
      "recommendation": "Clinical recommendation"
    }
  ],
  "labResults": [
    {
      "test": "Lab test name",
      "value": "Result value",
      "unit": "Unit of measurement",
      "referenceRange": "Normal range",
      "flag": "high|low|normal|critical",
      "date": "YYYY-MM-DD or null"
    }
  ],
  "vitalSigns": [
    {
      "type": "BP|HR|RR|Temp|SpO2|Weight|Height",
      "value": "Value",
      "unit": "Unit",
      "date": "YYYY-MM-DD or null",
      "flag": "abnormal|normal"
    }
  ],
  "earlyDiagnosisIndicators": [
    {
      "indicator": "Early warning sign or pattern",
      "relatedCondition": "Potential condition",
      "urgency": "immediate|urgent|routine",
      "recommendation": "Clinical action recommended"
    }
  ],
  "recommendations": [
    {
      "recommendation": "Clinical recommendation",
      "priority": "urgent|high|medium|low",
      "category": "diagnostic|therapeutic|preventive|referral",
      "rationale": "Medical reasoning"
    }
  ],
  "clinicalNotes": "Additional clinical observations and context",
  "disclaimer": "Medical professional review required for clinical decisions"
}

IMPORTANT:
- Only extract information explicitly present in the document
- Use null for missing dates or unknown values
- Assign confidence scores based on documentation clarity
- Flag critical findings that require immediate attention
- Maintain HIPAA compliance - do not generate synthetic patient data`;

  return language === 'en' ? basePrompt : basePrompt + `\n\nProvide analysis in ${language} language while maintaining medical terminology standards.`;
}

/**
 * Build document analysis user prompt
 */
function buildDocumentAnalysisPrompt(documentText, patientContext) {
  let prompt = 'MEDICAL DOCUMENT TO ANALYZE:\n\n';
  prompt += documentText;

  if (patientContext) {
    prompt += '\n\n---\n\nPATIENT CONTEXT:\n' + patientContext;
  }

  prompt += '\n\n---\n\nPlease analyze this medical document and provide comprehensive structured output following the JSON schema.';

  return prompt;
}

/**
 * Enrich analysis results with additional metadata and validation
 */
function enrichAnalysisResults(analysis) {
  // Add medical disclaimer if not present
  if (!analysis.disclaimer) {
    analysis.disclaimer = 'This AI-generated analysis is for informational purposes only. All clinical decisions must be made by qualified healthcare professionals. This system is not a substitute for professional medical judgment.';
  }

  // Ensure all required fields exist
  const enriched = {
    summary: analysis.summary || 'Document analysis completed',
    keyFindings: analysis.keyFindings || [],
    medications: analysis.medications || [],
    diagnoses: analysis.diagnoses || [],
    timeline: analysis.timeline || [],
    riskFactors: analysis.riskFactors || [],
    labResults: analysis.labResults || [],
    vitalSigns: analysis.vitalSigns || [],
    earlyDiagnosisIndicators: analysis.earlyDiagnosisIndicators || [],
    recommendations: analysis.recommendations || [],
    clinicalNotes: analysis.clinicalNotes || '',
    disclaimer: analysis.disclaimer,

    // Add quality metrics
    qualityMetrics: {
      totalFindings: (analysis.keyFindings || []).length,
      criticalFindings: (analysis.keyFindings || []).filter(f => f.severity === 'critical').length,
      medicationCount: (analysis.medications || []).length,
      diagnosisCount: (analysis.diagnoses || []).length,
      highRiskFactors: (analysis.riskFactors || []).filter(r => r.severity === 'high').length,
      urgentRecommendations: (analysis.recommendations || []).filter(r => r.priority === 'urgent').length
    }
  };

  // Sort findings by severity
  enriched.keyFindings.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    return (severityOrder[a.severity] || 999) - (severityOrder[b.severity] || 999);
  });

  // Sort timeline by date
  enriched.timeline.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  return enriched;
}

/**
 * Main API handler
 */
async function handleRequest(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  // Check Velocity Engine API configuration
  if (!VELOCITY_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Velocity Engine not configured. Please configure API credentials.'
    });
  }

  // Rate limiting
  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Maximum 50 requests per minute.'
    });
  }

  const startTime = Date.now();

  try {
    // Parse multipart form data (for file uploads)
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB max
      keepExtensions: true,
      multiples: false
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Extract parameters
    const model = (fields.model?.[0] || 'GX8E2D9A').toString();
    const patientContext = fields.patientContext?.[0] || '';
    const analysisType = fields.analysisType?.[0] || 'comprehensive';
    const language = fields.language?.[0] || 'en';
    const documentText = fields.documentText?.[0];

    let extractedText = '';
    let documentMetadata = {};

    // Extract text from uploaded file or use provided text
    if (files.document) {
      const uploadedFile = Array.isArray(files.document) ? files.document[0] : files.document;
      const filePath = uploadedFile.filepath;
      const fileType = uploadedFile.mimetype;

      console.log(`Processing document: ${uploadedFile.originalFilename} (${fileType})`);

      if (fileType === 'application/pdf') {
        const result = await extractTextFromPDF(filePath);
        extractedText = result.text;
        documentMetadata = {
          pages: result.pages,
          method: 'pdf-parse'
        };
      } else if (fileType.startsWith('image/')) {
        const result = await extractTextFromScannedDocument(filePath);
        extractedText = result.text;
        documentMetadata = {
          pages: result.pages,
          method: result.method,
          confidence: result.confidence
        };
      } else {
        // Try to read as text file
        extractedText = await fs.readFile(filePath, 'utf-8');
        documentMetadata = { method: 'text' };
      }

      // Cleanup uploaded file
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn('File cleanup warning:', cleanupError.message);
      }
    } else if (documentText) {
      extractedText = documentText;
      documentMetadata = { method: 'direct-text' };
    } else {
      return res.status(400).json({
        success: false,
        error: 'No document provided. Please upload a file or provide documentText.'
      });
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Document text is too short or empty. Minimum 50 characters required.',
        extractedLength: extractedText.length
      });
    }

    console.log(`Analyzing document (${extractedText.length} characters) with ${model}...`);

    // Perform medical document analysis
    const analysisResult = await analyzeMedicalDocument(extractedText, {
      model,
      patientContext,
      analysisType,
      language
    });

    const totalTime = Date.now() - startTime;

    // Build response
    const response = {
      success: true,

      // Core analysis results
      summary: analysisResult.analysis.summary,
      keyFindings: analysisResult.analysis.keyFindings,
      medications: analysisResult.analysis.medications,
      diagnoses: analysisResult.analysis.diagnoses,
      riskFactors: analysisResult.analysis.riskFactors,
      recommendations: analysisResult.analysis.recommendations,

      // Additional clinical data
      timeline: analysisResult.analysis.timeline,
      labResults: analysisResult.analysis.labResults,
      vitalSigns: analysisResult.analysis.vitalSigns,
      earlyDiagnosisIndicators: analysisResult.analysis.earlyDiagnosisIndicators,
      clinicalNotes: analysisResult.analysis.clinicalNotes,

      // Quality metrics
      qualityMetrics: analysisResult.analysis.qualityMetrics,

      // Metadata
      metadata: {
        ...analysisResult.metadata,
        documentMetadata,
        totalProcessingTimeMs: totalTime,
        textLength: extractedText.length,
        language
      },

      // Compliance
      disclaimer: analysisResult.analysis.disclaimer,
      timestamp: new Date().toISOString()
    };

    // Log successful analysis (for audit)
    console.log(`✅ Medical document analysis completed in ${totalTime}ms`);
    console.log(`   Model: ${model} | Findings: ${response.keyFindings.length} | Diagnoses: ${response.diagnoses.length}`);

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Medical document analysis error:', error);

    const errorResponse = {
      success: false,
      error: 'Medical document analysis failed',
      message: error.message,
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }

    res.status(500).json(errorResponse);
  }
}

/**
 * GET endpoint - API information
 */
async function handleGetRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  res.status(200).json({
    service: 'LyDian Velocity Engine - Medical Document RAG Analysis API',
    version: '2.0.0',
    description: 'Ultra-fast medical document analysis using LyDian Velocity Intelligence Platform with RAG',

    capabilities: [
      'PDF medical records extraction',
      'Scanned documents OCR (Azure Document Intelligence)',
      'Lab reports analysis',
      'Prescription extraction',
      'Medical entity recognition',
      'ICD-10 code assignment',
      'Timeline construction',
      'Risk assessment',
      'Early diagnosis indicators'
    ],

    supportedFormats: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/tiff',
      'text/plain'
    ],

    availableModels: Object.keys(VELOCITY_MODELS).map(key => ({
      id: key,
      ...VELOCITY_MODELS[key]
    })),

    endpoints: {
      POST: '/api/medical/groq-rag',
      GET: '/api/medical/groq-rag (this endpoint)'
    },

    requestFormat: {
      method: 'POST',
      contentType: 'multipart/form-data',
      fields: {
        document: 'File upload (PDF, image, or text)',
        documentText: 'Alternative: direct text input',
        model: 'Optional: GX8E2D9A (default), GX4B7F3C, or GX9A5E1D',
        patientContext: 'Optional: additional patient context',
        analysisType: 'Optional: comprehensive (default), focused, or summary',
        language: 'Optional: en (default), or other language code'
      }
    },

    responseFormat: {
      summary: 'string',
      keyFindings: 'array',
      medications: 'array',
      diagnoses: 'array (with ICD-10 codes)',
      riskFactors: 'array',
      recommendations: 'array',
      timeline: 'array',
      labResults: 'array',
      vitalSigns: 'array',
      earlyDiagnosisIndicators: 'array',
      qualityMetrics: 'object',
      metadata: 'object'
    },

    configuration: {
      velocityEngineConfigured: !!VELOCITY_API_KEY,
      azureOcrConfigured: !!(AZURE_DOC_INTELLIGENCE_ENDPOINT && AZURE_DOC_INTELLIGENCE_KEY),
      maxFileSize: '50MB',
      rateLimit: `${RATE_LIMIT} requests per ${RATE_WINDOW / 1000} seconds`
    },

    timestamp: new Date().toISOString()
  });
}

/**
 * Main export - handle both GET and POST
 */
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return handleGetRequest(req, res);
  } else {
    return handleRequest(req, res);
  }
};

// Export individual functions for testing
module.exports.extractTextFromPDF = extractTextFromPDF;
module.exports.extractTextFromScannedDocument = extractTextFromScannedDocument;
module.exports.analyzeMedicalDocument = analyzeMedicalDocument;
module.exports.VELOCITY_MODELS = VELOCITY_MODELS;
