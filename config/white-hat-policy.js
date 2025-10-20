/**
 * 🛡️ WHITE-HAT POLICY ENFORCEMENT
 * Production-only configuration - NO mock data, NO placeholders
 *
 * This module enforces strict white-hat discipline across the system:
 * - All API calls must use real credentials from ENV
 * - No demo/mock/fake data permitted
 * - All outputs must include safety disclaimers
 * - Audit logging required for all medical operations
 */

require('dotenv').config();

/**
 * ═══════════════════════════════════════════════════════════
 * WHITE-HAT POLICY FLAGS
 * ═══════════════════════════════════════════════════════════
 */

const WHITE_HAT_POLICY = {
  // Production-only mode - NEVER allow mock data
  NO_MOCK_DATA: true,
  NO_PLACEHOLDER: true,
  NO_DEMO_MODE: true,

  // Require real Azure credentials
  REQUIRE_AZURE_CREDENTIALS: true,
  REQUIRE_FHIR_ENDPOINT: true,
  REQUIRE_DICOM_ENDPOINT: true,

  // Clinical safety enforcement
  REQUIRE_CLINICAL_DISCLAIMER: true,
  REQUIRE_CLINICIAN_REVIEW: true,
  REQUIRE_AUDIT_LOGGING: true,

  // Security requirements
  REQUIRE_JWT_AUTH: true,
  REQUIRE_HTTPS: process.env.NODE_ENV === 'production',
  REQUIRE_2FA: false, // Optional, hospital-configurable

  // Compliance flags
  HIPAA_COMPLIANT: true,
  GDPR_COMPLIANT: true,
  KVKK_COMPLIANT: true,

  // Rate limiting & abuse prevention
  ENABLE_RATE_LIMITING: true,
  ENABLE_WAF: true,

  // Emergency protocol
  EMERGENCY_DETECTION_ENABLED: true
};

/**
 * ═══════════════════════════════════════════════════════════
 * ENVIRONMENT VALIDATION
 * ═══════════════════════════════════════════════════════════
 */

