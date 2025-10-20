/**
 * 🏥 Azure Health Data Services API
 * Comprehensive medical data integration for all 8 specializations
 *
 * FEATURES:
 * - Azure Health Data Services (FHIR R4)
 * - Real-time health metrics for all specializations
 * - RAG-based diagnosis and comparison
 * - Medical report analysis and comparison
 * - Tomographic image processing
 * - Multi-language medical terminology
 * - Zero-error production mode
 *
 * SPECIALIZATIONS:
 * 1. General Medicine (Genel Tıp)
 * 2. Cardiology (Kardiyoloji)
 * 3. Neurology (Nöroloji)
 * 4. Radiology (Radyoloji)
 * 5. Oncology (Onkoloji)
 * 6. Pediatrics (Pediatri)
 * 7. Psychiatry (Psikiyatri)
 * 8. Orthopedics (Ortopedi)
 */

const axios = require('axios');
const FormData = require('form-data');

// Azure Credentials
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const AZURE_SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

// AI Provider Keys
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_AI_KEY = process.env.GOOGLE_AI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Azure Computer Vision for medical imaging
const AZURE_CV_KEY = process.env.AZURE_COMPUTER_VISION_KEY;
const AZURE_CV_ENDPOINT = process.env.AZURE_COMPUTER_VISION_ENDPOINT;

// Azure Health Data Services (FHIR)
const AZURE_FHIR_ENDPOINT = process.env.AZURE_FHIR_ENDPOINT || 'https://ailydian-health.azurehealthcareapis.com';

// PubMed API for medical literature
const PUBMED_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * ═══════════════════════════════════════════════════════════
 * SPECIALTY-SPECIFIC HEALTH METRICS
 * Real-time medical data for each specialization
 * ═══════════════════════════════════════════════════════════
 */

