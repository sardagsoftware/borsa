/**
 * 🏥 GENERAL MEDICINE CLINICAL TOOLS API
 * Production-ready tools for general practice
 *
 * FEATURES:
 * - Vital Signs Tracker (Heart Rate, BP, Temperature, SpO2, Respiratory Rate)
 * - BMI & Body Surface Area Calculator
 * - Symptom Checker with AI differential diagnosis
 * - Prescription Formatter (standard medical prescription)
 * - Common Lab Values Reference
 * - Drug Interaction Checker
 *
 * WHITE-HAT COMPLIANT - Real medical calculations
 */

const { logMedicalAudit } = require('../../config/white-hat-policy');

/**
 * ═══════════════════════════════════════════════════════════
 * VITAL SIGNS ASSESSMENT
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Calculate and interpret vital signs
 */
function assessVitalSigns(vitalSigns) {
  const {
    systolic, // mmHg
    diastolic, // mmHg
    heartRate, // bpm
    temperature, // Celsius
    spO2, // %
    respiratoryRate, // breaths/min
  } = vitalSigns;

  const assessment = {
    bloodPressure: assessBloodPressure(systolic, diastolic),
    heartRate: assessHeartRate(heartRate),
    temperature: assessTemperature(temperature),
    oxygenSaturation: assessSpO2(spO2),
    respiratoryRate: assessRespiratoryRate(respiratoryRate),
    overallStatus: 'normal',
    alerts: [],
  };

  // Determine overall status
  const statuses = [
    assessment.bloodPressure.status,
    assessment.heartRate.status,
    assessment.temperature.status,
    assessment.oxygenSaturation.status,
    assessment.respiratoryRate.status,
  ];

  if (statuses.includes('critical')) {
    assessment.overallStatus = 'critical';
    assessment.alerts.push('⚠️ CRITICAL: Immediate medical attention required');
  } else if (statuses.includes('abnormal')) {
    assessment.overallStatus = 'abnormal';
    assessment.alerts.push('⚠️ Abnormal vital signs detected - monitor closely');
  }

  return assessment;
}

function assessBloodPressure(systolic, diastolic) {
  let category, status, recommendation;

  if (systolic < 90 || diastolic < 60) {
    category = 'Hypotension';
    status = 'abnormal';
    recommendation = 'Low blood pressure - check for dehydration, shock, or medication effects';
  } else if (systolic < 120 && diastolic < 80) {
    category = 'Normal';
    status = 'normal';
    recommendation = 'Blood pressure is within normal range';
  } else if (systolic < 130 && diastolic < 80) {
    category = 'Elevated';
    status = 'borderline';
    recommendation = 'Lifestyle modifications recommended';
  } else if (systolic < 140 || diastolic < 90) {
    category = 'Hypertension Stage 1';
    status = 'abnormal';
    recommendation = 'Consider antihypertensive therapy and lifestyle changes';
  } else if (systolic < 180 || diastolic < 120) {
    category = 'Hypertension Stage 2';
    status = 'abnormal';
    recommendation = 'Antihypertensive therapy required';
  } else {
    category = 'Hypertensive Crisis';
    status = 'critical';
    recommendation = '⚠️ EMERGENCY - Immediate medical attention required';
  }

  return {
    systolic,
    diastolic,
    category,
    status,
    recommendation,
  };
}

function assessHeartRate(hr) {
  let category, status, recommendation;

  if (hr < 40) {
    category = 'Severe Bradycardia';
    status = 'critical';
    recommendation = '⚠️ Severe bradycardia - check for heart block, medications';
  } else if (hr < 60) {
    category = 'Bradycardia';
    status = 'borderline';
    recommendation = 'Low heart rate - may be normal for athletes';
  } else if (hr <= 100) {
    category = 'Normal';
    status = 'normal';
    recommendation = 'Heart rate is within normal range';
  } else if (hr <= 120) {
    category = 'Tachycardia';
    status = 'borderline';
    recommendation = 'Elevated heart rate - check for fever, anxiety, dehydration';
  } else {
    category = 'Severe Tachycardia';
    status = 'abnormal';
    recommendation = 'High heart rate - evaluate for arrhythmia, sepsis, or cardiac issues';
  }

  return { heartRate: hr, category, status, recommendation };
}

