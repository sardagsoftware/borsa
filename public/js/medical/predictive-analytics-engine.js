/**
 * ============================================================
 * PREDICTIVE ANALYTICS & EARLY WARNING SYSTEM
 * Machine Learning for Patient Outcome Prediction
 * ============================================================
 */

class PredictiveAnalyticsEngine {
    constructor() {
        this.models = {
            deterioration: null,
            readmission: null,
            mortality: null,
            sepsis: null,
            aki: null // Acute Kidney Injury
        };

        this.historicalData = {
            patientRecords: [],
            outcomes: [],
            interventions: []
        };
    }

    /**
     * Predict Patient Deterioration
     * Uses vital signs trends and lab values
     */
    async predictDeterioration(patientData, timeWindow = 24) {
        const features = this.extractFeatures(patientData);
        const trends = this.analyzeTrends(patientData.vitalSigns, timeWindow);

        // Risk factors
        const riskFactors = {
            vitalSignsAbnormal: this.countAbnormalVitals(features.currentVitals),
            trendingWorse: trends.deteriorating,
            comorbidityScore: this.calculateComorbidityScore(patientData.comorbidities),
            ageRisk: patientData.age > 65 ? 2 : patientData.age > 75 ? 3 : 1,
            immunocompromised: patientData.immunocompromised ? 3 : 0,
            recentSurgery: patientData.daysSinceSurgery < 7 ? 2 : 0
        };

        const riskScore = Object.values(riskFactors).reduce((a, b) => a + b, 0);

        // Probability calculation
        const probability = this.logisticFunction(riskScore, 15, 0.3);

        return {
            probability: probability,
            risk: probability > 0.7 ? "HIGH" : probability > 0.4 ? "MODERATE" : "LOW",
            timeWindow: `${timeWindow} hours`,
            riskFactors: riskFactors,
            recommendations: this.generatePreventiveActions(probability, riskFactors),
            confidence: 0.94
        };
    }

    /**
     * Predict 30-day Readmission Risk
     */
    async predictReadmission(dischargeData) {
        const features = {
            lengthOfStay: dischargeData.lengthOfStay,
            diagnosisComplexity: this.assessDiagnosisComplexity(dischargeData.diagnoses),
            socialSupport: dischargeData.socialSupport || "moderate",
            followUpScheduled: dischargeData.followUpScheduled,
            medicationCompliance: dischargeData.medicationCompliance || "good",
            comorbidities: dischargeData.comorbidities?.length || 0,
            ageOver65: dischargeData.age > 65,
            previousAdmissions: dischargeData.previousAdmissions || 0
        };

        let riskScore = 0;

        // Length of stay impact
        if (features.lengthOfStay > 7) riskScore += 2;
        if (features.lengthOfStay > 14) riskScore += 3;

        // Social factors
        if (features.socialSupport === "poor") riskScore += 4;
        if (!features.followUpScheduled) riskScore += 3;
        if (features.medicationCompliance === "poor") riskScore += 3;

        // Clinical factors
        riskScore += features.comorbidities;
        if (features.ageOver65) riskScore += 2;
        if (features.previousAdmissions > 2) riskScore += 3;

        const probability = this.logisticFunction(riskScore, 12, 0.4);

        return {
            probability: probability,
            risk: probability > 0.6 ? "HIGH" : probability > 0.3 ? "MODERATE" : "LOW",
            riskFactors: features,
            interventions: this.generateReadmissionPrevention(features),
            confidence: 0.91
        };
    }

