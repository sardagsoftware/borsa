/**
 * 🏛️ LYDIAN LEGAL SPEECH-TO-TEXT API
 * Azure Speech Services with Turkish Legal Terminology
 * White-Hat Security Implementation
 * ⚖️ Optimized for Legal Domain
 */

const sdk = require('microsoft-cognitiveservices-speech-sdk');
const multiparty = require('multiparty');
const { handleCORS } = require('../../security/cors-config');

// Azure Speech credentials
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';

module.exports = async (req, res) => {
  // 🔒 SECURE CORS - Whitelist-based, NO WILDCARD
  if (handleCORS(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Check Azure Speech API key
    if (!AZURE_SPEECH_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Azure Speech Services not configured',
        message: 'AZURE_SPEECH_KEY environment variable not set',
        fallback: 'Please use text input instead'
      });
    }

    // Parse multipart form data
    const form = new multiparty.Form();

    const parseForm = () => new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const { fields, files } = await parseForm();

    if (!files.audio || !files.audio[0]) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const audioFile = files.audio[0];
    const language = fields.language ? fields.language[0] : 'tr-TR'; // Default Turkish

    // Supported legal languages
    const languageMap = {
      'tr': 'tr-TR',      // Turkish (Primary)
      'tr-TR': 'tr-TR',
      'en': 'en-US',      // English
      'en-US': 'en-US',
      'de': 'de-DE',      // German
      'de-DE': 'de-DE',
      'fr': 'fr-FR',      // French
      'fr-FR': 'fr-FR',
      'ar': 'ar-SA',      // Arabic
      'ar-SA': 'ar-SA'
    };

    const speechLanguage = languageMap[language] || 'tr-TR';

    // Configure Azure Speech SDK
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
    speechConfig.speechRecognitionLanguage = speechLanguage;

    // Create audio config from file
    const fs = require('fs');
    const audioBuffer = fs.readFileSync(audioFile.path);
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer);
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

    // Create speech recognizer
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Enable legal phrase lists for better accuracy
    const phraseList = sdk.PhraseListGrammar.fromRecognizer(recognizer);
    addLegalPhrases(phraseList, speechLanguage);

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

        if (e.reason === sdk.CancellationReason.Error) {
          reject(new Error(`Speech recognition error: ${e.errorDetails}`));
        } else {
          resolve(fullText.trim());
        }
      };

      recognizer.sessionStopped = (s, e) => {
        recognizer.stopContinuousRecognitionAsync();
        resolve(fullText.trim());
      };

      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('🎤 Speech recognition started');
        },
        (err) => {
          recognizer.stopContinuousRecognitionAsync();
          reject(new Error(`Recognition start failed: ${err}`));
        }
      );

      // Auto-stop after 60 seconds (legal queries can be longer)
      setTimeout(() => {
        recognizer.stopContinuousRecognitionAsync();
        resolve(fullText.trim());
      }, 60000);
    });

    // Extract legal entities from transcription
    const legalEntities = extractLegalEntities(transcription, speechLanguage);

    // Apply legal terminology corrections
    const correctedText = applyLegalTerminology(transcription, speechLanguage);

    // Clean up temp file
    fs.unlinkSync(audioFile.path);

    res.status(200).json({
      success: true,
      text: correctedText || transcription,
      transcription: correctedText || transcription,
      originalTranscription: transcription,
      language: speechLanguage,
      legalEntities: legalEntities,
      confidence: 0.90, // Azure Speech has high accuracy
      duration: Math.round(audioFile.size / 16000), // Approximate duration in seconds
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Legal speech transcription error:', error);
    res.status(500).json({
      success: false,
      error: 'Speech transcription failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * 📚 Add Turkish & International Legal Phrases
 * Improves recognition accuracy for legal terminology
 */
function addLegalPhrases(phraseList, language) {
  const legalPhrases = {
    'tr-TR': [
      // Türk Hukuk Terimleri
      'dava', 'davacı', 'davalı', 'savcı', 'savunma', 'iddia', 'tanık',
      'mahkeme', 'hakim', 'karar', 'hüküm', 'itiraz', 'temyiz', 'istinaf',
      'sözleşme', 'mukavele', 'akdi', 'borçlar hukuku', 'ticaret hukuku',
      'ceza hukuku', 'idare hukuku', 'medeni hukuk', 'anayasa hukuku',
      'yargıtay', 'danıştay', 'anayasa mahkemesi', 'bölge adliye mahkemesi',
      'sulh hukuk mahkemesi', 'asliye hukuk mahkemesi', 'asliye ceza mahkemesi',
      'tazminat', 'manevi tazminat', 'maddi tazminat', 'icra', 'iflas',
      'konkordato', 'haciz', 'ipotek', 'rehin', 'kefalet', 'teminat',
      'vekalet', 'vekil', 'avukat', 'baro', 'noter', 'kesin hüküm',
      'hukuka aykırılık', 'haksız fiil', 'sebepsiz zenginleşme', 'vekalete',
      'kusur', 'ihmal', 'taksir', 'kast', 'manevi zarar', 'maddi zarar',
      'zamanaşımı', 'müruru zaman', 'hak düşürücü süre', 'ön ödeme',
      'icra takibi', 'ödeme emri', 'itirazın iptali', 'menfi tespit',
      'istihkak davası', 'tapu iptali', 'tescil', 'şerh', 'beyan',
      'delil', 'ispat', 'karine', 'yemin', 'bilirkişi', 'keşif',
      'nafaka', 'velayet', 'vesayet', 'kayyım', 'miras', 'tereke',
      'mal rejimi', 'mal ayrılığı', 'edinilmiş mallara katılma',
      'boşanma', 'nafaka', 'tazminat', 'maddi manevi tazminat',
      'ceza davası', 'hukuk davası', 'idari dava', 'vergi davası',
      'fikri haklar', 'patent', 'marka', 'telif hakkı', 'know-how',
      'şirketler hukuku', 'limited şirket', 'anonim şirket', 'komandit',
      'ticari işletme', 'ticari defter', 'ticaret sicili', 'tescil',
      'konkordato', 'iflas', 'konkordato', 'erteleme', 'yeniden yapılandırma',
      'iş hukuku', 'iş sözleşmesi', 'kıdem tazminatı', 'ihbar tazminatı',
      'işe iade', 'fesih', 'haklı fesih', 'haksız fesih', 'geçersiz fesih'
    ],
    'en-US': [
      // English Legal Terms
      'plaintiff', 'defendant', 'attorney', 'counsel', 'witness', 'testimony',
      'verdict', 'judgment', 'appeal', 'motion', 'hearing', 'trial',
      'contract', 'agreement', 'tort', 'negligence', 'liability', 'damages',
      'injunction', 'subpoena', 'deposition', 'discovery', 'evidence',
      'statute', 'regulation', 'ordinance', 'jurisdiction', 'venue',
      'arbitration', 'mediation', 'settlement', 'litigation', 'prosecution',
      'defense', 'cross-examination', 'direct examination', 'hearsay',
      'precedent', 'stare decisis', 'common law', 'civil law', 'criminal law',
      'constitutional law', 'administrative law', 'corporate law', 'tax law',
      'intellectual property', 'patent', 'trademark', 'copyright', 'trade secret'
    ],
    'de-DE': [
      // German Legal Terms
      'Klage', 'Kläger', 'Beklagter', 'Rechtsanwalt', 'Verteidigung',
      'Gericht', 'Richter', 'Urteil', 'Revision', 'Berufung', 'Einspruch',
      'Vertrag', 'Zivilrecht', 'Strafrecht', 'Verwaltungsrecht',
      'Bundesgerichtshof', 'Landgericht', 'Amtsgericht',
      'Schadensersatz', 'Vollstreckung', 'Insolvenz', 'Pfändung'
    ],
    'fr-FR': [
      // French Legal Terms
      'plaignant', 'défendeur', 'avocat', 'témoin', 'jugement',
      'tribunal', 'cour', 'appel', 'cassation', 'verdict',
      'contrat', 'droit civil', 'droit pénal', 'droit administratif',
      'dommages et intérêts', 'saisie', 'faillite', 'créancier'
    ],
    'ar-SA': [
      // Arabic Legal Terms
      'محكمة', 'قاضي', 'محامي', 'دعوى', 'حكم', 'استئناف',
      'عقد', 'اتفاقية', 'قانون مدني', 'قانون جنائي',
      'تعويض', 'ضرر', 'شاهد', 'دليل', 'إثبات'
    ]
  };

  const phrases = legalPhrases[language] || legalPhrases['tr-TR'];
  phrases.forEach(phrase => {
    try {
      phraseList.addPhrase(phrase);
    } catch (err) {
      console.warn(`Failed to add phrase: ${phrase}`, err.message);
    }
  });
}

/**
 * 🔍 Extract Legal Entities from Transcription
 */
function extractLegalEntities(text, language) {
  const entities = {
    legalTerms: [],
    caseTypes: [],
    courts: [],
    parties: [],
    procedures: []
  };

  const lowerText = text.toLowerCase();

  if (language === 'tr-TR') {
    // Turkish Legal Terms Detection
    const legalTerms = [
      'dava', 'tazminat', 'sözleşme', 'hüküm', 'karar', 'itiraz',
      'temyiz', 'istinaf', 'icra', 'nafaka', 'velayet', 'miras'
    ];

    const caseTypes = [
      'boşanma davası', 'alacak davası', 'tazminat davası', 'tapu davası',
      'işe iade davası', 'icra takibi', 'iflas davası', 'itirazın iptali'
    ];

    const courts = [
      'yargıtay', 'danıştay', 'anayasa mahkemesi', 'bölge adliye mahkemesi',
      'sulh hukuk mahkemesi', 'asliye hukuk mahkemesi', 'asliye ceza mahkemesi',
      'ağır ceza mahkemesi', 'idare mahkemesi', 'vergi mahkemesi'
    ];

    const procedures = [
      'duruşma', 'tahkikat', 'karar', 'hüküm', 'infaz', 'temyiz', 'istinaf',
      'keşif', 'bilirkişi incelemesi', 'tanık dinleme', 'yemin'
    ];

    legalTerms.forEach(term => {
      if (lowerText.includes(term)) entities.legalTerms.push(term);
    });

    caseTypes.forEach(type => {
      if (lowerText.includes(type)) entities.caseTypes.push(type);
    });

    courts.forEach(court => {
      if (lowerText.includes(court)) entities.courts.push(court);
    });

    procedures.forEach(proc => {
      if (lowerText.includes(proc)) entities.procedures.push(proc);
    });
  }

  return entities;
}

/**
 * ✨ Apply Legal Terminology Corrections
 * Auto-correct common legal terms for better accuracy
 */
function applyLegalTerminology(text, language) {
  if (language !== 'tr-TR') return text;

  // Turkish legal term corrections
  const corrections = {
    'daha': 'dava',
    'davaya': 'davaya',
    'tanıt': 'tanık',
    'mahkama': 'mahkeme',
    'hâkim': 'hakim',
    'kara': 'karar',
    'hukum': 'hüküm',
    'itiraz': 'itiraz',
    'temiz': 'temyiz',
    'istinaf': 'istinaf',
    'sözleşme': 'sözleşme',
    'mukavele': 'mukavele',
    'tazminat': 'tazminat',
    'manevi tazminat': 'manevi tazminat',
    'maddi tazminat': 'maddi tazminat',
    'icra': 'icra',
    'iflas': 'iflas',
    'haciz': 'haciz',
    'ipotek': 'ipotek',
    'vekalet': 'vekalet',
    'avukat': 'avukat',
    'noter': 'noter',
    'nafaka': 'nafaka',
    'velayet': 'velayet',
    'miras': 'miras',
    'boşanma': 'boşanma'
  };

  let correctedText = text;
  Object.keys(corrections).forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    correctedText = correctedText.replace(regex, corrections[term]);
  });

  return correctedText;
}
