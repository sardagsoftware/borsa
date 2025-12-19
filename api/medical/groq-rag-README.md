# Groq AI Medical Document RAG Analysis API

Ultra-fast medical document analysis using Groq's fastest AI models with Retrieval-Augmented Generation (RAG).

## Overview

This API provides lightning-fast analysis of medical documents including:
- PDF medical records
- Scanned documents (via OCR)
- Lab reports
- Prescriptions
- Clinical notes
- Radiology reports

### Key Features

- **Ultra-Fast Inference**: Powered by Groq's llama-3.3-70b-versatile and mixtral-8x7b models
- **RAG Architecture**: Retrieval-Augmented Generation for accurate medical analysis
- **Multi-Format Support**: PDF, images (PNG, JPEG, TIFF), and text documents
- **OCR Integration**: Azure Document Intelligence for scanned documents
- **Medical Entity Recognition**: Diseases, medications, symptoms, procedures
- **ICD-10 Code Assignment**: Automatic coding when applicable
- **Timeline Extraction**: Chronological medical event timeline
- **Risk Assessment**: Clinical risk factor identification
- **Early Diagnosis Indicators**: Pattern recognition for early intervention
- **Structured Output**: Clean JSON format for clinical workflows

## API Endpoint

```
POST /api/medical/groq-rag
GET  /api/medical/groq-rag (API information)
```

## Authentication

Currently no authentication required (add based on your security requirements).

Rate Limit: 50 requests per minute per IP/user.

## Request Format

### Method: POST
Content-Type: `multipart/form-data`

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `document` | File | Conditional* | Medical document file (PDF, image) |
| `documentText` | String | Conditional* | Direct text input (alternative to file) |
| `model` | String | Optional | AI model to use (default: llama-3.3-70b-versatile) |
| `patientContext` | String | Optional | Additional patient context |
| `analysisType` | String | Optional | Type of analysis: comprehensive, focused, summary |
| `language` | String | Optional | Output language (default: en) |

*Either `document` or `documentText` must be provided.

### Available Models

