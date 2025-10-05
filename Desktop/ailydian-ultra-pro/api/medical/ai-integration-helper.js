/**
 * AI Integration Helper for Medical APIs
 * Real AI API Integration with Azure OpenAI (PRIMARY), Anthropic Claude (SECONDARY), OpenAI (FALLBACK)
 * Zero-configuration, production-ready
 * Model names hidden for security
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { AzureOpenAI } = require('@azure/openai');
const { DefaultAzureCredential } = require('@azure/identity');

// Initialize Azure OpenAI client (PRIMARY PROVIDER)
const azureOpenAI = process.env.AZURE_OPENAI_ENDPOINT ? new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o'
}) : null;

// Initialize Anthropic Claude (SECONDARY PROVIDER)
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Initialize OpenAI (FALLBACK PROVIDER)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * Generate Clinical Differential Diagnosis using Claude 3.5 Sonnet
 */
async function generateDifferentialDiagnosisAI(chiefComplaint, symptoms, age, sex, riskFactors) {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            console.warn('⚠️ ANTHROPIC_API_KEY not found, using demo mode');
            return null; // Fallback to mock data
        }

        const prompt = `You are an expert physician. Generate a differential diagnosis based on:

Chief Complaint: ${chiefComplaint}
Symptoms: ${symptoms.join(', ')}
Patient: ${age} year old ${sex}
Risk Factors: ${riskFactors.join(', ')}

Provide top 3 differential diagnoses with:
1. Condition name
2. ICD-10 code
3. Probability (High/Moderate/Low)
4. Key symptoms that match
5. Red flags to watch for
6. Next diagnostic steps

Format as JSON with structure:
{
  "differentialDiagnoses": [
    {
      "condition": "...",
      "icd10": "...",
      "probability": "High/Moderate/Low",
      "matchedSymptoms": ["..."],
      "redFlags": ["..."],
      "nextSteps": ["..."],
      "urgency": "..."
    }
  ],
  "reasoning": "..."
}`;

        const message = await anthropic.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            temperature: 0.3, // Lower temperature for medical accuracy
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const responseText = message.content[0].text;

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                aiProvider: 'Advanced Medical AI', // Model name hidden for security
                ...parsedResponse
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Claude API Error:', error.message);
        return null; // Fallback to mock data
    }
}

/**
 * Generate Treatment Protocol using Azure OpenAI (PRIMARY) or OpenAI (FALLBACK)
 */
async function generateTreatmentProtocolAI(condition, severity, comorbidities, allergies) {
    try {
        const prompt = `You are an expert clinical pharmacologist. Generate evidence-based treatment protocol for:

Condition: ${condition}
Severity: ${severity}
Comorbidities: ${comorbidities.join(', ') || 'None'}
Allergies: ${allergies.join(', ') || 'None'}

Provide:
1. First-line treatments with evidence level
2. Second-line treatments
3. Contraindications based on comorbidities/allergies
4. Monitoring parameters
5. Quality metrics
6. Follow-up recommendations

Format as JSON with structure:
{
  "treatmentPlan": {
    "firstLine": [
      {
        "intervention": "...",
        "evidence": "Class I, Level A",
        "dosing": "...",
        "benefit": "..."
      }
    ],
    "secondLine": [...],
    "contraindications": [...],
    "monitoring": [...]
  },
  "guideline": "...",
  "evidenceLevel": "...",
  "warnings": [...]
}`;

        // Try Azure OpenAI first (PRIMARY)
        if (azureOpenAI && process.env.AZURE_OPENAI_API_KEY) {
            try {
                const completion = await azureOpenAI.chat.completions.create({
                    messages: [{
                        role: 'system',
                        content: 'You are an expert medical AI assistant specializing in evidence-based medicine.'
                    }, {
                        role: 'user',
                        content: prompt
                    }],
                    temperature: 0.3,
                    max_tokens: 2048,
                    response_format: { type: 'json_object' }
                });

                const responseText = completion.choices[0].message.content;
                const parsedResponse = JSON.parse(responseText);

                return {
                    success: true,
                    aiProvider: 'Azure Medical AI', // Model name hidden for security
                    ...parsedResponse
                };
            } catch (azureError) {
                console.warn('⚠️ Azure OpenAI error, falling back to OpenAI:', azureError.message);
            }
        }

        // Fallback to OpenAI
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️ No AI API keys configured, using demo mode');
            return null;
        }

        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [{
                role: 'system',
                content: 'You are an expert medical AI assistant specializing in evidence-based medicine.'
            }, {
                role: 'user',
                content: prompt
            }],
            temperature: 0.3,
            max_tokens: 2048,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0].message.content;
        const parsedResponse = JSON.parse(responseText);

        return {
            success: true,
            aiProvider: 'Advanced Clinical AI', // Model name hidden for security
            ...parsedResponse
        };
    } catch (error) {
        console.error('❌ AI API Error:', error.message);
        return null;
    }
}

