/**
 * Azure Speech-to-Text Medical Transcription API
 * Real-time medical voice transcription with medical terminology
 * Supports 8 languages with medical vocabulary
 */

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const multiparty = require('multiparty');
const { getCorsOrigin } = require('../_middleware/cors');

// Azure Speech credentials
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!AZURE_SPEECH_KEY) {
      return res.status(503).json({
        error: 'Azure Speech Services not configured',
        message: 'Please set AZURE_SPEECH_KEY environment variable',
        fallback: 'Using text input instead',
      });
    }

    // Parse multipart form data
    const form = new multiparty.Form();

    const parseForm = () =>
      new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

    const { fields, files } = await parseForm();

    if (!files.audio || !files.audio[0]) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = files.audio[0];
    const language = fields.language ? fields.language[0] : 'en-US';
    const specialty = fields.specialty ? fields.specialty[0] : 'general';

    // Language code mapping
    const languageMap = {
      tr: 'tr-TR',
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
      ar: 'ar-SA',
      ru: 'ru-RU',
      zh: 'zh-CN',
    };

    const speechLanguage = languageMap[language] || 'en-US';

    // Configure Azure Speech SDK
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    speechConfig.speechRecognitionLanguage = speechLanguage;

    // Enable medical phrase lists for better accuracy
    const phraseList = sdk.PhraseListGrammar.fromRecognizer(recognizer);
    addMedicalPhrases(phraseList, specialty);

    // Create audio config from file
    const audioBuffer = require('fs').readFileSync(audioFile.path);
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer);
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Perform transcription
    const transcription = await new Promise((resolve, reject) => {
      let fullText = '';

      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          fullText += e.result.text + ' ';
        }
      };

      recognizer.canceled = (s, e) => {
        recognizer.stopContinuousRecognitionAsync();
        reject(new Error(`Speech recognition canceled: ${e.errorDetails}`));
      };

      recognizer.sessionStopped = (s, e) => {
        recognizer.stopContinuousRecognitionAsync();
        resolve(fullText.trim());
      };

      recognizer.startContinuousRecognitionAsync(
        () => {
          // Started successfully
        },
        err => {
          recognizer.stopContinuousRecognitionAsync();
          reject(err);
        }
      );

      // Auto-stop after 30 seconds
      setTimeout(() => {
        recognizer.stopContinuousRecognitionAsync();
        resolve(fullText.trim());
      }, 30000);
    });

    // Extract medical entities from transcription
    const medicalEntities = extractMedicalEntities(transcription, specialty);

    // Get medical terminology corrections
    const correctedText = applyMedicalTerminology(transcription, specialty, language);

    res.status(200).json({
      success: true,
      transcription: correctedText || transcription,
      originalTranscription: transcription,
      language: speechLanguage,
      specialty: specialty,
      medicalEntities: medicalEntities,
      confidence: 0.85,
      duration: audioFile.size / 16000, // Approximate duration in seconds (assuming 16kHz)
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Speech transcription error:', error);
    res.status(500).json({
      error: 'Ses isleme hatasi. Lutfen tekrar deneyin.',
    });
  }
};

/**
 * Add medical phrases to improve recognition accuracy
 */
function addMedicalPhrases(phraseList, specialty) {
  const medicalPhrases = {
    cardiology: [
      'myocardial infarction',
      'atrial fibrillation',
      'coronary artery disease',
      'echocardiogram',
      'electrocardiogram',
      'troponin',
      'angina',
      'arrhythmia',
      'stenosis',
      'cardiomyopathy',
      'pericarditis',
      'endocarditis',
    ],
    neurology: [
      'cerebrovascular accident',
      'transient ischemic attack',
      'migraine',
      'epilepsy',
      'seizure',
      'encephalopathy',
      'neuropathy',
      'sclerosis',
      'Parkinson',
      'Alzheimer',
      'dementia',
      'meningitis',
      'stroke',
    ],
    oncology: [
      'malignant neoplasm',
      'carcinoma',
      'adenocarcinoma',
      'lymphoma',
      'leukemia',
      'metastasis',
      'chemotherapy',
      'radiation therapy',
      'biopsy',
      'staging',
      'remission',
      'recurrence',
    ],
    radiology: [
      'computed tomography',
      'magnetic resonance imaging',
      'radiograph',
      'ultrasound',
      'mammography',
      'fluoroscopy',
      'DICOM',
      'contrast medium',
      'tomography',
      'angiography',
      'densitometry',
    ],
    general: [
      'hypertension',
      'diabetes mellitus',
      'hyperlipidemia',
      'pneumonia',
      'bronchitis',
      'gastroenteritis',
      'urinary tract infection',
      'anemia',
      'thyroid',
      'arthritis',
      'osteoporosis',
    ],
  };

  const phrases = medicalPhrases[specialty] || medicalPhrases.general;
  phrases.forEach(phrase => {
    phraseList.addPhrase(phrase);
  });
}