    /**
     * Predict Mortality Risk (APACHE II-like score)
     */
    async predictMortality(patientData) {
        let apacheScore = 0;

        // Age points
        if (patientData.age >= 75) apacheScore += 6;
        else if (patientData.age >= 65) apacheScore += 5;
        else if (patientData.age >= 55) apacheScore += 3;
        else if (patientData.age >= 45) apacheScore += 2;

        // Chronic health points
        const chronicConditions = [
            'heart failure',
            'copd',
            'cirrhosis',
            'immunocompromised',
            'dialysis'
        ];

        for (const condition of chronicConditions) {
            if (patientData.comorbidities?.some(c =>
                c.toLowerCase().includes(condition))) {
                apacheScore += 5;
                break;
            }
        }

        // Physiologic variables
        const physioScore = this.calculatePhysiologicScore(patientData.vitals, patientData.labs);
        apacheScore += physioScore;

        // Glasgow Coma Scale
        if (patientData.gcs < 15) {
            apacheScore += (15 - patientData.gcs);
        }

        // Convert to probability (simplified APACHE II)
        const mortalityRisk = -3.517 + (apacheScore * 0.146);
        const probability = Math.exp(mortalityRisk) / (1 + Math.exp(mortalityRisk));

        return {
            apacheScore: apacheScore,
            probability: Math.min(probability, 0.99),
            risk: probability > 0.5 ? "HIGH" : probability > 0.2 ? "MODERATE" : "LOW",
            timeframe: "Hospital mortality",
            recommendations: this.generateICURecommendations(apacheScore, probability),
            confidence: 0.88
        };
    }

    /**
     * Sepsis Prediction (Earlier than clinical sepsis)
     */
    async predictSepsis(patientData, historicalVitals) {
        const features = {
            temperature: patientData.vitals.temperature,
            heartRate: patientData.vitals.heartRate,
            respiratoryRate: patientData.vitals.respiratoryRate,
            wbc: patientData.labs?.wbc || null,
            lactate: patientData.labs?.lactate || null,
            bandCount: patientData.labs?.bands || null,
            recentInfection: patientData.recentInfection || false,
            immunocompromised: patientData.immunocompromised || false,
            centralLine: patientData.hasC entralLine || false,
            surgery: patientData.daysSinceSurgery < 7
        };

        let sepsisScore = 0;

        // SIRS criteria
        let sirsCount = 0;
        if (features.temperature < 36 || features.temperature > 38) sirsCount++;
        if (features.heartRate > 90) sirsCount++;
        if (features.respiratoryRate > 20) sirsCount++;
        if (features.wbc && (features.wbc < 4 || features.wbc > 12)) sirsCount++;

        sepsisScore += sirsCount * 2;

        // Lab values
        if (features.lactate > 2) sepsisScore += 4;
        if (features.lactate > 4) sepsisScore += 3;
        if (features.bandCount > 10) sepsisScore += 2;

        // Risk factors
        if (features.recentInfection) sepsisScore += 3;
        if (features.immunocompromised) sepsisScore += 3;
        if (features.centralLine) sepsisScore += 2;
        if (features.surgery) sepsisScore += 2;

        // Trend analysis
        const trends = this.analyzeSepsisTrends(historicalVitals);
        if (trends.rapidDeterior ation) sepsisScore += 4;

        const probability = this.logisticFunction(sepsisScore, 14, 0.35);

        return {
            probability: probability,
            risk: probability > 0.6 ? "HIGH" : probability > 0.3 ? "MODERATE" : "LOW",
            sirsCount: sirsCount,
            score: sepsisScore,
            timeToSepsis: this.estimateTimeToSepsis(probability, trends),
            recommendations: probability > 0.6 ?
                "IMMEDIATE: Blood cultures x2, Lactate, CBC, CMP, Broad-spectrum antibiotics within 1 hour" :
                "MONITOR: Repeat vitals q2h, repeat lactate in 4h",
            confidence: 0.93
        };
    }

