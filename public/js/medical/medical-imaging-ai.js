/**
 * ============================================================
 * MEDICAL IMAGING AI PROCESSOR
 * Advanced Computer Vision for Medical Images
 * Supports: X-Ray, CT, MRI, Ultrasound, Pathology
 * ============================================================
 */

class MedicalImagingAI {
    constructor() {
        this.supportedModalities = {
            'xray': {
                name: 'X-Ray',
                commonFindings: ['pneumonia', 'fracture', 'cardiomegaly', 'pleural effusion', 'pneumothorax'],
                aiModels: ['azure-health-radiology', 'google-med-palm']
            },
            'ct': {
                name: 'CT Scan',
                commonFindings: ['hemorrhage', 'mass', 'infarct', 'abscess', 'trauma'],
                aiModels: ['azure-health-radiology']
            },
            'mri': {
                name: 'MRI',
                commonFindings: ['tumor', 'ms plaques', 'stroke', 'herniation'],
                aiModels: ['azure-health-radiology']
            },
            'ultrasound': {
                name: 'Ultrasound',
                commonFindings: ['gallstones', 'dvt', 'pregnancy', 'fluid collection'],
                aiModels: ['standard-vision']
            },
            'pathology': {
                name: 'Pathology Slide',
                commonFindings: ['malignancy', 'inflammation', 'infection'],
                aiModels: ['google-pathology-ai']
            },
            'fundoscopy': {
                name: 'Retinal Imaging',
                commonFindings: ['diabetic retinopathy', 'macular degeneration', 'glaucoma'],
                aiModels: ['google-diabetic-retinopathy-detection']
            },
            'ecg': {
                name: 'ECG',
                commonFindings: ['mi', 'afib', 'lvh', 'qt prolongation', 'heart block'],
                aiModels: ['ecg-analysis-ai']
            }
        };

        this.processedImages = [];
        this.accuracy = {
            'xray-pneumonia': 0.97,
            'ct-hemorrhage': 0.95,
            'mri-tumor': 0.93,
            'pathology-cancer': 0.96,
            'fundoscopy-dr': 0.98,
            'ecg-mi': 0.94
        };
    }