| Model ID | Speed | Context Window | Best For |
|----------|-------|----------------|----------|
| `llama-3.3-70b-versatile` | Ultra-fast | 128K tokens | General medical analysis (recommended) |
| `mixtral-8x7b` | Ultra-fast | 32K tokens | Structured data extraction |
| `llama-3.1-70b-versatile` | Fast | 128K tokens | Alternative high-performance model |

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "summary": "Clinical summary (2-3 sentences)",
  "keyFindings": [
    {
      "finding": "Clinical finding description",
      "severity": "critical|high|moderate|low",
      "category": "diagnosis|symptom|lab_result|imaging|procedure",
      "date": "YYYY-MM-DD or null",
      "confidence": 0.95
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
      "icd10Code": "I21.0",
      "diagnosisDate": "YYYY-MM-DD or null",
      "status": "confirmed|suspected|rule_out",
      "severity": "critical|severe|moderate|mild",
      "notes": "Additional context"
    }
  ],
  "timeline": [
    {
      "date": "2024-12-15",
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
      "test": "Troponin I",
      "value": "0.8",
      "unit": "ng/mL",
      "referenceRange": "<0.04",
      "flag": "high|low|normal|critical",
      "date": "2024-12-15"
    }
  ],
  "vitalSigns": [
    {
      "type": "BP|HR|RR|Temp|SpO2|Weight|Height",
      "value": "145/92",
      "unit": "mmHg",
      "date": "2024-12-15",
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
  "qualityMetrics": {
    "totalFindings": 8,
    "criticalFindings": 2,
    "medicationCount": 4,
    "diagnosisCount": 3,
    "highRiskFactors": 2,
    "urgentRecommendations": 1
  },
  "metadata": {
    "model": "llama-3.3-70b-versatile",
    "provider": "Groq",
    "inferenceTimeMs": 1234,
    "tokensUsed": {
      "prompt": 1500,
      "completion": 800,
      "total": 2300
    },
    "documentMetadata": {
      "pages": 3,
      "method": "pdf-parse"
    },
    "totalProcessingTimeMs": 2500,
    "textLength": 5000,
    "language": "en"
  },
  "disclaimer": "This AI-generated analysis is for informational purposes only...",
  "timestamp": "2024-12-19T09:43:00.000Z"
}
```

### Error Response (4xx, 5xx)

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "processingTimeMs": 123,
  "timestamp": "2024-12-19T09:43:00.000Z"
}
```

## Usage Examples

### Example 1: Analyze Medical Text

```javascript
const axios = require('axios');
const FormData = require('form-data');

const formData = new FormData();
formData.append('documentText', `
  Patient presents with chest pain and shortness of breath.
  Troponin elevated at 0.8 ng/mL. ECG shows ST-depression.
  Diagnosis: NSTEMI. Started on dual antiplatelet therapy.
`);
formData.append('model', 'llama-3.3-70b-versatile');

const response = await axios.post('http://localhost:3100/api/medical/groq-rag', formData, {
  headers: formData.getHeaders()
});

console.log(response.data);
```

### Example 2: Analyze PDF Document

```javascript
const fs = require('fs');
const FormData = require('form-data');

const formData = new FormData();
formData.append('document', fs.createReadStream('./medical-report.pdf'));
formData.append('model', 'llama-3.3-70b-versatile');
formData.append('patientContext', 'Patient has history of cardiac issues');

const response = await axios.post('http://localhost:3100/api/medical/groq-rag', formData, {
  headers: formData.getHeaders(),
  maxBodyLength: Infinity
});

console.log(response.data.summary);
console.log(response.data.diagnoses);
```

### Example 3: Analyze Scanned Lab Report (OCR)

```javascript
const formData = new FormData();
formData.append('document', fs.createReadStream('./scanned-lab-report.png'));
formData.append('model', 'mixtral-8x7b'); // Good for structured data
formData.append('analysisType', 'focused');

const response = await axios.post('http://localhost:3100/api/medical/groq-rag', formData, {
  headers: formData.getHeaders(),
  maxBodyLength: Infinity
});

console.log(response.data.labResults);
console.log(response.data.earlyDiagnosisIndicators);
```

### Example 4: cURL Command

```bash
curl -X POST http://localhost:3100/api/medical/groq-rag \
  -H "X-User-Id: doctor123" \
  -F "document=@medical-record.pdf" \
  -F "model=llama-3.3-70b-versatile" \
  -F "language=en"
```

### Example 5: Get API Information

```bash
curl http://localhost:3100/api/medical/groq-rag
```

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```bash
# Required
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional - for OCR support on scanned documents
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
AZURE_DOC_INTELLIGENCE_KEY=your_azure_key_here
```

### 2. Get Groq API Key

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add to `.env`

### 3. Install Dependencies

All required dependencies should already be installed. If not:

```bash
npm install openai formidable pdf-parse @azure/ai-form-recognizer
```

### 4. Test the API

Run the example file:

```bash
node api/medical/groq-rag-example.js
```

Or start your server and test:

```bash
npm start
# Then in another terminal:
curl http://localhost:3100/api/medical/groq-rag
```

## Supported Document Formats

### Direct Support (No OCR Required)
- **PDF**: `.pdf` files with selectable text
- **Text**: `.txt`, direct text input

### OCR Support (Requires Azure Document Intelligence)
- **Images**: `.png`, `.jpg`, `.jpeg`, `.tiff`
- **Scanned PDFs**: PDF files without selectable text

Maximum file size: **50MB**

## Performance Benchmarks

| Model | Avg Inference Time | Best For |
|-------|-------------------|----------|
| llama-3.3-70b-versatile | ~1-2 seconds | Comprehensive analysis |
| mixtral-8x7b | ~1-2 seconds | Structured data extraction |
| llama-3.1-70b-versatile | ~1-2 seconds | Alternative option |

*Note: Times may vary based on document length and complexity*

## Medical Terminology Standards

This API uses professional medical terminology aligned with:

- **ICD-10**: International Classification of Diseases, 10th Revision
- **SNOMED CT**: Systematized Nomenclature of Medicine - Clinical Terms
- **LOINC**: Logical Observation Identifiers Names and Codes (for lab tests)
- **RxNorm**: Standard nomenclature for medications

## Compliance & Disclaimers

### HIPAA Compliance
- This API does not store any patient data
- All processing is done in-memory
- Files are deleted immediately after processing
- No logging of PHI (Protected Health Information)
- Use encryption for data in transit (HTTPS)

### Medical Disclaimer
**IMPORTANT**: This AI system is designed to assist healthcare professionals and is NOT a substitute for professional medical judgment.

- All outputs are for informational purposes only
- Clinical decisions must be made by qualified healthcare professionals
- Results should be verified against source documents
- Not FDA-approved for diagnostic use
- Use in accordance with local medical regulations

### Limitations
- AI may hallucinate or misinterpret information
- OCR accuracy depends on image quality
- ICD-10 codes are suggestions, not definitive
- Risk assessments are estimates
- Always verify critical information manually

## Error Handling

### Common Errors

| Status Code | Error | Solution |
|-------------|-------|----------|
| 400 | No document provided | Include `document` file or `documentText` |
| 400 | Document text too short | Minimum 50 characters required |
| 400 | Invalid model | Use valid model ID |
| 429 | Rate limit exceeded | Wait 60 seconds between batches |
| 500 | Groq API not configured | Set `GROQ_API_KEY` in .env |
| 500 | PDF extraction failed | Check if PDF is corrupted |
| 500 | OCR failed | Check Azure configuration or file format |

## Advanced Usage

### Custom Patient Context

Provide additional context for more accurate analysis:

```javascript
formData.append('patientContext', JSON.stringify({
  age: 65,
  gender: 'male',
  allergies: ['penicillin', 'sulfa drugs'],
  chronicConditions: ['hypertension', 'diabetes'],
  recentProcedures: ['cardiac catheterization 2023-11-15']
}));
```

### Multi-Language Support

Request analysis in different languages:

```javascript
formData.append('language', 'es'); // Spanish
formData.append('language', 'fr'); // French
formData.append('language', 'de'); // German
formData.append('language', 'ar'); // Arabic
```

*Note: Medical terminology should remain in English/Latin for accuracy*

### Batch Processing

Process multiple documents in parallel:

```javascript
const documents = ['doc1.pdf', 'doc2.pdf', 'doc3.pdf'];

const results = await Promise.all(
  documents.map(async (doc) => {
    const formData = new FormData();
    formData.append('document', fs.createReadStream(doc));
    return axios.post(API_ENDPOINT, formData, {
      headers: formData.getHeaders()
    });
  })
);

console.log('Processed', results.length, 'documents');
```

## Integration Examples

### Integration with EHR Systems

```javascript
// Example: Epic FHIR Integration
async function analyzeAndStoreInEHR(patientId, documentPath) {
  // 1. Analyze document
  const formData = new FormData();
  formData.append('document', fs.createReadStream(documentPath));
  const analysis = await axios.post(API_ENDPOINT, formData, {
    headers: formData.getHeaders()
  });

  // 2. Convert to FHIR format
  const fhirBundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: analysis.data.diagnoses.map(diagnosis => ({
      resource: {
        resourceType: 'Condition',
        subject: { reference: `Patient/${patientId}` },
        code: {
          coding: [{
            system: 'http://hl7.org/fhir/sid/icd-10',
            code: diagnosis.icd10Code,
            display: diagnosis.diagnosis
          }]
        },
        clinicalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: diagnosis.status
          }]
        }
      }
    }))
  };

  // 3. Post to EHR FHIR endpoint
  // await postToEHR(fhirBundle);
}
```

### Webhook Notifications

```javascript
// Send analysis results to webhook
async function analyzeAndNotify(documentPath, webhookUrl) {
  const formData = new FormData();
  formData.append('document', fs.createReadStream(documentPath));

  const analysis = await axios.post(API_ENDPOINT, formData, {
    headers: formData.getHeaders()
  });

  // Send to webhook
  if (analysis.data.qualityMetrics.criticalFindings > 0) {
    await axios.post(webhookUrl, {
      alert: 'Critical findings detected',
      patient: 'Patient ID',
      findings: analysis.data.keyFindings.filter(f => f.severity === 'critical'),
      urgency: 'immediate'
    });
  }
}
```

## Troubleshooting

### Issue: Slow Performance
- Check network connectivity to Groq API
- Reduce document size (compress PDFs)
- Use faster model (all Groq models are fast)

### Issue: Poor OCR Results
- Ensure image is high resolution (min 300 DPI)
- Check image contrast and clarity
- Verify Azure Document Intelligence is configured
- Try pre-processing image (contrast, brightness)

### Issue: Incorrect ICD-10 Codes
- Provide more context in document
- Use `patientContext` parameter
- Verify codes against official ICD-10 database
- Remember: AI suggestions, not definitive codes

### Issue: Missing Medications
- Ensure medication names are clear in document
- Check for misspellings or abbreviations
- Provide structured prescription format

## Support & Contributing

For issues, questions, or contributions:
- Create an issue in the repository
- Contact: support@ailydian.com
- Documentation: https://docs.ailydian.com

## License

Proprietary - Ailydian Ultra Pro
© 2024 All Rights Reserved

## Version History

### v1.0.0 (2024-12-19)
- Initial release
- Support for llama-3.3-70b-versatile and mixtral-8x7b
- PDF and image document support
- Comprehensive medical analysis
- ICD-10 code extraction
- Timeline and risk assessment
- Early diagnosis indicators
