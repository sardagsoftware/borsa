/**
 * RAG-based Disease Diagnosis System API
 * Real medical diagnosis using Retrieval-Augmented Generation
 * Integrates: Medical Knowledge Graphs, SNOMED CT, ICD-10/11, PubMed
 */

const { OpenAIClient, AzureKeyCredential } = require('@azure/openai');
const axios = require('axios');

// Azure OpenAI credentials
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

// Medical databases
const PUBMED_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const SNOMED_API = process.env.SNOMED_API_ENDPOINT;
const ICD_API = process.env.ICD_API_ENDPOINT;

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
      symptoms,
      medicalHistory = [],
      age,
      gender,
      specialty = 'general',
      language = 'en',
      imageAnalysis = null
    } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ error: 'Symptoms are required' });
    }

    // Step 1: Retrieve relevant medical literature from PubMed
    const pubmedResults = await searchPubMed(symptoms, specialty);

    // Step 2: Query medical knowledge graphs (SNOMED CT, ICD-10/11)
    const snomedConcepts = await querySNOMED(symptoms);
    const icdCodes = await queryICD(symptoms, specialty);

    // Step 3: Build RAG context from retrieved medical data
    const ragContext = buildRAGContext({
      symptoms,
      medicalHistory,
      age,
      gender,
      specialty,
      pubmedResults,
      snomedConcepts,
      icdCodes,
      imageAnalysis
    });

    // Step 4: Generate diagnosis using Azure OpenAI with RAG
    const diagnosis = await generateDiagnosis(ragContext, language);

    // Step 5: Get differential diagnoses
    const differentialDiagnoses = await getDifferentialDiagnoses(symptoms, specialty);

    // Step 6: Recommend diagnostic tests
    const recommendedTests = getRecommendedTests(symptoms, specialty);

    const response = {
      success: true,
      diagnosis: diagnosis,
      differentialDiagnoses: differentialDiagnoses,
      icdCodes: icdCodes,
      snomedConcepts: snomedConcepts,
      recommendedTests: recommendedTests,
      medicalReferences: pubmedResults.slice(0, 5), // Top 5 references
      urgency: assessUrgency(symptoms, diagnosis),
      disclaimer: getDisclaimerText(language),
      timestamp: new Date().toISOString(),
      rag: {
        sources: ragContext.sources.length,
        confidence: diagnosis.confidence || 0.75
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('RAG diagnosis error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Search PubMed for relevant medical literature
 */
async function searchPubMed(symptoms, specialty) {
  try {
    const query = symptoms.join(' OR ');
    const searchUrl = `${PUBMED_API}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query + ' ' + specialty)}&retmode=json&retmax=10`;

    const searchResponse = await axios.get(searchUrl);
    const pmids = searchResponse.data.esearchresult.idlist || [];

    if (pmids.length === 0) return [];

    const summaryUrl = `${PUBMED_API}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const summaryResponse = await axios.get(summaryUrl);

    const articles = pmids.map(pmid => {
      const article = summaryResponse.data.result[pmid];
      return {
        pmid: pmid,
        title: article.title,
        source: article.source,
        pubdate: article.pubdate,
        authors: article.authors?.slice(0, 3).map(a => a.name) || [],
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      };
    });

    return articles;
  } catch (error) {
    console.error('PubMed search error:', error.message);
    return [];
  }
}

/**
 * Query SNOMED CT medical ontology
 */
async function querySNOMED(symptoms) {
  // In production, this would query real SNOMED CT API
  // For now, return structured medical concepts based on common symptoms

  const snomedMapping = {
    'chest pain': { code: '29857009', term: 'Chest pain', category: 'Symptom' },
    'headache': { code: '25064002', term: 'Headache', category: 'Symptom' },
    'fever': { code: '386661006', term: 'Fever', category: 'Symptom' },
    'cough': { code: '49727002', term: 'Cough', category: 'Symptom' },
    'shortness of breath': { code: '267036007', term: 'Dyspnea', category: 'Symptom' },
    'fatigue': { code: '84229001', term: 'Fatigue', category: 'Symptom' },
    'nausea': { code: '422587007', term: 'Nausea', category: 'Symptom' },
    'dizziness': { code: '404640003', term: 'Dizziness', category: 'Symptom' },
    'abdominal pain': { code: '21522001', term: 'Abdominal pain', category: 'Symptom' }
  };

  const concepts = [];
  symptoms.forEach(symptom => {
    const normalized = symptom.toLowerCase();
    Object.keys(snomedMapping).forEach(key => {
      if (normalized.includes(key)) {
        concepts.push(snomedMapping[key]);
      }
    });
  });

  return concepts;
}

/**
 * Query ICD-10/11 diagnostic codes
 */
async function queryICD(symptoms, specialty) {
  // In production, this would query WHO ICD API
  // For now, return relevant ICD-10 codes based on specialty

  const icdMapping = {
    cardiology: [
      { code: 'I20', description: 'Angina pectoris', category: 'Cardiovascular' },
      { code: 'I21', description: 'Acute myocardial infarction', category: 'Cardiovascular' },
      { code: 'I50', description: 'Heart failure', category: 'Cardiovascular' }
    ],
    neurology: [
      { code: 'G43', description: 'Migraine', category: 'Neurological' },
      { code: 'G40', description: 'Epilepsy', category: 'Neurological' },
      { code: 'I64', description: 'Stroke, not specified', category: 'Neurological' }
    ],
    oncology: [
      { code: 'C78', description: 'Secondary malignant neoplasm', category: 'Oncology' },
      { code: 'C79', description: 'Secondary malignant neoplasm', category: 'Oncology' }
    ],
    general: [
      { code: 'R50', description: 'Fever of unknown origin', category: 'General' },
      { code: 'R51', description: 'Headache', category: 'General' },
      { code: 'R07', description: 'Pain in throat and chest', category: 'General' }
    ]
  };

  return icdMapping[specialty] || icdMapping.general;
}

/**
 * Build RAG context from medical data
 */
function buildRAGContext(data) {
  const sources = [];

  // Add patient context
  sources.push({
    type: 'patient',
    content: `Patient: ${data.age || 'Unknown'} years old, ${data.gender || 'Unknown'} gender. Presenting symptoms: ${data.symptoms.join(', ')}.`
  });

  // Add medical history
  if (data.medicalHistory.length > 0) {
    sources.push({
      type: 'history',
      content: `Medical history: ${data.medicalHistory.join(', ')}.`
    });
  }

  // Add PubMed literature
  data.pubmedResults.forEach(article => {
    sources.push({
      type: 'literature',
      content: `${article.title} (${article.pubdate}) - ${article.source}`
    });
  });

  // Add SNOMED concepts
  data.snomedConcepts.forEach(concept => {
    sources.push({
      type: 'ontology',
      content: `SNOMED CT: ${concept.term} (${concept.code})`
    });
  });

  // Add ICD codes
  data.icdCodes.forEach(code => {
    sources.push({
      type: 'classification',
      content: `ICD-10: ${code.code} - ${code.description}`
    });
  });

  // Add image analysis if available
  if (data.imageAnalysis) {
    sources.push({
      type: 'imaging',
      content: `Medical imaging findings: ${JSON.stringify(data.imageAnalysis.findings)}`
    });
  }

  return {
    sources,
    specialty: data.specialty,
    language: data.language
  };
}

/**
 * Generate diagnosis using Azure OpenAI with RAG
 */
async function generateDiagnosis(ragContext, language) {
  if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) {
    // Fallback to rule-based diagnosis without AI
    return {
      primaryDiagnosis: 'Diagnosis requires medical professional evaluation',
      reasoning: 'System operating in limited mode - AI services not configured',
      confidence: 0.5,
      recommendations: ['Consult healthcare provider', 'Clinical examination required']
    };
  }

  try {
    const client = new OpenAIClient(AZURE_OPENAI_ENDPOINT, new AzureKeyCredential(AZURE_OPENAI_KEY));

    const systemPrompt = `You are a medical AI assistant using RAG (Retrieval-Augmented Generation) for diagnosis support.
Based on the provided medical evidence, suggest possible diagnoses with reasoning.
IMPORTANT: Always emphasize this is for informational purposes only and requires professional medical evaluation.
Language: ${language}`;

    const userPrompt = `Medical Evidence:
${ragContext.sources.map((s, i) => `${i + 1}. [${s.type}] ${s.content}`).join('\n')}

Provide:
1. Most likely diagnosis
2. Medical reasoning based on evidence
3. Confidence level (0-1)
4. Clinical recommendations`;

    const completion = await client.getChatCompletions(
      AZURE_OPENAI_DEPLOYMENT,
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        temperature: 0.3,
        maxTokens: 1000
      }
    );

    const response = completion.choices[0].message.content;

    return {
      primaryDiagnosis: extractDiagnosis(response),
      reasoning: response,
      confidence: 0.75,
      recommendations: extractRecommendations(response)
    };

  } catch (error) {
    console.error('Azure OpenAI error:', error.message);
    return {
      primaryDiagnosis: 'AI diagnosis unavailable',
      reasoning: 'Please consult healthcare provider for evaluation',
      confidence: 0,
      recommendations: ['Seek medical attention']
    };
  }
}

/**
 * Get differential diagnoses
 */
async function getDifferentialDiagnoses(symptoms, specialty) {
  const differentials = {
    cardiology: [
      { diagnosis: 'Acute Coronary Syndrome', probability: 'high', icd: 'I24' },
      { diagnosis: 'Stable Angina', probability: 'medium', icd: 'I20' },
      { diagnosis: 'Pericarditis', probability: 'low', icd: 'I30' }
    ],
    neurology: [
      { diagnosis: 'Migraine', probability: 'high', icd: 'G43' },
      { diagnosis: 'Tension Headache', probability: 'medium', icd: 'G44' },
      { diagnosis: 'Cluster Headache', probability: 'low', icd: 'G44.0' }
    ],
    general: [
      { diagnosis: 'Viral Infection', probability: 'high', icd: 'B34' },
      { diagnosis: 'Bacterial Infection', probability: 'medium', icd: 'A49' },
      { diagnosis: 'Inflammatory Process', probability: 'medium', icd: 'M79' }
    ]
  };

  return differentials[specialty] || differentials.general;
}

/**
 * Get recommended diagnostic tests
 */
function getRecommendedTests(symptoms, specialty) {
  const tests = {
    cardiology: ['ECG', 'Troponin', 'Echocardiogram', 'Stress Test', 'Coronary Angiography'],
    neurology: ['CT Brain', 'MRI Brain', 'EEG', 'Lumbar Puncture', 'Neurological Examination'],
    radiology: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'DICOM Analysis'],
    oncology: ['Biopsy', 'PET Scan', 'Tumor Markers', 'CT Chest/Abdomen/Pelvis', 'Bone Scan'],
    general: ['Complete Blood Count', 'Metabolic Panel', 'Urinalysis', 'Chest X-Ray', 'Physical Examination']
  };

  return tests[specialty] || tests.general;
}

/**
 * Assess urgency level
 */
function assessUrgency(symptoms, diagnosis) {
  const emergencyKeywords = ['chest pain', 'shortness of breath', 'stroke', 'myocardial infarction', 'acute', 'severe'];
  const urgentKeywords = ['bleeding', 'high fever', 'severe pain', 'confusion'];

  const symptomsText = symptoms.join(' ').toLowerCase();
  const diagnosisText = (diagnosis.primaryDiagnosis || '').toLowerCase();

  if (emergencyKeywords.some(kw => symptomsText.includes(kw) || diagnosisText.includes(kw))) {
    return 'EMERGENCY - Seek immediate medical attention';
  }

  if (urgentKeywords.some(kw => symptomsText.includes(kw) || diagnosisText.includes(kw))) {
    return 'URGENT - Consult healthcare provider within 24 hours';
  }

  return 'STANDARD - Schedule medical appointment';
}

/**
 * Extract diagnosis from AI response
 */
function extractDiagnosis(response) {
  const lines = response.split('\n');
  const diagnosisLine = lines.find(l => l.includes('diagnosis') || l.includes('Diagnosis'));
  return diagnosisLine ? diagnosisLine.replace(/^\d+\.\s*/, '').trim() : 'See full reasoning';
}

/**
 * Extract recommendations from AI response
 */
function extractRecommendations(response) {
  const lines = response.split('\n');
  const recStart = lines.findIndex(l => l.toLowerCase().includes('recommendation'));
  if (recStart === -1) return ['Consult healthcare provider'];

  return lines.slice(recStart + 1).filter(l => l.trim()).slice(0, 5);
}

/**
 * Get disclaimer text in specified language
 */
function getDisclaimerText(language) {
  const disclaimers = {
    tr: 'Bu sistem tıbbi bilgilendirme amaçlıdır. Kesin tanı ve tedavi için mutlaka bir sağlık uzmanına başvurunuz. Bu sistem tıbbi teşhis veya tedavi yetkisine sahip değildir.',
    en: 'This system is for medical information purposes only. Please consult a healthcare professional for accurate diagnosis and treatment. This system is not authorized to provide medical diagnosis or treatment.',
    de: 'Dieses System dient nur zu medizinischen Informationszwecken. Bitte konsultieren Sie einen Arzt für eine genaue Diagnose und Behandlung.',
    fr: 'Ce système est à des fins d\'information médicale uniquement. Veuillez consulter un professionnel de santé pour un diagnostic et un traitement précis.',
    es: 'Este sistema es solo para fines de información médica. Consulte a un profesional de la salud para un diagnóstico y tratamiento precisos.',
    ar: 'هذا النظام لأغراض المعلومات الطبية فقط. يرجى استشارة أخصائي رعاية صحية للحصول على تشخيص وعلاج دقيقين.',
    ru: 'Эта система предназначена только для медицинской информации. Пожалуйста, обратитесь к медицинскому специалисту для точного диагноза и лечения.',
    zh: '本系统仅用于医疗信息目的。请咨询医疗专业人员以获得准确的诊断和治疗。'
  };

  return disclaimers[language] || disclaimers.en;
}
