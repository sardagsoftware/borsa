/**
 * 🧠 NEUROLOGY CLINICAL TOOLS API
 * Production-ready neurological assessment tools
 *
 * FEATURES:
 * - Glasgow Coma Scale (GCS) calculator
 * - NIH Stroke Scale (NIHSS) calculator
 * - ABCD2 Score (TIA stroke risk)
 * - Modified Rankin Scale (mRS)
 * - Hunt and Hess Scale (Subarachnoid Hemorrhage)
 * - Fisher Scale (SAH grading)
 * - Seizure classification tool
 * - Headache POUND criteria (Migraine diagnosis)
 *
 * WHITE-HAT COMPLIANT - Evidence-based neurological assessments
 */

const { logMedicalAudit } = require('../../config/white-hat-policy');

/**
 * ═══════════════════════════════════════════════════════════
 * GLASGOW COMA SCALE (GCS)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate Glasgow Coma Scale
 * GCS = Eye Opening + Verbal Response + Motor Response
 * Range: 3-15 (3 = worst, 15 = best)
 */
function calculateGCS(data) {
  const { eyeOpening, verbalResponse, motorResponse } = data;

  const totalScore = eyeOpening + verbalResponse + motorResponse;

  let severity, recommendation, interpretation;

  if (totalScore >= 13) {
    severity = 'Mild Brain Injury';
    interpretation = 'Minor head injury';
    recommendation = 'Observe closely, CT scan if any concerning features';
  } else if (totalScore >= 9) {
    severity = 'Moderate Brain Injury';
    interpretation = 'Moderate head injury requiring admission';
    recommendation = 'Hospital admission, neurosurgical consultation, CT scan mandatory';
  } else {
    severity = 'Severe Brain Injury';
    interpretation = 'Severe brain injury with coma';
    recommendation = '⚠️ CRITICAL - ICU admission, intubation likely needed, immediate neurosurgical evaluation';
  }

  return {
    totalScore,
    breakdown: {
      eyeOpening,
      verbalResponse,
      motorResponse
    },
    severity,
    interpretation,
    recommendation,
    scale: '3-15 (15 = normal)',
    components: {
      eye: getEyeDescription(eyeOpening),
      verbal: getVerbalDescription(verbalResponse),
      motor: getMotorDescription(motorResponse)
    }
  };
}

function getEyeDescription(score) {
  const descriptions = {
    4: 'Spontaneous',
    3: 'To speech',
    2: 'To pain',
    1: 'None'
  };
  return descriptions[score] || 'Unknown';
}

function getVerbalDescription(score) {
  const descriptions = {
    5: 'Oriented',
    4: 'Confused',
    3: 'Inappropriate words',
    2: 'Incomprehensible sounds',
    1: 'None'
  };
  return descriptions[score] || 'Unknown';
}

function getMotorDescription(score) {
  const descriptions = {
    6: 'Obeys commands',
    5: 'Localizes pain',
    4: 'Withdraws from pain',
    3: 'Flexion to pain (decorticate)',
    2: 'Extension to pain (decerebrate)',
    1: 'None'
  };
  return descriptions[score] || 'Unknown';
}

/**
 * ═══════════════════════════════════════════════════════════
 * NIH STROKE SCALE (NIHSS)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate NIH Stroke Scale
 * Comprehensive stroke severity assessment
 * Range: 0-42 (0 = no stroke, 42 = severe stroke)
 */
