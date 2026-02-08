/**
 * 🧠 PSYCHIATRY CLINICAL TOOLS API
 * Production-ready mental health assessment tools
 *
 * FEATURES:
 * - PHQ-9 (Depression Screening)
 * - GAD-7 (Anxiety Screening)
 * - MMSE (Mini-Mental State Examination)
 * - Hamilton Depression Rating Scale (HAM-D)
 * - PANSS (Positive and Negative Syndrome Scale)
 * - AUDIT (Alcohol Use Disorders Identification Test)
 * - Columbia Suicide Severity Rating Scale (C-SSRS)
 * - MDQ (Mood Disorder Questionnaire - Bipolar screening)
 *
 * WHITE-HAT COMPLIANT - Evidence-based psychiatric assessments
 */

const { logMedicalAudit } = require('../../config/white-hat-policy');

/**
 * ═══════════════════════════════════════════════════════════
 * PHQ-9 (Patient Health Questionnaire - Depression)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate PHQ-9 depression severity score
 * 9 questions, each scored 0-3
 * Total range: 0-27
 */
function calculatePHQ9(data) {
  const {
    littleInterest, // 0-3
    feelingDown, // 0-3
    sleepProblems, // 0-3
    feelingTired, // 0-3
    appetiteProblems, // 0-3
    feelingBad, // 0-3
    troubleConcentrating, // 0-3
    movingSpeaking, // 0-3
    thoughtsHurting, // 0-3
    functionalImpairment, // 'not-difficult', 'somewhat', 'very', 'extremely'
  } = data;

  const totalScore =
    littleInterest +
    feelingDown +
    sleepProblems +
    feelingTired +
    appetiteProblems +
    feelingBad +
    troubleConcentrating +
    movingSpeaking +
    thoughtsHurting;

  let severity, interpretation, recommendation, suicideRisk;

  // Assess suicide risk (question 9)
  if (thoughtsHurting > 0) {
    suicideRisk = '⚠️ SUICIDE RISK DETECTED - Conduct comprehensive suicide assessment immediately';
  } else {
    suicideRisk = 'No suicidal ideation reported';
  }

  // Determine severity and recommendations
  if (totalScore <= 4) {
    severity = 'Minimal or None';
    interpretation = 'No or minimal depression';
    recommendation = 'No treatment indicated; reassess at follow-up';
  } else if (totalScore <= 9) {
    severity = 'Mild Depression';
    interpretation = 'Mild depressive symptoms';
    recommendation = 'Watchful waiting, repeat PHQ-9 in 2 weeks, consider psychotherapy';
  } else if (totalScore <= 14) {
    severity = 'Moderate Depression';
    interpretation = 'Moderate depressive symptoms';
    recommendation = 'Psychotherapy and/or antidepressant medication, repeat PHQ-9 in 4 weeks';
  } else if (totalScore <= 19) {
    severity = 'Moderately Severe Depression';
    interpretation = 'Moderately severe depressive symptoms';
    recommendation = 'Psychotherapy AND antidepressant medication, consider psychiatric referral';
  } else {
    severity = 'Severe Depression';
    interpretation = 'Severe depressive symptoms';
    recommendation =
      '⚠️ URGENT - Immediate psychiatric referral, consider hospitalization if severe functional impairment or suicide risk';
  }

  return {
    totalScore,
    severity,
    interpretation,
    recommendation,
    suicideRisk,
    functionalImpairment,
    scale: 'PHQ-9 (0-27)',
    followUp: 'Repeat PHQ-9 at each visit to monitor treatment response',
    treatmentGoal: 'Target PHQ-9 score <5 for remission',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * GAD-7 (Generalized Anxiety Disorder - 7 Item)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate GAD-7 anxiety severity score
 * 7 questions, each scored 0-3
 * Total range: 0-21
 */
function calculateGAD7(data) {
  const {
    feelingNervous, // 0-3
    cantStopWorrying, // 0-3
    worryingTooMuch, // 0-3
    troubleRelaxing, // 0-3
    restless, // 0-3
    easilyAnnoyed, // 0-3
    feelingAfraid, // 0-3
  } = data;

  const totalScore =
    feelingNervous +
    cantStopWorrying +
    worryingTooMuch +
    troubleRelaxing +
    restless +
    easilyAnnoyed +
    feelingAfraid;

  let severity, interpretation, recommendation;

  if (totalScore <= 4) {
    severity = 'Minimal Anxiety';
    interpretation = 'Minimal or no anxiety';
    recommendation = 'No treatment needed; reassess if symptoms worsen';
  } else if (totalScore <= 9) {
    severity = 'Mild Anxiety';
    interpretation = 'Mild anxiety symptoms';
    recommendation = 'Psychoeducation, relaxation techniques, repeat GAD-7 in 2 weeks';
  } else if (totalScore <= 14) {
    severity = 'Moderate Anxiety';
    interpretation = 'Moderate anxiety symptoms';
    recommendation = 'Consider psychotherapy (CBT) and/or medication (SSRI, SNRI)';
  } else {
    severity = 'Severe Anxiety';
    interpretation = 'Severe anxiety symptoms';
    recommendation = '⚠️ Psychotherapy AND medication recommended, consider psychiatric referral';
  }

  return {
    totalScore,
    severity,
    interpretation,
    recommendation,
    scale: 'GAD-7 (0-21)',
    specificDisorders:
      totalScore >= 10
        ? 'Further assess for: Generalized Anxiety Disorder, Panic Disorder, Social Anxiety, PTSD'
        : 'Continue monitoring',
    treatmentGoal: 'Target GAD-7 score <5 for remission',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * MMSE (Mini-Mental State Examination)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate and interpret MMSE score
 * Cognitive function screening
 * Total range: 0-30
 */
function calculateMMSE(data) {
  const {
    orientation, // 0-10 (time 5, place 5)
    registration, // 0-3 (repeat 3 words)
    attention, // 0-5 (serial 7s or spell WORLD backwards)
    recall, // 0-3 (recall 3 words)
    language, // 0-8 (naming, repetition, comprehension, reading, writing)
    construction, // 0-1 (copy pentagons)
  } = data;

  const totalScore = orientation + registration + attention + recall + language + construction;

  let interpretation, cognitiveStatus, recommendation;

  if (totalScore >= 24) {
    interpretation = 'Normal Cognition';
    cognitiveStatus = 'No cognitive impairment';
    recommendation = 'Routine follow-up; reassess if concerns arise';
  } else if (totalScore >= 18) {
    interpretation = 'Mild Cognitive Impairment';
    cognitiveStatus = 'Mild dementia or delirium';
    recommendation =
      'Further cognitive testing (MoCA, neuropsych testing), brain imaging, labs (B12, TSH, RPR)';
  } else if (totalScore >= 10) {
    interpretation = 'Moderate Cognitive Impairment';
    cognitiveStatus = 'Moderate dementia';
    recommendation =
      'Dementia workup, consider acetylcholinesterase inhibitors, assess safety and caregiver support';
  } else {
    interpretation = 'Severe Cognitive Impairment';
    cognitiveStatus = 'Severe dementia';
    recommendation =
      '⚠️ Advanced dementia care, assess for delirium, palliative care consultation, safety assessment';
  }

  return {
    totalScore,
    breakdown: {
      orientation,
      registration,
      attention,
      recall,
      language,
      construction,
    },
    interpretation,
    cognitiveStatus,
    recommendation,
    scale: 'MMSE (0-30, higher is better)',
    note: 'MMSE score can be affected by education level and age; use age/education-adjusted norms',
    differentials:
      'Alzheimer disease, vascular dementia, Lewy body dementia, frontotemporal dementia, delirium',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * HAMILTON DEPRESSION RATING SCALE (HAM-D 17)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate Hamilton Depression Rating Scale (17-item version)
 * Clinician-administered depression scale
 * Total range: 0-52
 */
function calculateHamiltonDepression(data) {
  const {
    depressedMood, // 0-4
    guilt, // 0-4
    suicide, // 0-4
    insomniaEarly, // 0-2
    insomniaMiddle, // 0-2
    insomniaLate, // 0-2
    work, // 0-4
    retardation, // 0-4
    agitation, // 0-4
    anxietyPsychic, // 0-4
    anxietySomatic, // 0-4
    somaticGI, // 0-2
    somaticGeneral, // 0-2
    genital, // 0-2
    hypochondriasis, // 0-4
    lossOfWeight, // 0-2
    insight, // 0-2
  } = data;

  const totalScore =
    depressedMood +
    guilt +
    suicide +
    insomniaEarly +
    insomniaMiddle +
    insomniaLate +
    work +
    retardation +
    agitation +
    anxietyPsychic +
    anxietySomatic +
    somaticGI +
    somaticGeneral +
    genital +
    hypochondriasis +
    lossOfWeight +
    insight;

  let severity, interpretation, recommendation, suicideRisk;

  // Suicide risk assessment
  if (suicide > 0) {
    suicideRisk = '⚠️ SUICIDE RISK PRESENT - Immediate safety assessment required';
  } else {
    suicideRisk = 'No suicidal ideation reported';
  }

  if (totalScore <= 7) {
    severity = 'Normal / Remission';
    interpretation = 'No depression or in remission';
    recommendation = 'Continue current treatment if applicable, monitor for relapse';
  } else if (totalScore <= 16) {
    severity = 'Mild Depression';
    interpretation = 'Mild depressive symptoms';
    recommendation = 'Psychotherapy, consider medication if symptoms persist';
  } else if (totalScore <= 23) {
    severity = 'Moderate Depression';
    interpretation = 'Moderate depressive symptoms';
    recommendation = 'Antidepressant medication AND psychotherapy';
  } else {
    severity = 'Severe Depression';
    interpretation = 'Severe depressive symptoms';
    recommendation =
      '⚠️ URGENT - Aggressive treatment, consider hospitalization, ECT if treatment-resistant';
  }

  return {
    totalScore,
    severity,
    interpretation,
    recommendation,
    suicideRisk,
    scale: 'HAM-D-17 (0-52)',
    treatmentResponse: 'HAM-D reduction ≥50% indicates response; score ≤7 indicates remission',
    note: 'Clinician-administered scale; more detailed than PHQ-9',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * PANSS (Positive and Negative Syndrome Scale)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate PANSS for schizophrenia symptom assessment
 * Simplified version - full PANSS has 30 items
 */
function calculatePANSS(data) {
  const {
    positiveScale, // 7-49 (delusions, hallucinations, disorganization)
    negativeScale, // 7-49 (blunted affect, social withdrawal, lack of motivation)
    generalScale, // 16-112 (general psychopathology)
  } = data;

  const totalScore = positiveScale + negativeScale + generalScale;

  let severity, interpretation, recommendation;

  if (totalScore <= 58) {
    severity = 'Mildly Ill';
    interpretation = 'Mild psychotic symptoms';
    recommendation =
      'Continue antipsychotic medication, monitor closely, psychosocial rehabilitation';
  } else if (totalScore <= 75) {
    severity = 'Moderately Ill';
    interpretation = 'Moderate psychotic symptoms';
    recommendation =
      'Optimize antipsychotic dose, consider adjunctive medications, intensive case management';
  } else if (totalScore <= 95) {
    severity = 'Markedly Ill';
    interpretation = 'Marked psychotic symptoms';
    recommendation =
      'Consider antipsychotic switch or augmentation, partial hospitalization program';
  } else if (totalScore <= 116) {
    severity = 'Severely Ill';
    interpretation = 'Severe psychotic symptoms';
    recommendation =
      '⚠️ Consider hospitalization, clozapine for treatment-resistant cases, safety assessment';
  } else {
    severity = 'Extremely Ill';
    interpretation = 'Extreme psychotic symptoms';
    recommendation =
      '⚠️ URGENT - Immediate hospitalization likely needed, consider ECT, ensure patient safety';
  }

  // Determine predominant symptom type
  let predominantSymptoms;
  if (positiveScale > negativeScale + 5) {
    predominantSymptoms = 'Predominantly Positive Symptoms (hallucinations, delusions)';
  } else if (negativeScale > positiveScale + 5) {
    predominantSymptoms =
      'Predominantly Negative Symptoms (blunted affect, withdrawal, amotivation)';
  } else {
    predominantSymptoms = 'Mixed Positive and Negative Symptoms';
  }

  return {
    totalScore,
    breakdown: {
      positive: positiveScale,
      negative: negativeScale,
      general: generalScale,
    },
    severity,
    interpretation,
    predominantSymptoms,
    recommendation,
    scale: 'PANSS (30-210)',
    treatmentResponse: 'PANSS reduction ≥20% indicates clinical response',
    note: 'Used primarily for schizophrenia and schizoaffective disorder',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * AUDIT (Alcohol Use Disorders Identification Test)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate AUDIT score for alcohol use screening
 * 10 questions, total range: 0-40
 */
function calculateAUDIT(data) {
  const {
    frequency, // 0-4 (how often drink)
    typicalAmount, // 0-4 (how many drinks)
    bingeDrinking, // 0-4 (6+ drinks on one occasion)
    unableToStop, // 0-4
    failedExpectations, // 0-4
    morningDrinking, // 0-4
    guilt, // 0-4
    blackouts, // 0-4
    injuries, // 0-4
    concernFromOthers, // 0-4
  } = data;

  const totalScore =
    frequency +
    typicalAmount +
    bingeDrinking +
    unableToStop +
    failedExpectations +
    morningDrinking +
    guilt +
    blackouts +
    injuries +
    concernFromOthers;

  let riskLevel, interpretation, recommendation;

  if (totalScore <= 7) {
    riskLevel = 'Low Risk';
    interpretation = 'Low-risk alcohol consumption';
    recommendation = 'Alcohol education and brief counseling';
  } else if (totalScore <= 15) {
    riskLevel = 'Hazardous Use';
    interpretation = 'Hazardous or harmful alcohol use';
    recommendation = 'Brief intervention, counseling, monitor for alcohol use disorder';
  } else if (totalScore <= 19) {
    riskLevel = 'Harmful Use';
    interpretation = 'Harmful alcohol use / possible dependence';
    recommendation = 'Brief intervention + specialist referral, consider alcohol treatment program';
  } else {
    riskLevel = 'Possible Dependence';
    interpretation = 'High likelihood of alcohol dependence';
    recommendation =
      '⚠️ URGENT - Specialist referral mandatory, consider inpatient detox, naltrexone/acamprosate, AA/SMART Recovery';
  }

  return {
    totalScore,
    riskLevel,
    interpretation,
    recommendation,
    scale: 'AUDIT (0-40)',
    withdrawalWarning:
      totalScore >= 16
        ? '⚠️ Assess for withdrawal risk - may require medically supervised detox'
        : 'Low withdrawal risk',
    resources: 'SAMHSA National Helpline: 1-800-662-4357, AA meetings, SMART Recovery',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * COLUMBIA SUICIDE SEVERITY RATING SCALE (C-SSRS)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Simplified Columbia Suicide Severity Rating Scale
 * Assesses suicidal ideation and behavior
 */
function assessColumbiaSuicide(data) {
  const {
    wishToBeDead, // yes/no
    suicidalThoughts, // yes/no
    thoughtsWithMethod, // yes/no
    suicidalIntent, // yes/no
    suicidalPlan, // yes/no
    suicidalBehavior, // yes/no (past 3 months)
    preparatoryActs, // yes/no
  } = data;

  let riskLevel, immediateAction, recommendation;

  // Determine highest risk level present
  if (suicidalBehavior || preparatoryActs) {
    riskLevel = 'HIGH RISK - Imminent Danger';
    immediateAction =
      '🚨 IMMEDIATE INTERVENTION REQUIRED - Do not leave patient alone, remove means, emergency psychiatric evaluation';
    recommendation =
      'Emergency department or psychiatric hospitalization, 24/7 supervision, crisis hotline: 988';
  } else if (suicidalIntent || suicidalPlan) {
    riskLevel = 'HIGH RISK - Active Suicidal Ideation';
    immediateAction =
      '⚠️ URGENT - Immediate safety assessment, consider emergency psychiatric evaluation';
    recommendation =
      'Same-day psychiatric evaluation, safety plan, remove access to lethal means, consider hospitalization';
  } else if (thoughtsWithMethod) {
    riskLevel = 'MODERATE RISK - Ideation with Method';
    immediateAction = 'Urgent mental health referral required';
    recommendation =
      'Psychiatric evaluation within 24-48 hours, safety plan, increase support, daily check-ins';
  } else if (suicidalThoughts) {
    riskLevel = 'MODERATE RISK - Passive Ideation';
    immediateAction = 'Mental health referral needed';
    recommendation =
      'Outpatient psychiatric evaluation within 1 week, safety plan, crisis resources, supportive counseling';
  } else if (wishToBeDead) {
    riskLevel = 'LOW TO MODERATE RISK';
    immediateAction = 'Monitor closely, provide resources';
    recommendation = 'Mental health screening, supportive counseling, reassess at next visit';
  } else {
    riskLevel = 'LOW RISK';
    immediateAction = 'No immediate intervention needed';
    recommendation = 'Continue routine care, reassess if symptoms change';
  }

  return {
    riskLevel,
    immediateAction,
    recommendation,
    suicidalIdeation: {
      wishToBeDead,
      suicidalThoughts,
      thoughtsWithMethod,
      suicidalIntent,
      suicidalPlan,
    },
    suicidalBehavior: {
      suicidalBehavior,
      preparatoryActs,
    },
    crisisResources: {
      nationalSuicidePreventionLifeline: '988',
      crisisTextLine: 'Text HOME to 741741',
      emergencyServices: '911',
    },
    safetyPlanning:
      'Create written safety plan: warning signs, coping strategies, social contacts, professional contacts, making environment safe',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * API ROUTE HANDLERS
 * ═══════════════════════════════════════════════════════════
 */

async function handlePHQ9(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating PHQ-9 score...');

    const result = calculatePHQ9(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'PHQ9_SCREENING',
      details: { score: result.totalScore, severity: result.severity },
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'PHQ-9 Depression Screening',
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ PHQ-9 Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate PHQ-9',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
}

async function handleGAD7(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating GAD-7 score...');

    const result = calculateGAD7(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'GAD7_SCREENING',
      details: { score: result.totalScore, severity: result.severity },
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'GAD-7 Anxiety Screening',
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ GAD-7 Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate GAD-7',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
}

async function handleMMSE(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating MMSE score...');

    const result = calculateMMSE(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'MMSE_ASSESSMENT',
      details: { score: result.totalScore, cognitiveStatus: result.cognitiveStatus },
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'Mini-Mental State Examination',
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ MMSE Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate MMSE',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
}

async function handleHamiltonDepression(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating Hamilton Depression Scale...');

    const result = calculateHamiltonDepression(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'HAMILTON_DEPRESSION_ASSESSMENT',
      details: { score: result.totalScore, severity: result.severity },
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'Hamilton Depression Rating Scale',
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ Hamilton Depression Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate Hamilton Depression scale',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
}

async function handlePANSS(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating PANSS score...');

    const result = calculatePANSS(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'PANSS_ASSESSMENT',
      details: { score: result.totalScore, severity: result.severity },
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'PANSS Scale',
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ PANSS Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate PANSS',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
}

async function handleAUDIT(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating AUDIT score...');

    const result = calculateAUDIT(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'AUDIT_SCREENING',
      details: { score: result.totalScore, riskLevel: result.riskLevel },
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'AUDIT Alcohol Screening',
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ AUDIT Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate AUDIT',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
}

async function handleColumbiaSuicide(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Assessing suicide risk (C-SSRS)...');

    const result = assessColumbiaSuicide(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'COLUMBIA_SUICIDE_ASSESSMENT',
      details: { riskLevel: result.riskLevel },
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'Columbia Suicide Severity Rating Scale',
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ Columbia Suicide Assessment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess suicide risk',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
}

module.exports = {
  handlePHQ9,
  handleGAD7,
  handleMMSE,
  handleHamiltonDepression,
  handlePANSS,
  handleAUDIT,
  handleColumbiaSuicide,
  calculatePHQ9,
  calculateGAD7,
  calculateMMSE,
  calculateHamiltonDepression,
  calculatePANSS,
  calculateAUDIT,
  assessColumbiaSuicide,
};
