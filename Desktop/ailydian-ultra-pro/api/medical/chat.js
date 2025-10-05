/**
 * Real Medical AI Chat API
 * Production-ready with Azure OpenAI, Anthropic Claude, Google Gemini
 * Multi-model support with medical expertise
 */

const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const Anthropic = require('@anthropic-ai/sdk');
// Google Gemini support removed to avoid dependency issues
// const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Azure OpenAI
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

// Anthropic Claude
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Google Gemini
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY;

// Groq (fast inference)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      message,
      model = 'premium-model-1',
      specialty = 'general',
      language = 'en',
      conversationHistory = [],
      patientContext = null
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build medical system prompt
    const systemPrompt = buildMedicalSystemPrompt(specialty, language, patientContext);

    // Select AI model and generate response with cascading fallback
    let aiResponse;
    let modelUsed;
    let lastError = null;

    // Try Primary AI Engine (Azure OpenAI GPT-4)
    if (AZURE_OPENAI_KEY && AZURE_OPENAI_ENDPOINT) {
      try {
        aiResponse = await queryAzureOpenAI(message, systemPrompt, conversationHistory);
        modelUsed = 'Ailydian Medical AI - Premium Model';
      } catch (error) {
        console.error('Azure OpenAI failed:', error.message);
        lastError = error;
      }
    }

    // Fallback to Secondary AI Engine (Anthropic Claude)
    if (!aiResponse && ANTHROPIC_API_KEY) {
      try {
        aiResponse = await queryAnthropic(message, systemPrompt, conversationHistory);
        modelUsed = 'Ailydian Medical AI - Advanced Model';
      } catch (error) {
        console.error('Anthropic Claude failed:', error.message);
        lastError = error;
      }
    }

    // Fallback to Fast AI Engine (Groq)
    if (!aiResponse && GROQ_API_KEY) {
      try {
        aiResponse = await queryGroq(message, systemPrompt, conversationHistory);
        modelUsed = 'Ailydian Medical AI - Ultra-Fast Model';
      } catch (error) {
        console.error('Groq failed:', error.message);
        lastError = error;
      }
    }

    // Final fallback - Knowledge base response
    if (!aiResponse) {
      aiResponse = generateFallbackResponse(message, specialty, language);
      modelUsed = 'Ailydian Medical Knowledge Base';
    }

    // Extract medical entities from response
    const medicalEntities = extractMedicalInfo(aiResponse);

    // REMOVED: No disclaimer/footer per user request - clean AI responses only

    res.status(200).json({
      success: true,
      model: model, // Hidden name
      modelUsed: modelUsed, // Actual model for logging
      specialty: specialty,
      language: 'en', // Force English
      response: aiResponse,
      medicalEntities: medicalEntities,
      disclaimer: null, // No disclaimer
      timestamp: new Date().toISOString(),
      conversationId: generateConversationId()
    });

  } catch (error) {
    console.error('Medical chat error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Build medical system prompt based on specialty
 */
function buildMedicalSystemPrompt(specialty, language, patientContext) {
  const specialtyPrompts = {
    cardiology: `You are an expert cardiologist AI assistant. Provide accurate information about cardiovascular health, heart diseases, diagnostic tests, and treatments. Always emphasize the importance of professional medical evaluation.`,

    neurology: `You are an expert neurologist AI assistant. Provide accurate information about neurological conditions, brain and nervous system disorders, diagnostic tests, and treatments. Always recommend professional neurological evaluation.`,

    radiology: `You are an expert radiologist AI assistant. Provide accurate interpretation guidance for medical imaging (X-rays, CT, MRI, ultrasound). Always emphasize that formal radiologist interpretation is required for diagnosis.`,

    oncology: `You are an expert oncologist AI assistant. Provide accurate information about cancer types, treatments, staging, and prognosis. Always emphasize the importance of multidisciplinary cancer care and specialist consultation.`,

    pediatrics: `You are an expert pediatrician AI assistant. Provide accurate information about child health, growth and development, childhood diseases, and treatments. Always emphasize parental guidance and pediatric specialist consultation.`,

    psychiatry: `You are an expert psychiatrist AI assistant. Provide accurate information about mental health conditions, treatments, and support resources. Always emphasize professional mental health evaluation and crisis resources when appropriate.`,

    orthopedics: `You are an expert orthopedic surgeon AI assistant. Provide accurate information about musculoskeletal conditions, injuries, treatments, and rehabilitation. Always recommend proper orthopedic evaluation.`,

    general: `You are an expert general medicine AI assistant. Provide accurate medical information across various specialties. Always emphasize the importance of professional medical evaluation and appropriate specialist referrals.`
  };

  let prompt = specialtyPrompts[specialty] || specialtyPrompts.general;

  // FORCE ENGLISH RESPONSES REGARDLESS OF INPUT LANGUAGE
  prompt += `\n\nCRITICAL INSTRUCTION: You MUST respond in English ONLY, regardless of the input language. Always provide your medical information in English for professional medical communication.`;

  prompt += `\n\nIMPORTANT: You are an AI assistant for informational purposes only. You cannot diagnose, treat, or prescribe. Always recommend consulting healthcare professionals for medical decisions.`;

  if (patientContext) {
    prompt += `\n\nPatient Context: ${JSON.stringify(patientContext)}`;
  }

  return prompt;
}

/**
 * Query Azure OpenAI
 */
async function queryAzureOpenAI(message, systemPrompt, history) {
  const client = new OpenAIClient(AZURE_OPENAI_ENDPOINT, new AzureKeyCredential(AZURE_OPENAI_KEY));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message }
  ];

  const completion = await client.getChatCompletions(AZURE_OPENAI_DEPLOYMENT, messages, {
    temperature: 0.3, // Lower temperature for medical accuracy
    maxTokens: 1500,
    topP: 0.9
  });

  return completion.choices[0].message.content;
}