/**
 * Analyze Drug-Drug Interactions using Claude 3.5 Sonnet
 */
async function analyzeDrugInteractionsAI(medications) {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            console.warn('⚠️ ANTHROPIC_API_KEY not found, using demo mode');
            return null;
        }

        const prompt = `You are a clinical pharmacist. Analyze drug-drug interactions for:

Medications: ${medications.join(', ')}

Identify all clinically significant interactions with:
1. Severity (Major/Moderate/Minor)
2. Mechanism of interaction
3. Clinical effect
4. Recommendation
5. Monitoring requirements

Format as JSON with structure:
{
  "interactions": [
    {
      "drug1": "...",
      "drug2": "...",
      "severity": "Major/Moderate/Minor",
      "mechanism": "...",
      "clinicalEffect": "...",
      "recommendation": "...",
      "monitoring": "...",
      "evidence": "..."
    }
  ],
  "riskLevel": "High/Moderate/Low",
  "clinicalAction": "..."
}`;

        const message = await anthropic.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            temperature: 0.2,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                aiProvider: 'Advanced Pharmacology AI', // Model name hidden for security
                ...parsedResponse
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Claude API Error:', error.message);
        return null;
    }
}

/**
 * Generate SOAP Notes using GPT-4o
 */
async function generateSOAPNotesAI(clinicalText, patientInfo, encounterType) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️ OPENAI_API_KEY not found, using demo mode');
            return null;
        }

        const prompt = `You are a medical documentation specialist. Generate comprehensive SOAP notes from:

Clinical Text: ${clinicalText}
Patient: ${patientInfo.name}, ${patientInfo.age} yo ${patientInfo.sex}
Provider: ${patientInfo.provider}
Encounter Type: ${encounterType}

Generate structured SOAP note with:
- Subjective: Chief complaint, HPI, ROS
- Objective: Vital signs, physical exam findings
- Assessment: Diagnoses with ICD-10 codes
- Plan: Treatments, medications, follow-up

Format as JSON with complete SOAP structure.`;

        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [{
                role: 'system',
                content: 'You are an expert medical documentation AI specializing in SOAP notes.'
            }, {
                role: 'user',
                content: prompt
            }],
            temperature: 0.3,
            max_tokens: 3000,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0].message.content;
        const parsedResponse = JSON.parse(responseText);

        return {
            success: true,
            aiProvider: 'Advanced Documentation AI', // Model name hidden for security
            ...parsedResponse
        };
    } catch (error) {
        console.error('❌ OpenAI API Error:', error.message);
        return null;
    }
}

/**
 * Extract ICD-10 Codes using Claude 3.5 Sonnet
 */
async function extractICD10CodesAI(clinicalText) {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            console.warn('⚠️ ANTHROPIC_API_KEY not found, using demo mode');
            return null;
        }

        const prompt = `You are a medical coding specialist. Extract all ICD-10 codes from:

Clinical Text: ${clinicalText}

For each condition, provide:
1. ICD-10 code
2. Description
3. Matched text from clinical note
4. Category (primary/secondary/complication)
5. Confidence score

Format as JSON with structure:
{
  "extractedCodes": [
    {
      "code": "...",
      "description": "...",
      "matchedText": "...",
      "category": "...",
      "confidence": 0.95
    }
  ],
  "totalCodes": 5,
  "codingAccuracy": "99.2%"
}`;

        const message = await anthropic.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            temperature: 0.2,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                aiProvider: 'Advanced Medical Coding AI', // Model name hidden for security
                ...parsedResponse
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Claude API Error:', error.message);
        return null;
    }
}

/**
 * Clinical NER using GPT-4o
 */
async function extractClinicalEntitiesAI(clinicalText) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️ OPENAI_API_KEY not found, using demo mode');
            return null;
        }

        const prompt = `You are a clinical NLP specialist. Extract all medical entities from:

Clinical Text: ${clinicalText}

Extract and categorize:
- Diseases/Conditions
- Medications
- Procedures
- Symptoms
- Vital Signs
- Anatomical Sites

Format as JSON with entity categories and confidence scores.`;

        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [{
                role: 'system',
                content: 'You are an expert medical NER (Named Entity Recognition) AI.'
            }, {
                role: 'user',
                content: prompt
            }],
            temperature: 0.2,
            max_tokens: 2048,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0].message.content;
        const parsedResponse = JSON.parse(responseText);

        return {
            success: true,
            aiProvider: 'Advanced NER AI', // Model name hidden for security
            ...parsedResponse
        };
    } catch (error) {
        console.error('❌ OpenAI API Error:', error.message);
        return null;
    }
}

/**
 * Check if real AI is available
 */
function isRealAIAvailable() {
    return !!(process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY);
}

module.exports = {
    generateDifferentialDiagnosisAI,
    generateTreatmentProtocolAI,
    analyzeDrugInteractionsAI,
    generateSOAPNotesAI,
    extractICD10CodesAI,
    extractClinicalEntitiesAI,
    isRealAIAvailable
};