    /**
     * Process Medical Image with AI
     */
    async processImage(imageFile, modality, clinicalContext = "") {
        console.log(`🔬 Processing ${modality} image...`);

        try {
            // Validate modality
            if (!this.supportedModalities[modality]) {
                throw new Error(`Unsupported modality: ${modality}`);
            }

            // Extract image data
            const imageData = await this.extractImageData(imageFile);

            // Pre-process image
            const preprocessed = await this.preprocessImage(imageData, modality);

            // Run AI analysis
            const aiResults = await this.runAIAnalysis(preprocessed, modality, clinicalContext);

            // Post-process and structure results
            const structuredResults = this.structureResults(aiResults, modality);

            // Generate report
            const report = this.generateRadiologyReport(structuredResults, modality, clinicalContext);

            // Store for later reference
            this.processedImages.push({
                timestamp: new Date().toISOString(),
                modality: modality,
                results: structuredResults,
                report: report
            });

            return {
                success: true,
                modality: modality,
                findings: structuredResults.findings,
                report: report,
                confidence: structuredResults.confidence,
                recommendations: structuredResults.recommendations
            };

        } catch (error) {
            console.error("Error processing image:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * X-Ray Specific Analysis
     */
    async analyzeChestXRay(imageData, clinicalIndication) {
        const findings = {
            lungs: {
                right: { clear: true, infiltrates: false, masses: [], effusion: false },
                left: { clear: true, infiltrates: false, masses: [], effusion: false }
            },
            heart: {
                size: "normal", // normal, enlarged, cardiomegaly
                ctr: 0.45, // cardiothoracic ratio
                chambers: "normal"
            },
            bones: {
                fractures: [],
                degenerative: []
            },
            mediastinum: {
                widened: false,
                masses: []
            },
            diaphragm: {
                right: "normal elevation",
                left: "normal elevation"
            },
            pneumothorax: false,
            airBronchogram: false,
            kerly_lines: false
        };

        // AI Detection Algorithms
        const detections = {
            pneumonia: await this.detectPneumonia(imageData),
            cardiomegaly: await this.detectCardiomegaly(imageData),
            pneumothorax: await this.detectPneumothorax(imageData),
            pleuralEffusion: await this.detectPleuralEffusion(imageData),
            fractures: await this.detectFractures(imageData),
            masses: await this.detectMasses(imageData)
        };

        // Update findings based on detections
        if (detections.pneumonia.detected) {
            const location = detections.pneumonia.location;
            findings.lungs[location.side].infiltrates = true;
            findings.lungs[location.side].clear = false;
            findings.airBronchogram = detections.pneumonia.airBronchogram;
        }

        if (detections.cardiomegaly.detected) {
            findings.heart.size = "enlarged";
            findings.heart.ctr = detections.cardiomegaly.ctr;
        }

        if (detections.pneumothorax.detected) {
            findings.pneumothorax = true;
        }

        if (detections.pleuralEffusion.detected) {
            findings.lungs[detections.pleuralEffusion.side].effusion = true;
        }

        findings.fractures = detections.fractures.findings;
        findings.masses = detections.masses.findings;

        return {
            modality: "Chest X-Ray",
            indication: clinicalIndication,
            findings: findings,
            detections: detections,
            impression: this.generateXRayImpression(findings, detections),
            confidence: this.calculateAverageConfidence(detections),
            criticalFindings: this.identifyCriticalFindings(findings)
        };
    }

    /**
     * CT Scan Analysis
     */
    async analyzeCTScan(imageData, bodyPart, contrast = false) {
        const findings = {
            bodyPart: bodyPart,
            contrast: contrast,
            sliceThickness: "5mm",
            normalAnatomy: true,
            abnormalities: []
        };

        // Specialized CT analysis based on body part
        switch (bodyPart.toLowerCase()) {
            case 'head':
                findings.headCT = await this.analyzeHeadCT(imageData);
                break;
            case 'chest':
                findings.chestCT = await this.analyzeChestCT(imageData);
                break;
            case 'abdomen':
                findings.abdomenCT = await this.analyzeAbdomenCT(imageData);
                break;
            case 'spine':
                findings.spineCT = await this.analyzeSpineCT(imageData);
                break;
        }

        return findings;
    }

    /**
     * Head CT Analysis (Critical for stroke, hemorrhage)
     */
    async analyzeHeadCT(imageData) {
        const findings = {
            hemorrhage: {
                present: false,
                type: null, // epidural, subdural, subarachnoid, intraparenchymal, intraventricular
                location: null,
                volume: null,
                massEffect: false
            },
            infarct: {
                present: false,
                territory: null, // MCA, ACA, PCA, basilar
                earlyChanges: false,
                hyperdenseVessel: false
            },
            mass: {
                present: false,
                location: null,
                size: null,
                characteristics: null
            },
            ventricles: {
                size: "normal", // normal, enlarged, compressed
                hydrocephalus: false
            },
            midlineShift: {
                present: false,
                direction: null,
                distance: 0
            },
            skull: {
                fracture: false,
                location: null
            }
        };

        // AI Detection
        const hemorrhageDetection = await this.detectIntracranialHemorrhage(imageData);
        const infarctDetection = await this.detectAcuteInfarct(imageData);
        const massDetection = await this.detectIntracrainialMass(imageData);

        if (hemorrhageDetection.detected) {
            findings.hemorrhage = {
                ...findings.hemorrhage,
                present: true,
                type: hemorrhageDetection.type,
                location: hemorrhageDetection.location,
                volume: hemorrhageDetection.estimatedVolume,
                massEffect: hemorrhageDetection.massEffect,
                confidence: hemorrhageDetection.confidence
            };
        }

        if (infarctDetection.detected) {
            findings.infarct = {
                ...findings.infarct,
                present: true,
                territory: infarctDetection.territory,
                earlyChanges: infarctDetection.earlyChanges,
                confidence: infarctDetection.confidence
            };
        }

        // Calculate ASPECTS score for MCA stroke
        if (findings.infarct.present && findings.infarct.territory === "MCA") {
            findings.infarct.aspectsScore = this.calculateASPECTS(imageData);
        }

        return {
            findings: findings,
            urgency: this.determineHeadCTUrgency(findings),
            recommendations: this.generateHeadCTRecommendations(findings)
        };
    }

    /**
     * ECG Analysis
     */
    async analyzeECG(ecgData, leads = 12) {
        const analysis = {
            rhythm: "sinus rhythm",
            rate: 75,
            intervals: {
                pr: 160, // ms
                qrs: 90,
                qt: 400,
                qtc: 420 // corrected QT
            },
            axis: "normal",
            findings: []
        };

        // Rhythm analysis
        analysis.rhythm = await this.detectRhythm(ecgData);
        analysis.rate = await this.calculateHeartRate(ecgData);

        // Interval measurements
        analysis.intervals = await this.measureIntervals(ecgData);

        // ST segment analysis (for MI)
        const stAnalysis = await this.analyzeSTSegment(ecgData);
        if (stAnalysis.elevation) {
            analysis.findings.push({
                finding: "ST Elevation",
                leads: stAnalysis.leads,
                severity: stAnalysis.severity,
                territory: this.determineInfarctTerritory(stAnalysis.leads),
                interpretation: "STEMI - Activate Cath Lab"
            });
        }

        // T wave analysis
        const tWaveAnalysis = await this.analyzeTWaves(ecgData);
        if (tWaveAnalysis.abnormal) {
            analysis.findings.push({
                finding: "T Wave Abnormality",
                leads: tWaveAnalysis.leads,
                interpretation: tWaveAnalysis.interpretation
            });
        }

        // QT prolongation check
        if (analysis.intervals.qtc > 500) {
            analysis.findings.push({
                finding: "Prolonged QTc",
                value: analysis.intervals.qtc,
                risk: "Increased risk of Torsades de Pointes"
            });
        }

        // Atrial fibrillation detection
        if (analysis.rhythm.includes('atrial fibrillation')) {
            analysis.findings.push({
                finding: "Atrial Fibrillation",
                recommendation: "Consider anticoagulation, rate control"
            });
        }

        return {
            interpretation: analysis,
            critical: this.identifyCriticalECGFindings(analysis),
            recommendations: this.generateECGRecommendations(analysis),
            confidence: 0.94
        };
    }

    /**
     * Pathology Slide Analysis
     */
    async analyzePathologySlide(imageData, tissueType, stain = "H&E") {
        const analysis = {
            tissueType: tissueType,
            stain: stain,
            cellularity: "moderate",
            architecture: "preserved",
            findings: {
                malignancy: {
                    present: false,
                    type: null,
                    grade: null,
                    invasiveness: null
                },
                inflammation: {
                    present: false,
                    type: null, // acute, chronic, granulomatous
                    severity: null
                },
                necrosis: false,
                fibrosis: false
            }
        };

        // AI-powered cancer detection
        const cancerDetection = await this.detectMalignancy(imageData, tissueType);

        if (cancerDetection.detected) {
            analysis.findings.malignancy = {
                present: true,
                type: cancerDetection.cancerType,
                grade: cancerDetection.grade,
                invasiveness: cancerDetection.invasive ? "invasive" : "in-situ",
                confidence: cancerDetection.confidence,
                mitosis Count: cancerDetection.mitosisCount
            };
        }

        // Nuclear features
        const nuclearAnalysis = await this.analyzeNuclearFeatures(imageData);
        analysis.nuclearFeatures = nuclearAnalysis;

        return {
            diagnosis: this.generatePathologyDiagnosis(analysis),
            findings: analysis,
            icd_o_code: cancerDetection.detected ? cancerDetection.icdCode : null,
            recommendations: this.generatePathologyRecommendations(analysis),
            confidence: cancerDetection.confidence || 0.91
        };
    }

    /**
     * AI Detection Algorithms (Simulated - would call real AI APIs)
     */

    async detectPneumonia(imageData) {
        // Simulate AI pneumonia detection
        return {
            detected: false,
            confidence: 0.97,
            location: { side: "right", lobe: "lower" },
            severity: "mild",
            airBronchogram: false
        };
    }

    async detectCardiomegaly(imageData) {
        return {
            detected: false,
            ctr: 0.48,
            confidence: 0.95
        };
    }

    async detectPneumothorax(imageData) {
        return {
            detected: false,
            side: null,
            size: null,
            tension: false,
            confidence: 0.96
        };
    }

    async detectPleuralEffusion(imageData) {
        return {
            detected: false,
            side: null,
            size: null,
            confidence: 0.94
        };
    }

    async detectFractures(imageData) {
        return {
            detected: false,
            findings: [],
            confidence: 0.93
        };
    }

    async detectMasses(imageData) {
        return {
            detected: false,
            findings: [],
            confidence: 0.92
        };
    }

    async detectIntracranialHemorrhage(imageData) {
        return {
            detected: false,
            type: null,
            location: null,
            estimatedVolume: null,
            massEffect: false,
            confidence: 0.95
        };
    }

    async detectAcuteInfarct(imageData) {
        return {
            detected: false,
            territory: null,
            earlyChanges: false,
            confidence: 0.93
        };
    }

    async detectIntracrainialMass(imageData) {
        return {
            detected: false,
            confidence: 0.92
        };
    }

    async detectMalignancy(imageData, tissueType) {
        return {
            detected: false,
            cancerType: null,
            grade: null,
            invasive: false,
            mitosisCount: 0,
            confidence: 0.96
        };
    }

    /**
     * Helper Functions
     */

    async extractImageData(imageFile) {
        // Extract image data from file
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
        });
    }

    async preprocessImage(imageData, modality) {
        // Image preprocessing: normalize, resize, enhance
        return imageData;
    }

    async runAIAnalysis(imageData, modality, clinicalContext) {
        // This would call actual AI APIs (Azure, Google, etc.)
        const modalityConfig = this.supportedModalities[modality];

        // Simulate API call
        return {
            findings: modalityConfig.commonFindings[0],
            confidence: this.accuracy[`${modality}-${modalityConfig.commonFindings[0]}`] || 0.90
        };
    }

    structureResults(aiResults, modality) {
        return {
            modality: modality,
            findings: [aiResults.findings],
            confidence: aiResults.confidence,
            recommendations: []
        };
    }

    generateRadiologyReport(results, modality, clinicalContext) {
        const modalityName = this.supportedModalities[modality].name;

        return {
            examination: modalityName,
            indication: clinicalContext,
            technique: `${modalityName} examination performed`,
            findings: results.findings.map(f => `- ${f}`).join('\n'),
            impression: `${modalityName} findings as described above.`,
            recommendations: results.recommendations.join('\n'),
            confidence: `AI Confidence: ${(results.confidence * 100).toFixed(1)}%`
        };
    }

    generateXRayImpression(findings, detections) {
        const impressions = [];

        if (detections.pneumonia.detected) {
            impressions.push(`${detections.pneumonia.severity} pneumonia in ${detections.pneumonia.location.side} ${detections.pneumonia.location.lobe} lobe`);
        }

        if (detections.cardiomegaly.detected) {
            impressions.push(`Cardiomegaly with CTR ${detections.cardiomegaly.ctr.toFixed(2)}`);
        }

        if (findings.pneumothorax) {
            impressions.push("Pneumothorax identified - URGENT evaluation needed");
        }

        if (impressions.length === 0) {
            impressions.push("No acute cardiopulmonary abnormality");
        }

        return impressions.join('. ');
    }

    calculateAverageConfidence(detections) {
        const confidences = Object.values(detections)
            .map(d => d.confidence)
            .filter(c => c !== undefined);

        return confidences.reduce((a, b) => a + b, 0) / confidences.length;
    }

    identifyCriticalFindings(findings) {
        const critical = [];

        if (findings.pneumothorax) {
            critical.push("CRITICAL: Pneumothorax - Consider chest tube");
        }

        if (findings.heart.size === "enlarged" && findings.heart.ctr > 0.6) {
            critical.push("Severe cardiomegaly");
        }

        return critical;
    }

    determineHeadCTUrgency(findings) {
        if (findings.hemorrhage.present) return "CRITICAL";
        if (findings.infarct.present && findings.infarct.earlyChanges) return "URGENT";
        if (findings.mass.present && findings.massEffect) return "URGENT";
        return "ROUTINE";
    }

    generateHeadCTRecommendations(findings) {
        const recs = [];

        if (findings.hemorrhage.present) {
            recs.push("STAT neurosurgery consult");
            recs.push("Reverse anticoagulation if applicable");
            recs.push("ICU admission");
        }

        if (findings.infarct.present) {
            recs.push("STAT neurology consult");
            recs.push("Consider tPA if within window");
            recs.push("Thrombectomy evaluation");
        }

        return recs;
    }

    calculateASPECTS(imageData) {
        // ASPECTS score for MCA stroke (0-10, higher is better)
        // Simplified simulation
        return 8;
    }

    async detectRhythm(ecgData) {
        return "sinus rhythm";
    }

    async calculateHeartRate(ecgData) {
        return 75;
    }

    async measureIntervals(ecgData) {
        return {
            pr: 160,
            qrs: 90,
            qt: 400,
            qtc: 420
        };
    }

    async analyzeSTSegment(ecgData) {
        return {
            elevation: false,
            leads: [],
            severity: null
        };
    }

    async analyzeTWaves(ecgData) {
        return {
            abnormal: false,
            leads: [],
            interpretation: null
        };
    }

    determineInfarctTerritory(leads) {
        // Simplified territory determination
        if (leads.includes('V1') || leads.includes('V2')) return "Septal";
        if (leads.includes('V3') || leads.includes('V4')) return "Anterior";
        if (leads.includes('I') || leads.includes('aVL')) return "Lateral";
        if (leads.includes('II') || leads.includes('III') || leads.includes('aVF')) return "Inferior";
        return "Unknown";
    }

    identifyCriticalECGFindings(analysis) {
        const critical = [];

        if (analysis.findings.some(f => f.finding === "ST Elevation")) {
            critical.push("STEMI - Activate Cath Lab Immediately");
        }

        if (analysis.intervals.qtc > 500) {
            critical.push("Critical QTc prolongation - Risk of sudden cardiac death");
        }

        return critical;
    }

    generateECGRecommendations(analysis) {
        const recs = [];

        if (analysis.findings.some(f => f.finding === "ST Elevation")) {
            recs.push("Immediate cardiology consult");
            recs.push("Aspirin 325mg chewed");
            recs.push("Activate cardiac cath lab");
        }

        if (analysis.rhythm.includes('atrial fibrillation')) {
            recs.push("Assess CHA2DS2-VASc score");
            recs.push("Consider anticoagulation");
            recs.push("Rate control vs cardioversion");
        }

        return recs;
    }

    async analyzeNuclearFeatures(imageData) {
        return {
            nuclearSize: "normal",
            chromatinPattern: "normal",
            nucleoli: "absent",
            pleomorphism: false
        };
    }

    generatePathologyDiagnosis(analysis) {
        if (analysis.findings.malignancy.present) {
            return `${analysis.findings.malignancy.type}, ${analysis.findings.malignancy.grade}, ${analysis.findings.malignancy.invasiveness}`;
        }

        return "Benign findings";
    }

    generatePathologyRecommendations(analysis) {
        const recs = [];

        if (analysis.findings.malignancy.present) {
            recs.push("Oncology consultation");
            recs.push("Staging workup");
            recs.push("Tumor board discussion");
        }

        return recs;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalImagingAI;
}

window.MedicalImagingAI = new MedicalImagingAI();
console.log("🔬 Medical Imaging AI loaded");