/**
 * Query Anthropic Claude
 */
async function queryAnthropic(message, systemPrompt, history) {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ]
  });

  return response.content[0].text;
}

/**
 * Query Google Gemini - DISABLED
 */
// async function queryGemini(message, systemPrompt, history) {
//   const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
//   const model = genAI.getGenerativeModel({
//     model: 'gemini-1.5-flash',
//     systemInstruction: systemPrompt
//   });

//   const chat = model.startChat({
//     history: history.map(h => ({
//       role: h.role === 'assistant' ? 'model' : 'user',
//       parts: [{ text: h.content }]
//     }))
//   });

//   const result = await chat.sendMessage(message);
//   return result.response.text();
// }

/**
 * Query Groq (fast inference)
 */
async function queryGroq(message, systemPrompt, history) {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 1500
    },
    {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * Fallback response when no API available
 * FORCE ENGLISH ONLY - No Turkish responses
 */
function generateFallbackResponse(message, specialty, language) {
  // ALWAYS return English response regardless of language parameter
  return `Medical AI system is currently running in limited mode. Your question about "${message.substring(0, 100)}...".\n\nGeneral Recommendations:\n1. Please consult a healthcare professional\n2. In emergency, call emergency services\n3. Document your symptoms in detail\n4. Check medication interactions\n\nThis system cannot diagnose. Professional medical evaluation is required.`;
}

/**
 * Extract medical information from response
 */
function extractMedicalInfo(text) {
  const entities = {
    conditions: [],
    symptoms: [],
    tests: [],
    medications: [],
    urgency: 'standard'
  };

  const lowerText = text.toLowerCase();

  // Detect emergency keywords
  if (lowerText.match(/emergency|urgent|immediate|chest pain|stroke|heart attack|severe bleeding/)) {
    entities.urgency = 'emergency';
  } else if (lowerText.match(/soon|promptly|within.*hours|important|concerning/)) {
    entities.urgency = 'urgent';
  }

  // Extract conditions (basic pattern matching)
  const conditions = ['hypertension', 'diabetes', 'covid', 'pneumonia', 'cancer', 'stroke', 'heart disease'];
  conditions.forEach(condition => {
    if (lowerText.includes(condition)) {
      entities.conditions.push(condition);
    }
  });

  return entities;
}

/**
 * Get medical disclaimer
 */
function getMedicalDisclaimer(language) {
  const disclaimers = {
    tr: '⚕️ Bu yapay zeka asistanı sadece bilgilendirme amaçlıdır. Kesin tanı ve tedavi için mutlaka bir sağlık uzmanına başvurunuz. Acil durumlarda 112\'yi arayın.',
    en: '⚕️ This AI assistant is for informational purposes only. For accurate diagnosis and treatment, please consult a healthcare professional. In emergencies, call emergency services.',
    de: '⚕️ Dieser KI-Assistent dient nur zu Informationszwecken. Für eine genaue Diagnose und Behandlung konsultieren Sie bitte einen Arzt.',
    fr: '⚕️ Cet assistant IA est à titre informatif uniquement. Pour un diagnostic et un traitement précis, consultez un professionnel de santé.',
    es: '⚕️ Este asistente de IA es solo para fines informativos. Para un diagnóstico y tratamiento precisos, consulte a un profesional de la salud.',
    ar: '⚕️ مساعد الذكاء الاصطناعي هذا للأغراض الإعلامية فقط. للتشخيص والعلاج الدقيق، يرجى استشارة أخصائي رعاية صحية.',
    ru: '⚕️ Этот ИИ-помощник предназначен только для информационных целей. Для точного диагноза и лечения обратитесь к медицинскому специалисту.',
    zh: '⚕️ 此AI助手仅供参考。如需准确诊断和治疗，请咨询医疗专业人员。'
  };

  return disclaimers[language] || disclaimers.en;
}

/**
 * Generate conversation ID
 */
function generateConversationId() {
  return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