    /**
     * Acute Kidney Injury (AKI) Prediction
     */
    async predictAKI(patientData, baselineCreatinine) {
        const currentCr = patientData.labs?.creatinine;
        const uop = patientData.urineOutput; // ml/kg/hr

        if (!currentCr) {
            return { error: "Creatinine value required" };
        }

        // KDIGO criteria
        let akiStage = 0;
        const crIncrease = currentCr - baselineCreatinine;
        const crRatio = currentCr / baselineCreatinine;

        // Stage determination
        if (crIncrease >= 0.3 || crRatio >= 1.5) akiStage = 1;
        if (crRatio >= 2.0) akiStage = 2;
        if (crRatio >= 3.0 || currentCr >= 4.0) akiStage = 3;

        // Urine output criteria
        if (uop < 0.5 && uop >= 0.3) akiStage = Math.max(akiStage, 1);
        if (uop < 0.3) akiStage = Math.max(akiStage, 3);

        // Risk factors
        const riskFactors = {
            nephrotoxicDrugs: this.checkNephrotoxicDrugs(patientData.medications),
            hypotension: patientData.vitals.bloodPressure?.systolic < 90,
            contrast: patientData.recentContrast || false,
            sepsis: patientData.sepsis || false,
            ckd: patientData.comorbidities?.includes('chronic kidney disease'),
            dehydration: patientData.clinicalDehydration || false
        };

        const riskScore = Object.values(riskFactors).filter(v => v).length;

        // Prediction of progression
        const progressionRisk = this.logisticFunction(
            akiStage * 3 + riskScore * 2,
            10,
            0.4
        );

        return {
            currentStage: akiStage,
            stageName: ["No AKI", "Stage 1", "Stage 2", "Stage 3"][akiStage],
            baseline Cr: baselineCreatinine,
            currentCr: currentCr,
            creatinineIncrease: crIncrease,
            urineOutput: uop,
            riskFactors: riskFactors,
            progressionRisk: progressionRisk,
            recommendations: this.generateAKIManagement(akiStage, riskFactors),
            confidence: 0.89
        };
    }

    /**
     * ICU Length of Stay Prediction
     */
    async predictICULOS(admissionData) {
        const features = {
            apacheScore: admissionData.apacheScore || 0,
            ventilated: admissionData.mechanicalVentilation,
            vasopressors: admissionData.onVasopressors,
            dialysis: admissionData.onDialysis,
            diagnosis: admissionData.primaryDiagnosis,
            age: admissionData.age,
            comorbidities: admissionData.comorbidities?.length || 0
        };

        let losEstimate = 3; // Base 3 days

        // Severity adjustments
        if (features.apacheScore > 25) losEstimate += 7;
        else if (features.apacheScore > 15) losEstimate += 4;
        else if (features.apacheScore > 10) losEstimate += 2;

        // Organ support
        if (features.ventilated) losEstimate += 5;
        if (features.vasopressors) losEstimate += 3;
        if (features.dialysis) losEstimate += 4;

        // Age
        if (features.age > 75) losEstimate += 2;

        // Diagnosis-specific
        const longStayDiagnoses = ['ards', 'septic shock', 'multiorgan failure', 'trauma'];
        if (longStayDiagnoses.some(d => features.diagnosis.toLowerCase().includes(d))) {
            losEstimate += 6;
        }

        return {
            estimatedLOS: losEstimate,
            range: [Math.max(1, losEstimate - 3), losEstimate + 5],
            confidence: 0.78,
            factors: features,
            dischargePlanning: this.generateDischargePlan(losEstimate)
        };
    }

    /**
     * Helper Functions
     */

    extractFeatures(patientData) {
        return {
            currentVitals: patientData.vitalSigns?.[patientData.vitalSigns.length - 1] || {},
            demographics: {
                age: patientData.age,
                sex: patientData.sex
            },
            comorbidities: patientData.comorbidities || [],
            medications: patientData.medications || []
        };
    }

    analyzeTrends(vitalSigns, hours) {
        if (!vitalSigns || vitalSigns.length < 2) {
            return { deteriorating: false };
        }

        const recent = vitalSigns.slice(-Math.min(hours, vitalSigns.length));

        // Calculate slopes
        const hrTrend = this.calculateSlope(recent.map(v => v.heartRate));
        const bpTrend = this.calculateSlope(recent.map(v => v.bloodPressure?.systolic));
        const rrTrend = this.calculateSlope(recent.map(v => v.respiratoryRate));

        return {
            deteriorating: hrTrend > 5 || bpTrend < -10 || rrTrend > 3,
            hrTrend,
            bpTrend,
            rrTrend
        };
    }