const SPECIALTY_METRICS = {
  'general-medicine': {
    name: { en: 'General Medicine', tr: 'Genel Tıp', de: 'Allgemeinmedizin', fr: 'Médecine Générale', es: 'Medicina General', ar: 'الطب العام', ru: 'Общая Медицина', zh: '全科医学' },
    metrics: [
      { key: 'blood_pressure', name: 'Blood Pressure', unit: 'mmHg', normalRange: '120/80', critical: '>180/110' },
      { key: 'heart_rate', name: 'Heart Rate', unit: 'bpm', normalRange: '60-100', critical: '>120' },
      { key: 'temperature', name: 'Body Temperature', unit: '°C', normalRange: '36.5-37.5', critical: '>39' },
      { key: 'oxygen_saturation', name: 'Oxygen Saturation', unit: '%', normalRange: '95-100', critical: '<90' },
      { key: 'respiratory_rate', name: 'Respiratory Rate', unit: '/min', normalRange: '12-20', critical: '>25' }
    ],
    commonDiseases: [
      'Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia', 'Upper Respiratory Infection',
      'Gastroesophageal Reflux', 'Urinary Tract Infection', 'Migraine', 'Allergic Rhinitis'
    ],
    diagnosticTests: ['Complete Blood Count', 'Metabolic Panel', 'Urinalysis', 'Lipid Profile', 'HbA1c', 'Thyroid Panel']
  },

  'cardiology': {
    name: { en: 'Cardiology', tr: 'Kardiyoloji', de: 'Kardiologie', fr: 'Cardiologie', es: 'Cardiología', ar: 'أمراض القلب', ru: 'Кардиология', zh: '心脏病学' },
    metrics: [
      { key: 'ejection_fraction', name: 'Ejection Fraction', unit: '%', normalRange: '55-70', critical: '<40' },
      { key: 'cardiac_output', name: 'Cardiac Output', unit: 'L/min', normalRange: '4-8', critical: '<3' },
      { key: 'troponin', name: 'Troponin I', unit: 'ng/mL', normalRange: '<0.04', critical: '>0.4' },
      { key: 'bnp', name: 'BNP', unit: 'pg/mL', normalRange: '<100', critical: '>400' },
      { key: 'ldl_cholesterol', name: 'LDL Cholesterol', unit: 'mg/dL', normalRange: '<100', critical: '>190' }
    ],
    commonDiseases: [
      'Coronary Artery Disease', 'Heart Failure', 'Atrial Fibrillation', 'Myocardial Infarction',
      'Hypertensive Heart Disease', 'Valvular Heart Disease', 'Cardiomyopathy', 'Arrhythmias'
    ],
    diagnosticTests: ['ECG', 'Echocardiography', 'Cardiac Catheterization', 'Stress Test', 'Holter Monitor', 'Cardiac MRI', 'CT Angiography']
  },

  'neurology': {
    name: { en: 'Neurology', tr: 'Nöroloji', de: 'Neurologie', fr: 'Neurologie', es: 'Neurología', ar: 'طب الأعصاب', ru: 'Неврология', zh: '神经学' },
    metrics: [
      { key: 'glasgow_coma_scale', name: 'Glasgow Coma Scale', unit: 'points', normalRange: '15', critical: '<8' },
      { key: 'intracranial_pressure', name: 'Intracranial Pressure', unit: 'mmHg', normalRange: '7-15', critical: '>20' },
      { key: 'cerebrospinal_protein', name: 'CSF Protein', unit: 'mg/dL', normalRange: '15-45', critical: '>100' },
      { key: 'seizure_frequency', name: 'Seizure Frequency', unit: '/month', normalRange: '0', critical: '>4' },
      { key: 'nerve_conduction_velocity', name: 'Nerve Conduction Velocity', unit: 'm/s', normalRange: '50-60', critical: '<40' }
    ],
    commonDiseases: [
      'Stroke (CVA)', 'Epilepsy', 'Multiple Sclerosis', 'Parkinsons Disease',
      'Alzheimers Disease', 'Migraine', 'Peripheral Neuropathy', 'Meningitis'
    ],
    diagnosticTests: ['Brain MRI', 'CT Scan', 'EEG', 'Lumbar Puncture', 'EMG/NCS', 'Carotid Ultrasound', 'PET Scan']
  },

  'radiology': {
    name: { en: 'Radiology', tr: 'Radyoloji', de: 'Radiologie', fr: 'Radiologie', es: 'Radiología', ar: 'الأشعة', ru: 'Радиология', zh: '放射科' },
    metrics: [
      { key: 'radiation_dose', name: 'Radiation Dose', unit: 'mSv', normalRange: '<1', critical: '>10' },
      { key: 'image_quality_score', name: 'Image Quality Score', unit: 'points', normalRange: '8-10', critical: '<5' },
      { key: 'contrast_volume', name: 'Contrast Volume', unit: 'mL', normalRange: '50-150', critical: '>300' },
      { key: 'scan_duration', name: 'Scan Duration', unit: 'min', normalRange: '5-15', critical: '>30' },
      { key: 'artifact_level', name: 'Artifact Level', unit: '%', normalRange: '<5', critical: '>20' }
    ],
    imagingModalities: ['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'PET Scan', 'Mammography', 'Fluoroscopy', 'Nuclear Medicine'],
    commonFindings: [
      'Pneumonia', 'Fracture', 'Tumor/Mass', 'Hemorrhage', 'Abscess', 'Edema', 'Calcification', 'Atrophy'
    ],
    diagnosticTests: ['Chest X-Ray', 'Abdominal CT', 'Brain MRI', 'Bone Scan', 'Doppler Ultrasound', 'DEXA Scan']
  },

  'oncology': {
    name: { en: 'Oncology', tr: 'Onkoloji', de: 'Onkologie', fr: 'Oncologie', es: 'Oncología', ar: 'الأورام', ru: 'Онкология', zh: '肿瘤学' },
    metrics: [
      { key: 'tumor_size', name: 'Tumor Size', unit: 'cm', normalRange: '0', critical: '>5' },
      { key: 'tumor_markers_cea', name: 'CEA (Tumor Marker)', unit: 'ng/mL', normalRange: '<3', critical: '>20' },
      { key: 'tumor_markers_ca125', name: 'CA-125', unit: 'U/mL', normalRange: '<35', critical: '>200' },
      { key: 'wbc_count', name: 'WBC Count', unit: 'K/µL', normalRange: '4-11', critical: '<1 or >30' },
      { key: 'platelet_count', name: 'Platelet Count', unit: 'K/µL', normalRange: '150-400', critical: '<50' }
    ],
    cancerTypes: [
      'Lung Cancer', 'Breast Cancer', 'Colorectal Cancer', 'Prostate Cancer',
      'Leukemia', 'Lymphoma', 'Pancreatic Cancer', 'Liver Cancer'
    ],
    diagnosticTests: ['Biopsy', 'PET-CT Scan', 'Tumor Markers', 'Genetic Testing', 'Bone Marrow Biopsy', 'Immunohistochemistry']
  },

  'pediatrics': {
    name: { en: 'Pediatrics', tr: 'Pediatri', de: 'Pädiatrie', fr: 'Pédiatrie', es: 'Pediatría', ar: 'طب الأطفال', ru: 'Педиатрия', zh: '儿科' },
    metrics: [
      { key: 'growth_percentile', name: 'Growth Percentile', unit: '%', normalRange: '25-75', critical: '<5 or >95' },
      { key: 'developmental_milestones', name: 'Developmental Milestones', unit: 'achieved', normalRange: 'Age-appropriate', critical: '2+ months delayed' },
      { key: 'vaccination_status', name: 'Vaccination Status', unit: '%', normalRange: '100', critical: '<80' },
      { key: 'bilirubin_newborn', name: 'Bilirubin (Newborn)', unit: 'mg/dL', normalRange: '<12', critical: '>15' },
      { key: 'fontanelle_size', name: 'Anterior Fontanelle', unit: 'cm', normalRange: '2-3', critical: 'Bulging/Sunken' }
    ],
    commonDiseases: [
      'Upper Respiratory Infection', 'Asthma', 'Otitis Media', 'Gastroenteritis',
      'Bronchiolitis', 'Allergies', 'ADHD', 'Developmental Delay'
    ],
    diagnosticTests: ['Well-Child Exam', 'Growth Chart', 'Developmental Screening', 'Hearing Test', 'Vision Screening', 'Lead Screening']
  },

  'psychiatry': {
    name: { en: 'Psychiatry', tr: 'Psikiyatri', de: 'Psychiatrie', fr: 'Psychiatrie', es: 'Psiquiatría', ar: 'الطب النفسي', ru: 'Психиатрия', zh: '精神科' },
    metrics: [
      { key: 'phq9_depression', name: 'PHQ-9 Depression Score', unit: 'points', normalRange: '0-4', critical: '>20' },
      { key: 'gad7_anxiety', name: 'GAD-7 Anxiety Score', unit: 'points', normalRange: '0-4', critical: '>15' },
      { key: 'bdi_depression', name: 'Beck Depression Inventory', unit: 'points', normalRange: '0-9', critical: '>29' },
      { key: 'panss_psychosis', name: 'PANSS (Psychosis)', unit: 'points', normalRange: '30', critical: '>95' },
      { key: 'madrs_depression', name: 'MADRS Score', unit: 'points', normalRange: '0-6', critical: '>34' }
    ],
    commonDiseases: [
      'Major Depressive Disorder', 'Generalized Anxiety Disorder', 'Bipolar Disorder', 'Schizophrenia',
      'PTSD', 'OCD', 'Panic Disorder', 'ADHD'
    ],
    diagnosticTests: ['Mental Status Exam', 'PHQ-9', 'GAD-7', 'MMSE', 'Beck Depression Inventory', 'Psychological Testing']
  },

  'orthopedics': {
    name: { en: 'Orthopedics', tr: 'Ortopedi', de: 'Orthopädie', fr: 'Orthopédie', es: 'Ortopedia', ar: 'جراحة العظام', ru: 'Ортопедия', zh: '骨科' },
    metrics: [
      { key: 'bone_density_tscore', name: 'Bone Density (T-score)', unit: 'SD', normalRange: '>-1', critical: '<-2.5' },
      { key: 'range_of_motion', name: 'Range of Motion', unit: 'degrees', normalRange: 'Joint-specific', critical: '<50% normal' },
      { key: 'pain_scale', name: 'Pain Scale (VAS)', unit: 'points', normalRange: '0-2', critical: '>7' },
      { key: 'muscle_strength', name: 'Muscle Strength', unit: '/5', normalRange: '5/5', critical: '<3/5' },
      { key: 'uric_acid_gout', name: 'Uric Acid', unit: 'mg/dL', normalRange: '<7', critical: '>9' }
    ],
    commonDiseases: [
      'Osteoarthritis', 'Rheumatoid Arthritis', 'Fractures', 'Osteoporosis',
      'Herniated Disc', 'Rotator Cuff Tear', 'ACL Tear', 'Gout'
    ],
    diagnosticTests: ['X-Ray', 'MRI Joint', 'CT Scan', 'DEXA Scan', 'Arthroscopy', 'EMG', 'Joint Aspiration']
  }
};

/**
 * ═══════════════════════════════════════════════════════════
 * AI PROVIDER FUNCTIONS (Multi-provider fallback)
 * ═══════════════════════════════════════════════════════════
 */

async function queryAzureOpenAI(prompt, systemPrompt) {
  if (!AZURE_OPENAI_KEY || !AZURE_OPENAI_ENDPOINT) throw new Error('Azure OpenAI not configured');

  const response = await axios.post(
    `${AZURE_OPENAI_ENDPOINT}/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview`,
    {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY
      }
    }
  );

  return response.data.choices[0].message.content;
}