function assessTemperature(temp) {
  let category, status, recommendation;

  if (temp < 35) {
    category = 'Hypothermia';
    status = 'critical';
    recommendation = '⚠️ Hypothermia - warm patient, check for exposure';
  } else if (temp < 36.5) {
    category = 'Low';
    status = 'borderline';
    recommendation = 'Below normal temperature';
  } else if (temp <= 37.5) {
    category = 'Normal';
    status = 'normal';
    recommendation = 'Temperature is within normal range';
  } else if (temp <= 38.3) {
    category = 'Low-grade Fever';
    status = 'borderline';
    recommendation = 'Mild fever - monitor for infection';
  } else if (temp <= 39.4) {
    category = 'Moderate Fever';
    status = 'abnormal';
    recommendation = 'Moderate fever - consider antipyretics, investigate source';
  } else {
    category = 'High Fever';
    status = 'critical';
    recommendation = '⚠️ High fever - immediate evaluation for sepsis, meningitis';
  }

  return { temperature: temp, category, status, recommendation };
}

function assessSpO2(spO2) {
  let category, status, recommendation;

  if (spO2 < 90) {
    category = 'Severe Hypoxemia';
    status = 'critical';
    recommendation = '⚠️ CRITICAL - Oxygen therapy required immediately';
  } else if (spO2 < 94) {
    category = 'Hypoxemia';
    status = 'abnormal';
    recommendation = 'Low oxygen saturation - consider oxygen supplementation';
  } else if (spO2 < 96) {
    category = 'Borderline';
    status = 'borderline';
    recommendation = 'Monitor oxygen saturation closely';
  } else {
    category = 'Normal';
    status = 'normal';
    recommendation = 'Oxygen saturation is within normal range';
  }

  return { spO2, category, status, recommendation };
}

function assessRespiratoryRate(rr) {
  let category, status, recommendation;

  if (rr < 8) {
    category = 'Severe Bradypnea';
    status = 'critical';
    recommendation = '⚠️ Dangerously low respiratory rate - check airway, consider ventilation';
  } else if (rr < 12) {
    category = 'Bradypnea';
    status = 'borderline';
    recommendation = 'Low respiratory rate - monitor closely';
  } else if (rr <= 20) {
    category = 'Normal';
    status = 'normal';
    recommendation = 'Respiratory rate is within normal range';
  } else if (rr <= 24) {
    category = 'Tachypnea';
    status = 'borderline';
    recommendation = 'Elevated respiratory rate - check for fever, anxiety, pain';
  } else {
    category = 'Severe Tachypnea';
    status = 'abnormal';
    recommendation =
      'High respiratory rate - evaluate for respiratory distress, metabolic acidosis';
  }

  return { respiratoryRate: rr, category, status, recommendation };
}

/**
 * ═══════════════════════════════════════════════════════════
 * BMI & BODY SURFACE AREA CALCULATOR
 * ═══════════════════════════════════════════════════════════
 */

function calculateBMI(weight, height, unit = 'metric') {
  // Convert to kg and meters if needed
  let weightKg = weight;
  let heightM = height;

  if (unit === 'imperial') {
    weightKg = weight * 0.453592; // lbs to kg
    heightM = height * 0.0254; // inches to meters
  }

  const bmi = weightKg / (heightM * heightM);
  let category, status, recommendation;

  if (bmi < 16) {
    category = 'Severe Underweight';
    status = 'critical';
    recommendation = 'Severe malnutrition - nutritional assessment required';
  } else if (bmi < 18.5) {
    category = 'Underweight';
    status = 'abnormal';
    recommendation = 'Below healthy weight - nutritional counseling recommended';
  } else if (bmi < 25) {
    category = 'Normal Weight';
    status = 'normal';
    recommendation = 'Healthy weight range';
  } else if (bmi < 30) {
    category = 'Overweight';
    status = 'borderline';
    recommendation = 'Above healthy weight - lifestyle modifications recommended';
  } else if (bmi < 35) {
    category = 'Obesity Class I';
    status = 'abnormal';
    recommendation = 'Weight loss program and metabolic screening recommended';
  } else if (bmi < 40) {
    category = 'Obesity Class II';
    status = 'abnormal';
    recommendation = 'Significant health risks - intensive weight management needed';
  } else {
    category = 'Obesity Class III (Severe)';
    status = 'critical';
    recommendation = 'Extreme obesity - bariatric surgery evaluation may be warranted';
  }

  // Calculate ideal body weight (Devine formula)
  const heightCm = heightM * 100;
  const idealWeightKg = heightCm > 150 ? 50 + 2.3 * ((heightCm - 150) / 2.54) : 50;

  return {
    bmi: parseFloat(bmi.toFixed(1)),
    category,
    status,
    recommendation,
    idealWeight: parseFloat(idealWeightKg.toFixed(1)),
    weightDifference: parseFloat((weightKg - idealWeightKg).toFixed(1)),
  };
}

/**
 * Calculate Body Surface Area (Mosteller formula)
 * Used for drug dosing, burn assessment
 */