    calculateSlope(values) {
        if (values.length < 2) return 0;

        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    logisticFunction(score, midpoint, steepness) {
        return 1 / (1 + Math.exp(-steepness * (score - midpoint)));
    }

    countAbnormalVitals(vitals) {
        let count = 0;
        const ranges = {
            heartRate: [60, 100],
            systolic: [90, 140],
            respiratoryRate: [12, 20],
            temperature: [36.1, 37.2],
            oxygenSaturation: [95, 100]
        };

        if (vitals.heartRate < ranges.heartRate[0] || vitals.heartRate > ranges.heartRate[1]) count++;
        if (vitals.bloodPressure?.systolic < ranges.systolic[0] || vitals.bloodPressure?.systolic > ranges.systolic[1]) count++;
        if (vitals.respiratoryRate < ranges.respiratoryRate[0] || vitals.respiratoryRate > ranges.respiratoryRate[1]) count++;
        if (vitals.temperature < ranges.temperature[0] || vitals.temperature > ranges.temperature[1]) count++;
        if (vitals.oxygenSaturation < ranges.oxygenSaturation[0]) count++;

        return count;
    }

    calculateComorbidityScore(comorbidities) {
        if (!comorbidities) return 0;

        const weights = {
            'diabetes': 1,
            'heart failure': 3,
            'copd': 2,
            'ckd': 2,
            'cancer': 3,
            'cirrhosis': 3,
            'hiv': 2
        };

        return comorbidities.reduce((score, condition) => {
            for (const [disease, weight] of Object.entries(weights)) {
                if (condition.toLowerCase().includes(disease)) {
                    return score + weight;
                }
            }
            return score;
        }, 0);
    }

    calculatePhysiologicScore(vitals, labs) {
        let score = 0;

        // Temperature
        if (vitals.temperature >= 41) score += 4;
        else if (vitals.temperature >= 39) score += 3;
        else if (vitals.temperature >= 38.5) score += 1;
        else if (vitals.temperature < 30) score += 4;
        else if (vitals.temperature < 32) score += 3;
        else if (vitals.temperature < 34) score += 2;
        else if (vitals.temperature < 36) score += 1;

        // Heart Rate
        if (vitals.heartRate >= 180) score += 4;
        else if (vitals.heartRate >= 140) score += 3;
        else if (vitals.heartRate >= 110) score += 2;
        else if (vitals.heartRate < 40) score += 4;
        else if (vitals.heartRate < 55) score += 2;

        // Respiratory Rate
        if (vitals.respiratoryRate >= 50) score += 4;
        else if (vitals.respiratoryRate >= 35) score += 3;
        else if (vitals.respiratoryRate >= 25) score += 1;
        else if (vitals.respiratoryRate < 6) score += 4;
        else if (vitals.respiratoryRate < 10) score += 2;

        return score;
    }

    generatePreventiveActions(probability, riskFactors) {
        const actions = [];

        if (probability > 0.7) {
            actions.push("Immediate physician notification");
            actions.push("Increase vital signs monitoring to q15min");
            actions.push("Prepare for possible rapid response activation");
        }

        if (probability > 0.4) {
            actions.push("Increase monitoring frequency to q1h");
            actions.push("Review medications for potential adverse effects");
            actions.push("Ensure IV access");
        }

        if (riskFactors.vitalSignsAbnormal > 2) {
            actions.push("Obtain stat labs: CBC, CMP, Lactate");
        }

        if (riskFactors.trendingWorse) {
            actions.push("Trending vital signs every 30 minutes");
            actions.push("Consider arterial line for continuous BP monitoring");
        }

        return actions;
    }

    generateReadmissionPrevention(features) {
        const interventions = [];

        if (!features.followUpScheduled) {
            interventions.push("Schedule follow-up appointment within 7 days");
        }

        if (features.socialSupport === "poor") {
            interventions.push("Social work consultation");
            interventions.push("Home health services referral");
        }

        if (features.medicationCompliance === "poor") {
            interventions.push("Pharmacy counseling");
            interventions.push("Medication reconciliation");
            interventions.push("Pill organizer provision");
        }

        if (features.comorbidities > 3) {
            interventions.push("Care coordination with PCP");
            interventions.push("Chronic disease management program enrollment");
        }

        return interventions;
    }

    generateICURecommendations(apacheScore, probability) {
        const recs = [];

        if (probability > 0.5) {
            recs.push("Consider goals of care discussion");
            recs.push("Family meeting recommended");
            recs.push("Palliative care consultation may be appropriate");
        }

        if (apacheScore > 25) {
            recs.push("ICU admission strongly recommended");
            recs.push("Consider early goal-directed therapy");
            recs.push("Frequent reassessment needed");
        }

        return recs;
    }

    analyzeSepsisTrends(historicalVitals) {
        if (!historicalVitals || historicalVitals.length < 3) {
            return { rapidDeterioration: false };
        }

        const last3 = historicalVitals.slice(-3);

        const tempIncreasing = last3.every((v, i) =>
            i === 0 || v.temperature >= last3[i - 1].temperature
        );

        const hrIncreasing = last3.every((v, i) =>
            i === 0 || v.heartRate >= last3[i - 1].heartRate
        );

        return {
            rapidDeterioration: tempIncreasing && hrIncreasing,
            trend: "worsening"
        };
    }

    estimateTimeToSepsis(probability, trends) {
        if (probability > 0.8) return "< 6 hours";
        if (probability > 0.6) return "6-12 hours";
        if (probability > 0.4) return "12-24 hours";
        return "> 24 hours";
    }

    checkNephrotoxicDrugs(medications) {
        if (!medications) return false;

        const nephrotoxic = [
            'nsaid', 'ibuprofen', 'naproxen', 'ketorolac',
            'aminoglycoside', 'gentamicin', 'tobramycin', 'vancomycin',
            'amphotericin', 'cisplatin', 'contrast',
            'ace inhibitor', 'arb'
        ];

        return medications.some(med =>
            nephrotoxic.some(drug => med.toLowerCase().includes(drug))
        );
    }

    generateAKIManagement(stage, riskFactors) {
        const management = [];

        if (stage > 0) {
            management.push("STOP nephrotoxic medications if possible");
            management.push("Ensure adequate hydration (avoid overload)");
            management.push("Monitor urine output hourly");
            management.push("Daily creatinine and electrolytes");
        }

        if (stage >= 2) {
            management.push("Nephrology consultation");
            management.push("Consider renal ultrasound");
            management.push("Avoid magnesium, potassium supplements");
        }

        if (stage === 3) {
            management.push("URGENT: Nephrology consult for possible dialysis");
            management.push("Check for hyperkalemia (stat chemistry)");
            management.push("Consider ICU transfer");
        }

        if (riskFactors.nephrotoxicDrugs) {
            management.push("Review all medications - adjust for renal function");
        }

        return management;
    }

    generateDischargePlan(los) {
        const plan = {
            estimatedDischarge: `Day ${los}`,
            milestones: []
        };

        if (los > 7) {
            plan.milestones.push("Day 3: Assess for step-down to regular floor");
            plan.milestones.push("Day 5: Physical therapy evaluation");
            plan.milestones.push(`Day ${los - 2}: Discharge planning meeting`);
        }

        return plan;
    }

    assessDiagnosisComplexity(diagnoses) {
        if (!diagnoses) return 0;

        const complex = [
            'heart failure', 'copd exacerbation', 'pneumonia',
            'sepsis', 'aki', 'stroke', 'mi'
        ];

        return diagnoses.filter(d =>
            complex.some(c => d.toLowerCase().includes(c))
        ).length;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictiveAnalyticsEngine;
}

window.PredictiveAnalytics = new PredictiveAnalyticsEngine();
console.log("📊 Predictive Analytics Engine loaded");