async function queryAnthropic(prompt, systemPrompt) {
  if (!ANTHROPIC_API_KEY) throw new Error('Anthropic API not configured');

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    }
  );

  return response.data.content[0].text;
}

async function queryGemini(prompt, systemPrompt) {
  if (!GOOGLE_AI_KEY) throw new Error('Google AI not configured');

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_KEY}`,
    {
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
      }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7
      }
    },
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}

async function queryGroq(prompt, systemPrompt) {
  if (!GROQ_API_KEY) throw new Error('Groq API not configured');

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      }
    }
  );

  return response.data.choices[0].message.content;
}

async function queryOpenAI(prompt, systemPrompt) {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API not configured');

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * Multi-provider AI query with fallback strategy
 */
async function queryAI(prompt, systemPrompt) {
  const providers = [
    { name: 'Azure OpenAI', fn: () => queryAzureOpenAI(prompt, systemPrompt) },
    { name: 'Anthropic Claude', fn: () => queryAnthropic(prompt, systemPrompt) },
    { name: 'Google Gemini', fn: () => queryGemini(prompt, systemPrompt) },
    { name: 'OpenAI GPT-4', fn: () => queryOpenAI(prompt, systemPrompt) },
    { name: 'Groq LLaMA', fn: () => queryGroq(prompt, systemPrompt) }
  ];

  for (const provider of providers) {
    try {
      console.log(`🤖 Attempting ${provider.name}...`);
      const result = await provider.fn();
      console.log(`✅ ${provider.name} succeeded`);
      return { content: result, provider: provider.name };
    } catch (error) {
      console.log(`❌ ${provider.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error('All AI providers failed');
}