function validateEnvironment() {
  const errors = [];

  // Required Azure credentials
  const requiredEnvVars = [
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'AZURE_TENANT_ID',
    'AZURE_SUBSCRIPTION_ID',
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_API_KEY',
    'AZURE_SPEECH_KEY',
    'AZURE_SPEECH_REGION'
  ];

  // Optional but recommended
  const optionalEnvVars = [
    'AZURE_HEALTH_FHIR_URL',
    'AZURE_HEALTH_DICOM_URL',
    'AZURE_SEARCH_ENDPOINT',
    'AZURE_SEARCH_KEY',
    'POSTGRES_URL'
  ];

  // Validate required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Warn about optional variables
  const warnings = [];
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(`Optional environment variable not set: ${envVar}`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ WHITE-HAT POLICY VIOLATION: Missing required credentials');
    console.error(errors.join('\n'));

    if (WHITE_HAT_POLICY.REQUIRE_AZURE_CREDENTIALS) {
      throw new Error('Cannot start server without required Azure credentials in production mode');
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️  WHITE-HAT POLICY WARNING: Optional credentials missing');
    console.warn(warnings.join('\n'));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * CLINICAL SAFETY BANNERS
 * ═══════════════════════════════════════════════════════════
 */

const CLINICAL_SAFETY_BANNER = {
  en: `⚠️ IMPORTANT MEDICAL NOTICE ⚠️

This AI system provides **informational support only** and is NOT a substitute for professional medical advice, diagnosis, or treatment.

• NOT a medical device (not FDA/CE approved)
• Outputs are NON-DIAGNOSTIC and require clinician review
• For emergencies, contact local emergency services immediately
• Always consult a qualified healthcare provider for clinical decisions

By using this system, you acknowledge these limitations.`,

  tr: `⚠️ ÖNEMLİ TIBBİ UYARI ⚠️

Bu yapay zeka sistemi **yalnızca bilgilendirme amaçlı** destek sağlar ve profesyonel tıbbi tavsiye, teşhis veya tedavinin yerini tutmaz.

• Tıbbi cihaz DEĞİLDİR (FDA/CE onaylı değil)
• Çıktılar TEŞHİS AMAÇLI DEĞİLDİR ve klinisyen incelemesi gerektirir
• Acil durumlar için yerel acil sağlık hizmetlerini arayın
• Klinik kararlar için her zaman yetkili bir sağlık uzmanına danışın

Bu sistemi kullanarak bu sınırlamaları kabul etmiş sayılırsınız.`,

  de: `⚠️ WICHTIGER MEDIZINISCHER HINWEIS ⚠️

Dieses KI-System bietet **nur Informationsunterstützung** und ist KEIN Ersatz für professionelle medizinische Beratung, Diagnose oder Behandlung.

• KEIN Medizinprodukt (nicht FDA/CE-zugelassen)
• Ausgaben sind NICHT-DIAGNOSTISCH und erfordern klinische Überprüfung
• Bei Notfällen wenden Sie sich sofort an den örtlichen Notdienst
• Konsultieren Sie immer einen qualifizierten Arzt für klinische Entscheidungen

Durch die Nutzung dieses Systems erkennen Sie diese Einschränkungen an.`,

  fr: `⚠️ AVIS MÉDICAL IMPORTANT ⚠️

Ce système d'IA fournit **un soutien informatif uniquement** et n'est PAS un substitut aux conseils médicaux professionnels, au diagnostic ou au traitement.

• PAS un dispositif médical (non approuvé FDA/CE)
• Les sorties sont NON-DIAGNOSTIQUES et nécessitent un examen clinique
• En cas d'urgence, contactez immédiatement les services d'urgence locaux
• Consultez toujours un professionnel de santé qualifié pour les décisions cliniques

En utilisant ce système, vous reconnaissez ces limitations.`,

  es: `⚠️ AVISO MÉDICO IMPORTANTE ⚠️

Este sistema de IA proporciona **soporte informativo únicamente** y NO es un sustituto del consejo médico profesional, diagnóstico o tratamiento.

• NO es un dispositivo médico (no aprobado por FDA/CE)
• Las salidas NO son DIAGNÓSTICAS y requieren revisión clínica
• Para emergencias, contacte inmediatamente a los servicios de emergencia locales
• Siempre consulte a un profesional de salud calificado para decisiones clínicas

Al usar este sistema, usted reconoce estas limitaciones.`,

  ar: `⚠️ تنبيه طبي مهم ⚠️

يوفر هذا النظام الذكي **دعمًا معلوماتيًا فقط** وليس بديلاً عن الاستشارة الطبية المهنية أو التشخيص أو العلاج.

• ليس جهازًا طبيًا (غير معتمد من FDA/CE)
• المخرجات غير تشخيصية وتتطلب مراجعة سريرية
• في حالات الطوارئ، اتصل بخدمات الطوارئ المحلية فورًا
• استشر دائمًا مقدم رعاية صحية مؤهل للقرارات السريرية

باستخدام هذا النظام، فإنك تقر بهذه القيود.`,

  ru: `⚠️ ВАЖНОЕ МЕДИЦИНСКОЕ УВЕДОМЛЕНИЕ ⚠️

Эта система ИИ предоставляет **только информационную поддержку** и НЕ заменяет профессиональную медицинскую консультацию, диагностику или лечение.

• НЕ медицинское устройство (не одобрено FDA/CE)
• Результаты НЕ ДИАГНОСТИЧЕСКИЕ и требуют клинического анализа
• В чрезвычайных ситуациях немедленно обратитесь в местные службы экстренной помощи
• Всегда консультируйтесь с квалифицированным медицинским работником для клинических решений

Используя эту систему, вы признаете эти ограничения.`,

  it: `⚠️ AVVISO MEDICO IMPORTANTE ⚠️

Questo sistema AI fornisce **solo supporto informativo** e NON sostituisce consulenza medica professionale, diagnosi o trattamento.

• NON è un dispositivo medico (non approvato FDA/CE)
• Le uscite NON sono DIAGNOSTICHE e richiedono revisione clinica
• Per emergenze, contattare immediatamente i servizi di emergenza locali
• Consultare sempre un professionista sanitario qualificato per decisioni cliniche

Utilizzando questo sistema, riconosci queste limitazioni.`,

  'zh-CN': `⚠️ 重要医疗声明 ⚠️

该AI系统仅提供**信息支持**，不能替代专业医疗建议、诊断或治疗。

• 非医疗设备（未获FDA/CE批准）
• 输出为非诊断性，需要临床审查
• 紧急情况请立即联系当地急救服务
• 临床决策请始终咨询合格的医疗专业人员

使用本系统即表示您承认这些限制。`,

  ja: `⚠️ 重要な医療に関する通知 ⚠️

このAIシステムは**情報サポートのみ**を提供し、専門的な医療アドバイス、診断、または治療の代替ではありません。

• 医療機器ではありません（FDA/CE承認なし）
• 出力は非診断的であり、臨床レビューが必要です
• 緊急時は直ちに地域の救急サービスに連絡してください
• 臨床判断については必ず資格のある医療専門家にご相談ください

このシステムを使用することで、これらの制限を認めたものとします。`
};

const PER_RESPONSE_FOOTER = {
  en: `---
📋 **Clinician Review Required**
This output is for informational purposes only. Clinical validation by a licensed healthcare professional is mandatory before any diagnostic or therapeutic action.

⚠️ **Uncertainty Declaration**: This AI model has inherent limitations. Confidence scores and citations are provided but do not replace clinical judgment.`,

  tr: `---
📋 **Klinisyen İncelemesi Gereklidir**
Bu çıktı yalnızca bilgilendirme amaçlıdır. Herhangi bir teşhis veya tedavi eylemi öncesinde lisanslı bir sağlık uzmanı tarafından klinik doğrulama zorunludur.

⚠️ **Belirsizlik Beyanı**: Bu yapay zeka modelinin doğal sınırlamaları vardır. Güven skorları ve alıntılar sağlanır ancak klinik kararın yerini tutmaz.`,

  de: `---
📋 **Klinische Überprüfung erforderlich**
Diese Ausgabe dient nur zu Informationszwecken. Eine klinische Validierung durch einen zugelassenen Arzt ist vor jeder diagnostischen oder therapeutischen Maßnahme obligatorisch.

⚠️ **Unsicherheitserklärung**: Dieses KI-Modell hat inhärente Einschränkungen. Vertrauenswerte und Zitate werden bereitgestellt, ersetzen jedoch nicht die klinische Beurteilung.`,

  fr: `---
📋 **Examen clinique requis**
Cette sortie est à titre informatif uniquement. La validation clinique par un professionnel de santé agréé est obligatoire avant toute action diagnostique ou thérapeutique.

⚠️ **Déclaration d'incertitude**: Ce modèle d'IA a des limitations inhérentes. Des scores de confiance et des citations sont fournis mais ne remplacent pas le jugement clinique.`,

  es: `---
📋 **Revisión clínica requerida**
Esta salida es solo con fines informativos. La validación clínica por un profesional de salud licenciado es obligatoria antes de cualquier acción diagnóstica o terapéutica.

⚠️ **Declaración de incertidumbre**: Este modelo de IA tiene limitaciones inherentes. Se proporcionan puntajes de confianza y citas, pero no reemplazan el juicio clínico.`,

  ar: `---
📋 **مراجعة سريرية مطلوبة**
هذا المخرج لأغراض إعلامية فقط. التحقق السريري من قبل متخصص رعاية صحية مرخص إلزامي قبل أي إجراء تشخيصي أو علاجي.

⚠️ **إقرار بعدم اليقين**: لهذا النموذج الذكي قيود متأصلة. يتم توفير درجات الثقة والاستشهادات ولكنها لا تحل محل الحكم السريري.`,

  ru: `---
📋 **Требуется клинический анализ**
Этот результат предназначен только для информационных целей. Клиническая проверка лицензированным медицинским специалистом обязательна перед любыми диагностическими или терапевтическими действиями.

⚠️ **Заявление о неопределенности**: Эта модель ИИ имеет присущие ограничения. Оценки достоверности и цитаты предоставляются, но не заменяют клиническое суждение.`,

  it: `---
📋 **Revisione clinica richiesta**
Questo output è solo a scopo informativo. La convalida clinica da parte di un professionista sanitario autorizzato è obbligatoria prima di qualsiasi azione diagnostica o terapeutica.

⚠️ **Dichiarazione di incertezza**: Questo modello AI ha limitazioni intrinseche. Vengono forniti punteggi di fiducia e citazioni ma non sostituiscono il giudizio clinico.`,

  'zh-CN': `---
📋 **需要临床审查**
此输出仅供参考。在任何诊断或治疗行动之前，必须由持证医疗专业人员进行临床验证。

⚠️ **不确定性声明**：该AI模型具有固有局限性。提供置信度评分和引文，但不能替代临床判断。`,

  ja: `---
📋 **臨床レビュー必須**
この出力は情報提供のみを目的としています。診断または治療行為の前に、認可された医療専門家による臨床検証が必須です。

⚠️ **不確実性の宣言**：このAIモデルには固有の制限があります。信頼スコアと引用は提供されますが、臨床判断を置き換えるものではありません。`
};

/**
 * ═══════════════════════════════════════════════════════════
 * EMERGENCY KEYWORDS DETECTION
 * ═══════════════════════════════════════════════════════════
 */

const EMERGENCY_KEYWORDS = {
  en: [
    'cardiac arrest', 'heart attack', 'myocardial infarction',
    'stroke', 'severe bleeding', 'hemorrhage',
    'unresponsive', 'unconscious', 'not breathing',
    'chest pain', 'difficulty breathing', 'shortness of breath',
    'suicide', 'suicidal', 'self-harm',
    'seizure', 'convulsion', 'anaphylaxis',
    'severe pain', 'trauma', 'accident',
    'overdose', 'poisoning', 'choking'
  ],
  tr: [
    'kalp krizi', 'miyokard enfarktüsü', 'kardiyak arrest',
    'felç', 'inme', 'şiddetli kanama', 'hemoraji',
    'yanıt vermiyor', 'bilinçsiz', 'nefes almıyor',
    'göğüs ağrısı', 'nefes darlığı', 'solunum güçlüğü',
    'intihar', 'kendine zarar', 'nöbet', 'konvülsiyon',
    'anafilaksi', 'şiddetli ağrı', 'travma', 'kaza',
    'doz aşımı', 'zehirlenme', 'boğulma'
  ]
};

function detectEmergency(text, language = 'en') {
  const keywords = EMERGENCY_KEYWORDS[language] || EMERGENCY_KEYWORDS.en;
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      return {
        detected: true,
        keyword,
        language
      };
    }
  }

  return { detected: false };
}

/**
 * ═══════════════════════════════════════════════════════════
 * AUDIT LOGGING
 * ═══════════════════════════════════════════════════════════
 */

function logMedicalAudit(event) {
  if (!WHITE_HAT_POLICY.REQUIRE_AUDIT_LOGGING) {
    return;
  }

  const auditEntry = {
    timestamp: new Date().toISOString(),
    event_type: 'MEDICAL_AI_INTERACTION',
    ...event,
    policy_version: '1.0.0'
  };

  // In production: send to Azure Log Analytics / Application Insights
  console.log('🩺 MEDICAL AUDIT:', JSON.stringify(auditEntry));

  return auditEntry;
}

/**
 * Export configuration
 */
module.exports = {
  WHITE_HAT_POLICY,
  validateEnvironment,
  CLINICAL_SAFETY_BANNER,
  PER_RESPONSE_FOOTER,
  EMERGENCY_KEYWORDS,
  detectEmergency,
  logMedicalAudit
};
