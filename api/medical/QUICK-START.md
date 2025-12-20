# LyDian Acceleration Medical RAG API - Quick Start Guide

## 5-Minute Setup

### Step 1: Get LyDian Acceleration API Key (1 minute)

1. Go to https://console.groq.com
2. Sign up for free account
3. Create new API key
4. Copy the key (starts with `gsk_`)

### Step 2: Configure Environment (30 seconds)

Add to your `.env` file:

```bash
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

### Step 3: Test the API (30 seconds)

```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro/ailydian-from-github
node api/medical/groq-rag-test.js
```

Expected output:
```
✅ PASS - CONFIGURATION
✅ PASS - MODELS
✅ PASS - GET ENDPOINT
✅ PASS - ERROR HANDLING
✅ PASS - LIVE API

🎉 All tests passed! API is ready to use.
```

### Step 4: Run Examples (1 minute)

```bash
node api/medical/groq-rag-example.js
```

This will demonstrate:
- Text analysis
- Lab report analysis
- Prescription extraction
- API capabilities

### Step 5: Make Your First Request (2 minutes)

#### Option A: Using cURL

```bash
# Start your server first
npm start

# In another terminal:
curl -X POST http://localhost:3100/api/medical/groq-rag \
  -F 'documentText=Patient presents with chest pain and elevated troponin. ECG shows ST-depression. Diagnosis: NSTEMI. Started on aspirin and clopidogrel.' \
  -F 'model=GX8E2D9A'
```

#### Option B: Using JavaScript

```javascript
const axios = require('axios');
const FormData = require('form-data');

const formData = new FormData();
formData.append('documentText', `
  PATIENT: John Doe
  Chief Complaint: Chest pain
  Vital Signs: BP 145/92, HR 98
  Lab: Troponin 0.8 ng/mL (elevated)
  Assessment: Acute Coronary Syndrome
  Plan: Admit to CCU, dual antiplatelet therapy
`);
formData.append('model', 'GX8E2D9A');

axios.post('http://localhost:3100/api/medical/groq-rag', formData, {
  headers: formData.getHeaders()
})
.then(response => {
  console.log('Summary:', response.data.summary);
  console.log('Diagnoses:', response.data.diagnoses);
  console.log('Medications:', response.data.medications);
  console.log('Recommendations:', response.data.recommendations);
})
.catch(error => {
  console.error('Error:', error.response?.data || error.message);
});
```

#### Option C: Using Python

```python
import requests

url = 'http://localhost:3100/api/medical/groq-rag'

data = {
    'documentText': '''
        Patient: Jane Smith
        Age: 65
        Presenting with severe headache and confusion
        CT scan shows intracranial hemorrhage
        Diagnosis: Stroke (hemorrhagic)
        Plan: Neurosurgery consult, ICU admission
    ''',
    'model': 'GX8E2D9A'
}

response = requests.post(url, data=data)
result = response.json()

print("Summary:", result['summary'])
print("Key Findings:", result['keyFindings'])
print("Diagnoses:", result['diagnoses'])
```

## What You Get

### Input (Medical Document)
```
Patient presents with chest pain and shortness of breath.
Troponin elevated at 0.8 ng/mL. ECG shows ST-depression.
Diagnosis: NSTEMI. Started on dual antiplatelet therapy.
```

### Output (Structured JSON)
```json
{
  "success": true,
  "summary": "Patient with acute coronary syndrome presenting with chest pain...",
  "keyFindings": [
    {
      "finding": "Elevated troponin level",
      "severity": "critical",
      "category": "lab_result",
      "confidence": 0.95
    }
  ],
  "diagnoses": [
    {
      "diagnosis": "Non-ST-Elevation Myocardial Infarction (NSTEMI)",
      "icd10Code": "I21.4",
      "status": "confirmed",
      "severity": "critical"
    }
  ],
  "medications": [
    {
      "name": "Aspirin",
      "indication": "Antiplatelet therapy",
      "status": "active"
    },
    {
      "name": "Clopidogrel",
      "indication": "Antiplatelet therapy",
      "status": "active"
    }
  ],
  "recommendations": [
    {
      "recommendation": "Immediate cardiology consultation",
      "priority": "urgent",
      "category": "referral"
    }
  ]
}
```

## Common Use Cases

### 1. Analyze PDF Medical Record

```bash
curl -X POST http://localhost:3100/api/medical/groq-rag \
  -F 'document=@patient-record.pdf' \
  -F 'model=GX8E2D9A'
```

### 2. Extract Lab Results

```javascript
const labReport = `
  Glucose: 210 mg/dL (HIGH)
  HbA1c: 8.9% (HIGH)
  Creatinine: 1.8 mg/dL (HIGH)
`;

formData.append('documentText', labReport);
formData.append('model', 'GX4B7F3C'); // Better for structured data
```

### 3. Analyze Prescription

```javascript
const prescription = `
  Rx: Warfarin 5mg daily
  Indication: Atrial fibrillation
  Monitoring: INR every 2 weeks
`;

formData.append('documentText', prescription);
```

### 4. Process Scanned Document (OCR)

```bash
# Requires Azure Document Intelligence configured
curl -X POST http://localhost:3100/api/medical/groq-rag \
  -F 'document=@scanned-lab-report.png'
```

## Troubleshooting

### "LyDian Acceleration API not configured"
**Solution**: Set `GROQ_API_KEY` in `.env` file

### "Rate limit exceeded"
**Solution**: Wait 60 seconds (limit: 50 requests/minute)

### "Document text too short"
**Solution**: Provide at least 50 characters of text

### "OCR failed"
**Solution**: Configure Azure Document Intelligence or use PDF instead of image

## Available Models

| Model | Best For | Speed |
|-------|----------|-------|
| `GX8E2D9A` | Comprehensive analysis | Ultra-fast |
| `GX4B7F3C` | Structured data (labs, prescriptions) | Ultra-fast |
| `GX9A5E1D` | Alternative option | Fast |

## Next Steps

### Learn More
- **Full Documentation**: `api/medical/groq-rag-README.md`
- **Architecture**: `api/medical/groq-rag-architecture.txt`
- **Summary**: `api/medical/GROQ-RAG-SUMMARY.md`

### Advanced Features
- Add Azure OCR for scanned documents
- Integrate with EHR systems
- Set up webhook notifications
- Implement batch processing
- Add audit logging

### Integration Examples
```javascript
// FHIR integration
// Webhook alerts
// EHR synchronization
// Batch document processing
// Real-time analysis
```

See `api/medical/groq-rag-README.md` for complete examples.

## Support

### Resources
- LyDian Acceleration Console: https://console.groq.com
- LyDian Acceleration Docs: https://console.groq.com/docs
- API Reference: `api/medical/groq-rag-README.md`

### Testing
```bash
# Run test suite
node api/medical/groq-rag-test.js

# Run examples
node api/medical/groq-rag-example.js

# Get API info
curl http://localhost:3100/api/medical/groq-rag
```

## Security & Compliance

- ✅ No data storage (in-memory only)
- ✅ Immediate file cleanup
- ✅ No PHI logging
- ✅ Rate limiting
- ✅ CORS enabled
- ⚠️ For informational purposes only
- ⚠️ Requires professional medical review

---

**Ready to go!** 🚀

Start your server and begin analyzing medical documents with ultra-fast AI.

```bash
npm start
```

Then access: http://localhost:3100/api/medical/groq-rag