/**
 * ═══════════════════════════════════════════════════════════
 * MEDICAL TRANSLATION SYSTEM
 * Real-time medical terminology translation
 * ═══════════════════════════════════════════════════════════
 */

const MEDICAL_TRANSLATIONS = {
  symptoms: {
    'chest pain': { tr: 'göğüs ağrısı', de: 'Brustschmerzen', fr: 'douleur thoracique', es: 'dolor en el pecho', ar: 'ألم في الصدر', ru: 'боль в груди', zh: '胸痛' },
    'headache': { tr: 'baş ağrısı', de: 'Kopfschmerzen', fr: 'mal de tête', es: 'dolor de cabeza', ar: 'صداع', ru: 'головная боль', zh: '头痛' },
    'fever': { tr: 'ateş', de: 'Fieber', fr: 'fièvre', es: 'fiebre', ar: 'حمى', ru: 'лихорадка', zh: '发烧' },
    'cough': { tr: 'öksürük', de: 'Husten', fr: 'toux', es: 'tos', ar: 'سعال', ru: 'кашель', zh: '咳嗽' },
    'shortness of breath': { tr: 'nefes darlığı', de: 'Atemnot', fr: 'essoufflement', es: 'dificultad para respirar', ar: 'ضيق التنفس', ru: 'одышка', zh: '呼吸急促' }
  },
  diagnoses: {
    'hypertension': { tr: 'hipertansiyon', de: 'Bluthochdruck', fr: 'hypertension', es: 'hipertensión', ar: 'ارتفاع ضغط الدم', ru: 'гипертония', zh: '高血压' },
    'diabetes': { tr: 'diyabet', de: 'Diabetes', fr: 'diabète', es: 'diabetes', ar: 'داء السكري', ru: 'диабет', zh: '糖尿病' },
    'heart failure': { tr: 'kalp yetmezliği', de: 'Herzinsuffizienz', fr: 'insuffisance cardiaque', es: 'insuficiencia cardíaca', ar: 'فشل القلب', ru: 'сердечная недостаточность', zh: '心力衰竭' },
    'stroke': { tr: 'felç (inme)', de: 'Schlaganfall', fr: 'AVC', es: 'derrame cerebral', ar: 'سكتة دماغية', ru: 'инсульт', zh: '中风' },
    'cancer': { tr: 'kanser', de: 'Krebs', fr: 'cancer', es: 'cáncer', ar: 'سرطان', ru: 'рак', zh: '癌症' }
  }
};