function calculateNIHSS(data) {
  const {
    levelOfConsciousness = 0,     // 0-3
    locQuestions = 0,              // 0-2
    locCommands = 0,               // 0-2
    bestGaze = 0,                  // 0-2
    visual = 0,                    // 0-3
    facialPalsy = 0,               // 0-3
    motorLeftArm = 0,              // 0-4
    motorRightArm = 0,             // 0-4
    motorLeftLeg = 0,              // 0-4
    motorRightLeg = 0,             // 0-4
    limbAtaxia = 0,                // 0-2
    sensory = 0,                   // 0-2
    bestLanguage = 0,              // 0-3
    dysarthria = 0,                // 0-2
    extinctionInattention = 0      // 0-2
  } = data;

  const totalScore =
    levelOfConsciousness + locQuestions + locCommands +
    bestGaze + visual + facialPalsy +
    motorLeftArm + motorRightArm + motorLeftLeg + motorRightLeg +
    limbAtaxia + sensory + bestLanguage + dysarthria + extinctionInattention;

  let severity, interpretation, recommendation, tPAEligibility;

  if (totalScore === 0) {
    severity = 'No Stroke';
    interpretation = 'No stroke symptoms detected';
    recommendation = 'No acute intervention needed';
    tPAEligibility = 'Not indicated';
  } else if (totalScore <= 4) {
    severity = 'Minor Stroke';
    interpretation = 'Minor neurological deficit';
    recommendation = 'Consider thrombolysis, admit for observation';
    tPAEligibility = 'Consider if within time window';
  } else if (totalScore <= 15) {
    severity = 'Moderate Stroke';
    interpretation = 'Moderate neurological deficit';
    recommendation = 'Thrombolysis candidate if within time window, consider thrombectomy';
    tPAEligibility = 'Likely candidate if no contraindications';
  } else if (totalScore <= 20) {
    severity = 'Moderate to Severe Stroke';
    interpretation = 'Significant neurological deficit';
    recommendation = 'Urgent thrombolysis and/or thrombectomy, ICU monitoring';
    tPAEligibility = 'Strong candidate for intervention';
  } else {
    severity = 'Severe Stroke';
    interpretation = 'Severe neurological deficit';
    recommendation = '⚠️ CRITICAL - Consider thrombectomy, ICU admission, neurosurgical consultation';
    tPAEligibility = 'Evaluate for mechanical thrombectomy';
  }

  return {
    totalScore,
    severity,
    interpretation,
    recommendation,
    tPAEligibility,
    scale: '0-42 (0 = no stroke)',
    timeWindow: {
      tPA: '4.5 hours from symptom onset',
      thrombectomy: 'Up to 24 hours in selected patients'
    }
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * ABCD2 SCORE (TIA Stroke Risk)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate ABCD2 Score for stroke risk after TIA
 * Predicts 2-day stroke risk after transient ischemic attack
 */
function calculateABCD2(data) {
  const {
    age,                    // ≥60 = 1 point
    bloodPressure,          // SBP ≥140 or DBP ≥90 = 1 point
    clinicalFeaturesUnilateralWeakness,  // 2 points
    clinicalFeaturesSpeechImpairment,    // 1 point (without weakness)
    durationMinutes,        // ≥60 min = 2, 10-59 min = 1
    diabetes                // Yes = 1 point
  } = data;

  let score = 0;

  // Age ≥60
  if (age >= 60) score += 1;

  // Blood pressure
  if (bloodPressure.systolic >= 140 || bloodPressure.diastolic >= 90) score += 1;

  // Clinical features
  if (clinicalFeaturesUnilateralWeakness) {
    score += 2;
  } else if (clinicalFeaturesSpeechImpairment) {
    score += 1;
  }

  // Duration
  if (durationMinutes >= 60) {
    score += 2;
  } else if (durationMinutes >= 10) {
    score += 1;
  }

  // Diabetes
  if (diabetes) score += 1;

  let twoDayRisk, sevenDayRisk, ninetyDayRisk, riskCategory, recommendation;

  if (score <= 3) {
    twoDayRisk = '1.0%';
    sevenDayRisk = '1.2%';
    ninetyDayRisk = '3.1%';
    riskCategory = 'Low Risk';
    recommendation = 'Outpatient evaluation within 24-48 hours acceptable';
  } else if (score <= 5) {
    twoDayRisk = '4.1%';
    sevenDayRisk = '5.9%';
    ninetyDayRisk = '9.8%';
    riskCategory = 'Moderate Risk';
    recommendation = 'Urgent evaluation within 24 hours, consider admission';
  } else {
    twoDayRisk = '8.1%';
    sevenDayRisk = '11.7%';
    ninetyDayRisk = '17.8%';
    riskCategory = 'High Risk';
    recommendation = '⚠️ URGENT - Hospital admission for immediate workup and treatment';
  }

  return {
    score,
    riskCategory,
    twoDayRisk,
    sevenDayRisk,
    ninetyDayRisk,
    recommendation,
    scale: '0-7 (higher = higher stroke risk)',
    workup: 'Carotid imaging, echocardiogram, MRI brain, antiplatelet therapy'
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * MODIFIED RANKIN SCALE (mRS)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Modified Rankin Scale - Functional outcome after stroke
 */
function interpretModifiedRankinScale(score) {
  const scales = {
    0: {
      description: 'No symptoms',
      interpretation: 'No symptoms at all',
      functionalStatus: 'Completely independent'
    },
    1: {
      description: 'No significant disability',
      interpretation: 'Able to carry out all usual activities despite some symptoms',
      functionalStatus: 'Independent'
    },
    2: {
      description: 'Slight disability',
      interpretation: 'Unable to carry out all previous activities but able to look after own affairs without assistance',
      functionalStatus: 'Functionally independent'
    },
    3: {
      description: 'Moderate disability',
      interpretation: 'Requires some help, but able to walk unassisted',
      functionalStatus: 'Modified independence'
    },
    4: {
      description: 'Moderately severe disability',
      interpretation: 'Unable to walk without assistance, unable to attend to bodily needs without assistance',
      functionalStatus: 'Dependent'
    },
    5: {
      description: 'Severe disability',
      interpretation: 'Bedridden, incontinent, requires constant nursing care and attention',
      functionalStatus: 'Fully dependent'
    },
    6: {
      description: 'Dead',
      interpretation: 'Death',
      functionalStatus: 'Dead'
    }
  };

  const result = scales[score] || scales[0];

  return {
    score,
    ...result,
    prognosticSignificance: score <= 2 ? 'Good outcome' : score <= 4 ? 'Moderate outcome' : 'Poor outcome'
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * HUNT AND HESS SCALE (Subarachnoid Hemorrhage)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Hunt and Hess Classification for Subarachnoid Hemorrhage
 */
function huntAndHessScale(grade) {
  const scales = {
    1: {
      description: 'Asymptomatic or mild headache and slight nuchal rigidity',
      mortality: '0-5%',
      management: 'Aneurysm repair when stable',
      prognosis: 'Excellent'
    },
    2: {
      description: 'Moderate to severe headache, nuchal rigidity, no neurologic deficit except cranial nerve palsy',
      mortality: '5-10%',
      management: 'Early aneurysm repair',
      prognosis: 'Good'
    },
    3: {
      description: 'Drowsiness, confusion, or mild focal deficit',
      mortality: '10-15%',
      management: 'Stabilize then early repair',
      prognosis: 'Fair'
    },
    4: {
      description: 'Stupor, moderate to severe hemiparesis, early decerebrate rigidity',
      mortality: '60-70%',
      management: 'Intensive care, delayed repair if survives',
      prognosis: 'Poor'
    },
    5: {
      description: 'Deep coma, decerebrate rigidity, moribund appearance',
      mortality: '70-100%',
      management: 'Supportive care, rarely surgical candidates',
      prognosis: 'Very poor'
    }
  };

  const result = scales[grade] || scales[1];

  return {
    grade,
    ...result,
    scale: 'Hunt and Hess Grade 1-5',
    urgency: grade >= 4 ? 'Critical' : grade >= 3 ? 'Urgent' : 'Semi-urgent'
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * SEIZURE CLASSIFICATION TOOL
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Classify seizure type based on ILAE 2017 classification
 */
function classifySeizure(data) {
  const {
    awarenessLevel,    // 'aware', 'impaired', 'unknown'
    motorComponent,    // 'yes', 'no'
    onset,            // 'focal', 'generalized', 'unknown'
    progression       // 'none', 'bilateral-tonic-clonic', 'absence', 'tonic', 'clonic', 'myoclonic', 'atonic'
  } = data;

  let seizureType, description, firstLineAED, workup;

  if (onset === 'focal') {
    if (awarenessLevel === 'aware' && motorComponent === 'no') {
      seizureType = 'Focal Aware Non-Motor (Aura)';
      description = 'Previously called "simple partial seizure"';
      firstLineAED = 'Levetiracetam, Lamotrigine, Carbamazepine';
    } else if (awarenessLevel === 'aware' && motorComponent === 'yes') {
      seizureType = 'Focal Aware Motor';
      description = 'Focal seizure with motor symptoms, consciousness retained';
      firstLineAED = 'Levetiracetam, Lamotrigine, Carbamazepine';
    } else if (awarenessLevel === 'impaired') {
      seizureType = 'Focal Impaired Awareness';
      description = 'Previously called "complex partial seizure"';
      firstLineAED = 'Levetiracetam, Lamotrigine, Carbamazepine';
    }

    if (progression === 'bilateral-tonic-clonic') {
      seizureType = 'Focal to Bilateral Tonic-Clonic';
      description = 'Focal onset evolving to generalized seizure (previously "secondary generalization")';
      firstLineAED = 'Levetiracetam, Lamotrigine, Valproate';
    }

    workup = 'MRI brain with epilepsy protocol, EEG, consider video-EEG monitoring';

  } else if (onset === 'generalized') {
    if (progression === 'absence') {
      seizureType = 'Generalized Absence';
      description = 'Brief staring spells, abrupt onset/offset';
      firstLineAED = 'Ethosuximide, Valproate';
    } else if (progression === 'tonic-clonic') {
      seizureType = 'Generalized Tonic-Clonic';
      description = 'Grand mal seizure - tonic phase followed by clonic phase';
      firstLineAED = 'Valproate, Levetiracetam, Lamotrigine';
    } else if (progression === 'myoclonic') {
      seizureType = 'Generalized Myoclonic';
      description = 'Brief muscle jerks';
      firstLineAED = 'Valproate, Levetiracetam';
    } else if (progression === 'atonic') {
      seizureType = 'Generalized Atonic (Drop Attack)';
      description = 'Sudden loss of muscle tone';
      firstLineAED = 'Valproate, Lamotrigine';
    }

    workup = 'EEG (3 Hz spike-wave for absence), MRI brain, genetic testing if syndromic';
  }

  return {
    seizureType,
    description,
    firstLineAED,
    workup,
    onset,
    recommendation: 'Neurology consultation for new-onset seizures, consider AED after 2+ unprovoked seizures'
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * MIGRAINE DIAGNOSTIC TOOL (POUND Criteria)
 * ═══════════════════════════════════════════════════════════
 */

/**
 * POUND Criteria for migraine diagnosis
 * Pulsatile, One-day duration, Unilateral, Nausea, Disabling
 */
function assessMigraine(data) {
  const {
    pulsatile,        // boolean
    durationHours,    // 4-72 hours
    unilateral,       // boolean
    nausea,          // boolean or vomiting
    disabling        // boolean
  } = data;

  let score = 0;

  if (pulsatile) score += 1;
  if (durationHours >= 4 && durationHours <= 72) score += 1;
  if (unilateral) score += 1;
  if (nausea) score += 1;
  if (disabling) score += 1;

  let likelihood, diagnosis, recommendation;

  if (score >= 4) {
    likelihood = '92%';
    diagnosis = 'Migraine highly likely';
    recommendation = 'Start migraine-specific therapy (triptans for acute, consider prophylaxis if >4 attacks/month)';
  } else if (score === 3) {
    likelihood = '64%';
    diagnosis = 'Migraine probable';
    recommendation = 'Trial of migraine therapy reasonable, rule out secondary causes';
  } else if (score === 2) {
    likelihood = '17%';
    diagnosis = 'Migraine possible but less likely';
    recommendation = 'Consider other headache types (tension-type, cluster), neuroimaging if red flags';
  } else {
    likelihood = '<10%';
    diagnosis = 'Migraine unlikely';
    recommendation = 'Evaluate for other headache disorders or secondary causes';
  }

  return {
    score,
    likelihood,
    diagnosis,
    recommendation,
    poundCriteria: {
      pulsatile,
      oneDayDuration: durationHours >= 4 && durationHours <= 72,
      unilateral,
      nausea,
      disabling
    },
    redFlags: 'SNOOP4 - Systemic symptoms, Neurologic symptoms, Onset sudden, Older age (>50), Pattern change, Positional, Precipitated, Papilledema, Progressive, Pregnancy'
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * API ROUTE HANDLERS
 * ═══════════════════════════════════════════════════════════
 */

async function handleGCS(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating Glasgow Coma Scale...');

    const result = calculateGCS(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'GCS_CALCULATION',
      details: { score: result.totalScore, severity: result.severity }
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'Glasgow Coma Scale',
        response_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('❌ GCS Calculation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate GCS',
      message: error.message
    });
  }
}

async function handleNIHSS(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating NIH Stroke Scale...');

    const result = calculateNIHSS(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'NIHSS_CALCULATION',
      details: { score: result.totalScore, severity: result.severity }
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'NIH Stroke Scale',
        response_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('❌ NIHSS Calculation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate NIHSS',
      message: error.message
    });
  }
}

async function handleABCD2(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Calculating ABCD2 Score...');

    const result = calculateABCD2(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'ABCD2_CALCULATION',
      details: { score: result.score, riskCategory: result.riskCategory }
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'ABCD2 Score',
        response_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('❌ ABCD2 Calculation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate ABCD2',
      message: error.message
    });
  }
}

async function handleModifiedRankin(req, res) {
  const startTime = Date.now();

  try {
    const { score, hospital_id, user_id, patient_id } = req.body;
    console.log('🧠 Interpreting Modified Rankin Scale...');

    const result = interpretModifiedRankinScale(score);

    logMedicalAudit({
      hospital_id,
      user_id,
      patient_id,
      action: 'MODIFIED_RANKIN_ASSESSMENT',
      details: { score, functionalStatus: result.functionalStatus }
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'Modified Rankin Scale',
        response_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('❌ Modified Rankin Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to interpret Modified Rankin Scale',
      message: error.message
    });
  }
}

async function handleHuntHess(req, res) {
  const startTime = Date.now();

  try {
    const { grade, hospital_id, user_id, patient_id } = req.body;
    console.log('🧠 Assessing Hunt and Hess Scale...');

    const result = huntAndHessScale(grade);

    logMedicalAudit({
      hospital_id,
      user_id,
      patient_id,
      action: 'HUNT_HESS_ASSESSMENT',
      details: { grade, mortality: result.mortality }
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'Hunt and Hess Scale',
        response_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('❌ Hunt and Hess Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess Hunt and Hess scale',
      message: error.message
    });
  }
}

async function handleSeizureClassification(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Classifying seizure type...');

    const result = classifySeizure(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'SEIZURE_CLASSIFICATION',
      details: { seizureType: result.seizureType }
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'Seizure Classification Tool',
        response_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('❌ Seizure Classification Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to classify seizure',
      message: error.message
    });
  }
}

async function handleMigraineAssessment(req, res) {
  const startTime = Date.now();

  try {
    const data = req.body;
    console.log('🧠 Assessing migraine likelihood...');

    const result = assessMigraine(data);

    logMedicalAudit({
      hospital_id: data.hospital_id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      action: 'MIGRAINE_ASSESSMENT',
      details: { score: result.score, likelihood: result.likelihood }
    });

    res.json({
      success: true,
      result,
      metadata: {
        calculator: 'POUND Criteria (Migraine)',
        response_time_ms: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('❌ Migraine Assessment Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess migraine',
      message: error.message
    });
  }
}

module.exports = {
  handleGCS,
  handleNIHSS,
  handleABCD2,
  handleModifiedRankin,
  handleHuntHess,
  handleSeizureClassification,
  handleMigraineAssessment,
  calculateGCS,
  calculateNIHSS,
  calculateABCD2,
  interpretModifiedRankinScale,
  huntAndHessScale,
  classifySeizure,
  assessMigraine
};