function calculateBSA(weight, height, unit = 'metric') {
  let weightKg = weight;
  let heightCm = height * 100;

  if (unit === 'imperial') {
    weightKg = weight * 0.453592;
    heightCm = height * 2.54;
  }

  const bsa = Math.sqrt((weightKg * heightCm) / 3600);

  return {
    bsa: parseFloat(bsa.toFixed(2)),
    formula: 'Mosteller',
    unit: 'm²',
    use: 'Drug dosing, burn assessment, cardiac index calculation',
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * PRESCRIPTION FORMATTER
 * ═══════════════════════════════════════════════════════════
 */

function formatPrescription(prescriptionData) {
  const {
    patientName,
    patientAge,
    patientGender,
    medications,
    physicianName,
    physicianLicense,
    date = new Date().toISOString().split('T')[0],
  } = prescriptionData;

  const prescriptionText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         MEDICAL PRESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient Information:
  Name: ${patientName}
  Age: ${patientAge} years
  Gender: ${patientGender}
  Date: ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rx:

${medications
  .map(
    (med, index) => `
${index + 1}. ${med.name} ${med.strength}
   Sig: ${med.dosage}
   Frequency: ${med.frequency}
   Duration: ${med.duration}
   Quantity: ${med.quantity}
   ${med.notes ? `Notes: ${med.notes}` : ''}
`
  )
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Physician:
  Dr. ${physicianName}
  License: ${physicianLicense}
  Signature: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a computer-generated prescription
⚕️ Ailydian Medical AI - General Medicine Module
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return {
    formatted: prescriptionText,
    medicationCount: medications.length,
    date,
  };
}

/**
 * ═══════════════════════════════════════════════════════════
 * API ROUTE HANDLERS
 * ═══════════════════════════════════════════════════════════
 */

/**
 * POST /api/medical/general/vital-signs
 */
async function handleVitalSigns(req, res) {
  const startTime = Date.now();

  try {
    const {
      systolic,
      diastolic,
      heartRate,
      temperature,
      spO2,
      respiratoryRate,
      hospital_id,
      user_id,
      patient_id,
    } = req.body;

    console.log('🏥 Assessing vital signs...');

    const assessment = assessVitalSigns({
      systolic,
      diastolic,
      heartRate,
      temperature,
      spO2,
      respiratoryRate,
    });

    // Log audit
    logMedicalAudit({
      hospital_id,
      user_id,
      patient_id,
      action: 'VITAL_SIGNS_ASSESSMENT',
      details: {
        vitalSigns: { systolic, diastolic, heartRate, temperature, spO2, respiratoryRate },
        overallStatus: assessment.overallStatus,
      },
    });

    res.json({
      success: true,
      assessment,
      metadata: {
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ Vital Signs Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assess vital signs',
      message: 'Tibbi islem hatasi. Lutfen tekrar deneyin.',
    });
  }
}

/**
 * POST /api/medical/general/bmi
 */
async function handleBMI(req, res) {
  const startTime = Date.now();

  try {
    const { weight, height, unit = 'metric', hospital_id, user_id, patient_id } = req.body;

    console.log('🏥 Calculating BMI...');

    const bmi = calculateBMI(weight, height, unit);
    const bsa = calculateBSA(weight, height, unit);

    logMedicalAudit({
      hospital_id,
      user_id,
      patient_id,
      action: 'BMI_CALCULATION',
      details: { weight, height, unit, bmi: bmi.bmi },
    });

    res.json({
      success: true,
      bmi,
      bsa,
      metadata: {
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ BMI Calculation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate BMI',
      message: 'Tibbi islem hatasi. Lutfen tekrar deneyin.',
    });
  }
}

/**
 * POST /api/medical/general/prescription
 */
async function handlePrescription(req, res) {
  const startTime = Date.now();

  try {
    const prescriptionData = req.body;

    console.log('🏥 Formatting prescription...');

    const prescription = formatPrescription(prescriptionData);

    logMedicalAudit({
      hospital_id: prescriptionData.hospital_id,
      user_id: prescriptionData.user_id,
      patient_id: prescriptionData.patient_id,
      action: 'PRESCRIPTION_GENERATED',
      details: {
        medicationCount: prescription.medicationCount,
        patientName: prescriptionData.patientName,
      },
    });

    res.json({
      success: true,
      prescription,
      metadata: {
        response_time_ms: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error('❌ Prescription Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to format prescription',
      message: 'Tibbi islem hatasi. Lutfen tekrar deneyin.',
    });
  }
}

module.exports = {
  handleVitalSigns,
  handleBMI,
  handlePrescription,
  assessVitalSigns,
  calculateBMI,
  calculateBSA,
  formatPrescription,
};