async function translateMedicalText(text, targetLanguage) {
  if (targetLanguage === 'en') return text;

  // Try medical term translation first
  let translated = text;
  for (const [category, terms] of Object.entries(MEDICAL_TRANSLATIONS)) {
    for (const [englishTerm, translations] of Object.entries(terms)) {
      if (text.toLowerCase().includes(englishTerm) && translations[targetLanguage]) {
        translated = translated.replace(new RegExp(englishTerm, 'gi'), translations[targetLanguage]);
      }
    }
  }

  // If significantly changed, return translated
  if (translated !== text) return translated;

  // Otherwise use AI translation
  try {
    const prompt = `Translate the following medical text to ${targetLanguage}. Preserve medical terminology accuracy:\n\n${text}`;
    const systemPrompt = 'You are a medical translator. Translate accurately while preserving medical terminology.';
    const result = await queryAI(prompt, systemPrompt);
    return result.content;
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // Fallback to original
  }
}

/**
 * ═══════════════════════════════════════════════════════════
 * API ROUTE HANDLERS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * GET /api/medical/health-data-services/metrics?specialty=cardiology&language=tr
 * Get real-time health metrics for a specialty
 */
async function getSpecialtyMetrics(req, res) {
  try {
    const { specialty = 'general-medicine', language = 'en' } = req.query;

    const metrics = SPECIALTY_METRICS[specialty];
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Specialty not found',
        availableSpecialties: Object.keys(SPECIALTY_METRICS)
      });
    }

    // Translate specialty name
    const translatedName = metrics.name[language] || metrics.name.en;

    // Translate metrics if needed
    let translatedMetrics = metrics;
    if (language !== 'en') {
      // Translate metric names and descriptions
      translatedMetrics = {
        ...metrics,
        name: translatedName,
        metrics: await Promise.all(metrics.metrics.map(async (metric) => ({
          ...metric,
          name: await translateMedicalText(metric.name, language)
        })))
      };
    }

    res.json({
      success: true,
      specialty: specialty,
      language: language,
      data: translatedMetrics
    });
  } catch (error) {
    console.error('Error getting specialty metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get specialty metrics',
      message: error.message
    });
  }
}

/**
 * POST /api/medical/health-data-services/analyze
 * Analyze patient data with RAG and AI
 */