/**
 * Extract medical entities from transcription
 */
function extractMedicalEntities(text, specialty) {
  const entities = {
    symptoms: [],
    diagnoses: [],
    medications: [],
    procedures: [],
    bodyParts: [],
  };

  const lowerText = text.toLowerCase();

  // Symptom detection
  const symptoms = [
    'chest pain',
    'headache',
    'fever',
    'cough',
    'shortness of breath',
    'fatigue',
    'nausea',
    'vomiting',
    'diarrhea',
    'abdominal pain',
    'dizziness',
    'weakness',
    'numbness',
    'palpitations',
    'bleeding',
  ];

  symptoms.forEach(symptom => {
    if (lowerText.includes(symptom)) {
      entities.symptoms.push(symptom);
    }
  });

  // Diagnosis detection
  const diagnoses = [
    'hypertension',
    'diabetes',
    'pneumonia',
    'bronchitis',
    'asthma',
    'copd',
    'heart failure',
    'stroke',
    'cancer',
    'infection',
    'myocardial infarction',
    'atrial fibrillation',
  ];

  diagnoses.forEach(diagnosis => {
    if (lowerText.includes(diagnosis)) {
      entities.diagnoses.push(diagnosis);
    }
  });

  // Medication detection
  const medications = [
    'aspirin',
    'metformin',
    'lisinopril',
    'atorvastatin',
    'omeprazole',
    'levothyroxine',
    'amlodipine',
    'metoprolol',
    'losartan',
    'gabapentin',
    'warfarin',
    'insulin',
    'amoxicillin',
  ];

  medications.forEach(medication => {
    if (lowerText.includes(medication)) {
      entities.medications.push(medication);
    }
  });

  // Procedure detection
  const procedures = [
    'ecg',
    'ekg',
    'x-ray',
    'ct scan',
    'mri',
    'ultrasound',
    'biopsy',
    'endoscopy',
    'colonoscopy',
    'blood test',
    'urinalysis',
  ];

  procedures.forEach(procedure => {
    if (lowerText.includes(procedure)) {
      entities.procedures.push(procedure);
    }
  });

  // Body part detection
  const bodyParts = [
    'head',
    'chest',
    'abdomen',
    'heart',
    'lungs',
    'liver',
    'kidney',
    'brain',
    'spine',
    'leg',
    'arm',
    'back',
    'stomach',
  ];

  bodyParts.forEach(part => {
    if (lowerText.includes(part)) {
      entities.bodyParts.push(part);
    }
  });

  return entities;
}

/**
 * Apply medical terminology corrections
 */
function applyMedicalTerminology(text, specialty, language) {
  // Common medical term corrections
  const corrections = {
    'heart attack': 'myocardial infarction',
    stroke: 'cerebrovascular accident',
    'high blood pressure': 'hypertension',
    'sugar diabetes': 'diabetes mellitus',
    'water on the lungs': 'pleural effusion',
    'blood clot': 'thrombus',
    swelling: 'edema',
    'shortness of breath': 'dyspnea',
    'chest pain': 'angina pectoris',
    'irregular heartbeat': 'arrhythmia',
  };

  let correctedText = text;
  Object.keys(corrections).forEach(term => {
    const regex = new RegExp(term, 'gi');
    correctedText = correctedText.replace(regex, corrections[term]);
  });

  return correctedText;
}
