/**
 * AI Integration Helper for Medical APIs
 * Real AI API Integration with Azure OpenAI (PRIMARY), Anthropic AX9F7E2B (SECONDARY), OpenAI (FALLBACK)
 * Zero-configuration, production-ready
 * Model names hidden for security
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('lydian-labs');
const { AzureOpenAI } = require('@azure/openai');
const { DefaultAzureCredential, ClientSecretCredential } = require('@azure/identity');

// Initialize Azure OpenAI client (PRIMARY PROVIDER) using Service Principal Authentication
let azureOpenAI = null;

if (process.env.AZURE_OPENAI_ENDPOINT) {
    try {
        // Azure Service Principal Authentication (PRIORITY 1)
        // Uses existing AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID from Vercel
        if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
            const credential = new ClientSecretCredential(
                process.env.AZURE_TENANT_ID,
                process.env.AZURE_CLIENT_ID,
                process.env.AZURE_CLIENT_SECRET
            );

            azureOpenAI = new AzureOpenAI({
                endpoint: process.env.AZURE_OPENAI_ENDPOINT,
                credential: credential,
                apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
                deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'OX5C9E2B'
            });

            console.log('✅ Azure OpenAI initialized with Service Principal (Enterprise-Grade Security)');
        }
        // Fallback to API Key if Service Principal not available
        else if (process.env.AZURE_OPENAI_API_KEY) {
            azureOpenAI = new AzureOpenAI({
                endpoint: process.env.AZURE_OPENAI_ENDPOINT,
                apiKey: process.env.AZURE_OPENAI_API_KEY,
                apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
                deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'OX5C9E2B'
            });

            console.log('✅ Azure OpenAI initialized with API Key');
        }
    } catch (error) {
        console.warn('⚠️ Azure OpenAI initialization failed:', error.message);
        azureOpenAI = null;
    }
}

// Initialize Anthropic AX9F7E2B (SECONDARY PROVIDER)
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Initialize OpenAI (FALLBACK PROVIDER)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * Generate Clinical Differential Diagnosis using AX9F7E2B 3.5 Sonnet
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
            model: process.env.ANTHROPIC_MODEL || 'AX9F7E2B',
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
        console.error('❌ AX9F7E2B API Error:', error.message);
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

        // Try Azure OpenAI first (PRIMARY - using Service Principal)
        if (azureOpenAI) {
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
                    aiProvider: 'Azure Medical AI (Service Principal)', // Model name hidden for security
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
            model: process.env.OPENAI_MODEL || 'OX7A3F8D',
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
 * Analyze Drug-Drug Interactions using AX9F7E2B 3.5 Sonnet
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
            model: process.env.ANTHROPIC_MODEL || 'AX9F7E2B',
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
        console.error('❌ AX9F7E2B API Error:', error.message);
        return null;
    }
}

/**
 * Generate SOAP Notes using OX7A3F8D
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
            model: process.env.OPENAI_MODEL || 'OX7A3F8D',
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
 * Extract ICD-10 Codes using AX9F7E2B 3.5 Sonnet
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
            model: process.env.ANTHROPIC_MODEL || 'AX9F7E2B',
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
        console.error('❌ AX9F7E2B API Error:', error.message);
        return null;
    }
}

/**
 * Clinical NER using OX7A3F8D
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
            model: process.env.OPENAI_MODEL || 'OX7A3F8D',
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
 * Generate Radiology Report using OX7A3F8D Vision or AX9F7E2B 3.5 Sonnet
 */
async function generateRadiologyReportAI(imageDescription, clinicalQuestion, patientHistory) {
    try {
        const prompt = `You are an expert radiologist. Analyze the following medical image and provide a comprehensive radiology report:

Image Description: ${imageDescription}
Clinical Question: ${clinicalQuestion}
Patient History: ${JSON.stringify(patientHistory)}

Provide a structured radiology report with:
1. Technique
2. Findings (detailed description)
3. Differential Diagnosis (top 3 possibilities with probability)
4. Recommendations (next steps, additional imaging, clinical correlation)
5. Critical Findings (if any urgent/emergent findings)

Format as JSON with structure:
{
  "analysis": {
    "technique": "...",
    "findings": ["..."],
    "impression": "..."
  },
  "differentialDiagnosis": [
    {
      "diagnosis": "...",
      "probability": "High/Moderate/Low",
      "supportingFindings": ["..."]
    }
  ],
  "recommendations": ["..."],
  "criticalFindings": ["..."],
  "confidence": 0.95
}`;

        // Try Azure OpenAI first (PRIMARY - with Service Principal)
        if (azureOpenAI) {
            try {
                const completion = await azureOpenAI.chat.completions.create({
                    messages: [{
                        role: 'system',
                        content: 'You are an expert radiologist AI assistant specializing in medical image interpretation.'
                    }, {
                        role: 'user',
                        content: prompt
                    }],
                    temperature: 0.2, // Low temperature for medical accuracy
                    max_tokens: 2048,
                    response_format: { type: 'json_object' }
                });

                const responseText = completion.choices[0].message.content;
                const parsedResponse = JSON.parse(responseText);

                return {
                    success: true,
                    aiProvider: 'Azure Radiology AI (Service Principal)', // Model name hidden
                    ...parsedResponse
                };
            } catch (azureError) {
                console.warn('⚠️ Azure OpenAI error, falling back to Anthropic:', azureError.message);
            }
        }

        // Fallback to Anthropic AX9F7E2B
        if (process.env.ANTHROPIC_API_KEY) {
            try {
                const message = await anthropic.messages.create({
                    model: process.env.ANTHROPIC_MODEL || 'AX9F7E2B',
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
                        aiProvider: 'Advanced Radiology AI', // Model name hidden
                        ...parsedResponse
                    };
                }
            } catch (anthropicError) {
                console.warn('⚠️ Anthropic error, falling back to OpenAI:', anthropicError.message);
            }
        }

        // Fallback to OpenAI
        if (process.env.OPENAI_API_KEY) {
            const completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'OX7A3F8D',
                messages: [{
                    role: 'system',
                    content: 'You are an expert radiologist AI assistant specializing in medical image interpretation.'
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
                aiProvider: 'Clinical Imaging AI', // Model name hidden
                ...parsedResponse
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Radiology AI Error:', error.message);
        return null;
    }
}

/**
 * Check if real AI is available
 */
function isRealAIAvailable() {
    const hasAzureOpenAI = azureOpenAI !== null;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    return hasAzureOpenAI || hasAnthropic || hasOpenAI;
}

module.exports = {
    generateDifferentialDiagnosisAI,
    generateTreatmentProtocolAI,
    analyzeDrugInteractionsAI,
    generateSOAPNotesAI,
    extractICD10CodesAI,
    extractClinicalEntitiesAI,
    generateRadiologyReportAI,
    isRealAIAvailable
};