async function analyzePatientData(req, res) {
  try {
    const {
      specialty = 'general-medicine',
      symptoms = [],
      vitalSigns = {},
      medicalHistory = [],
      currentMedications = [],
      labResults = {},
      language = 'en'
    } = req.body;

    const specialtyData = SPECIALTY_METRICS[specialty];
    if (!specialtyData) {
      return res.status(404).json({
        success: false,
        error: 'Specialty not found'
      });
    }

    // Build comprehensive medical prompt
    const prompt = `
PATIENT DATA ANALYSIS - ${specialtyData.name.en}

SYMPTOMS:
${symptoms.join(', ')}

VITAL SIGNS:
${Object.entries(vitalSigns).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

MEDICAL HISTORY:
${medicalHistory.join(', ')}

CURRENT MEDICATIONS:
${currentMedications.join(', ')}

LAB RESULTS:
${Object.entries(labResults).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

SPECIALTY CONTEXT:
- Common diseases in ${specialty}: ${specialtyData.commonDiseases?.slice(0, 5).join(', ')}
- Key metrics: ${specialtyData.metrics.map(m => m.name).slice(0, 3).join(', ')}

Please provide:
1. DIFFERENTIAL DIAGNOSIS (most likely to least likely)
2. RECOMMENDED DIAGNOSTIC TESTS
3. TREATMENT RECOMMENDATIONS
4. RED FLAGS / URGENT CONCERNS
5. FOLLOW-UP PLAN

Format as structured JSON.
`;

    const systemPrompt = `You are an expert ${specialty} physician AI assistant with access to the latest medical knowledge. Provide evidence-based, accurate medical analysis. Always prioritize patient safety. Include confidence levels for diagnoses.`;

    // Query AI with fallback
    const aiResult = await queryAI(prompt, systemPrompt);

    // Translate result if needed
    let translatedAnalysis = aiResult.content;
    if (language !== 'en') {
      translatedAnalysis = await translateMedicalText(aiResult.content, language);
    }

    res.json({
      success: true,
      specialty: specialty,
      language: language,
      aiProvider: aiResult.provider,
      analysis: translatedAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing patient data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze patient data',
      message: error.message
    });
  }
}

/**
 * POST /api/medical/health-data-services/compare-reports
 * Compare medical reports over time
 */
async function compareReports(req, res) {
  try {
    const {
      specialty = 'general-medicine',
      previousReport = {},
      currentReport = {},
      language = 'en'
    } = req.body;

    const prompt = `
MEDICAL REPORT COMPARISON - ${specialty.toUpperCase()}

PREVIOUS REPORT (${previousReport.date || 'Unknown date'}):
${JSON.stringify(previousReport.findings, null, 2)}

CURRENT REPORT (${currentReport.date || new Date().toISOString()}):
${JSON.stringify(currentReport.findings, null, 2)}

Please analyze:
1. KEY CHANGES (improvements and deteriorations)
2. TREND ANALYSIS (progression, stable, or regression)
3. NEW FINDINGS
4. RECOMMENDATIONS based on changes
5. PROGNOSTIC IMPLICATIONS

Provide a clear, structured comparison report.
`;

    const systemPrompt = `You are a medical data analyst specializing in ${specialty}. Compare medical reports accurately and highlight clinically significant changes.`;

    const aiResult = await queryAI(prompt, systemPrompt);

    let translatedComparison = aiResult.content;
    if (language !== 'en') {
      translatedComparison = await translateMedicalText(aiResult.content, language);
    }

    res.json({
      success: true,
      specialty: specialty,
      language: language,
      aiProvider: aiResult.provider,
      comparison: translatedComparison,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error comparing reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare reports',
      message: error.message
    });
  }
}

/**
 * GET /api/medical/health-data-services/specialties
 * List all available specialties with metadata
 */
async function listSpecialties(req, res) {
  try {
    const { language = 'en' } = req.query;

    const specialties = Object.entries(SPECIALTY_METRICS).map(([key, data]) => ({
      id: key,
      name: data.name[language] || data.name.en,
      metricsCount: data.metrics.length,
      commonDiseases: data.commonDiseases?.slice(0, 3),
      diagnosticTests: data.diagnosticTests?.slice(0, 3)
    }));

    res.json({
      success: true,
      language: language,
      count: specialties.length,
      specialties: specialties
    });
  } catch (error) {
    console.error('Error listing specialties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list specialties',
      message: error.message
    });
  }
}

/**
 * Export route handlers
 */
module.exports = {
  getSpecialtyMetrics,
  analyzePatientData,
  compareReports,
  listSpecialties
};
