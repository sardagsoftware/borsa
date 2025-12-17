/**
 * SPECIALTY CARE MODULES - Premium Excellence
 * 14 Premium Medical Specialty Areas with AI & Quantum Integration
 * World-Class Medical Solutions for Complex Conditions
 *
 * @module SpecialtyCareModules
 * @version 3.0.0 - Premium Edition
 * @security-level CRITICAL
 * @medical-grade WORLD-CLASS
 */

const medicalValidation = require('./medical-validation');
const auditLogger = require('../security/audit-logger');

/**
 * FEATURED CARE AREAS
 * Solving the world's most serious and complex medical problems
 */
const SPECIALTY_AREAS = {
  // 1. Bone Marrow Transplant (Kemik İliği Nakli)
  BONE_MARROW_TRANSPLANT: {
    id: 'bone-marrow-transplant',
    name: {
      en: 'Bone Marrow Transplant',
      tr: 'Kemik İliği Nakli'
    },
    description: {
      en: 'Advanced hematopoietic stem cell transplantation for blood cancers and disorders',
      tr: 'Kan kanserleri ve bozuklukları için gelişmiş hematopoietik kök hücre transplantasyonu'
    },
    aiModels: ['medical-oncology-specialist', 'transplant-immunology', 'genomic-matching'],
    quantumFeatures: ['HLA-matching-optimization', 'graft-vs-host-prediction'],
    criticalityLevel: 'CRITICAL',
    requiredExpertise: ['hematology', 'oncology', 'immunology', 'transplant-surgery']
  },

  // 2. Brain Aneurysm (Beyin Anevrizması)
  BRAIN_ANEURYSM: {
    id: 'brain-aneurysm',
    name: {
      en: 'Brain Aneurysm',
      tr: 'Beyin Anevrizması'
    },
    description: {
      en: 'Emergency neurovascular intervention and endovascular treatment',
      tr: 'Acil nörovasküler müdahale ve endovasküler tedavi'
    },
    aiModels: ['neuro-imaging-ai', 'aneurysm-rupture-predictor', 'surgical-planning-ai'],
    quantumFeatures: ['blood-flow-simulation', 'aneurysm-growth-modeling'],
    criticalityLevel: 'EMERGENCY',
    requiredExpertise: ['neurosurgery', 'neuroradiology', 'interventional-radiology']
  },

  // 3. Brain Tumor (Beyin Tümörü)
  BRAIN_TUMOR: {
    id: 'brain-tumor',
    name: {
      en: 'Brain Tumor',
      tr: 'Beyin Tümörü'
    },
    description: {
      en: 'Precision neuro-oncology with AI-guided surgical planning',
      tr: 'AI destekli cerrahi planlama ile hassas nöro-onkoloji'
    },
    aiModels: ['tumor-classification-ai', 'surgical-margin-detector', 'radiation-planning-ai'],
    quantumFeatures: ['molecular-tumor-profiling', 'treatment-response-prediction'],
    criticalityLevel: 'CRITICAL',
    requiredExpertise: ['neurosurgery', 'neuro-oncology', 'radiation-oncology', 'neuropathology']
  },

  // 4. Breast Cancer (Meme Kanseri)
  BREAST_CANCER: {
    id: 'breast-cancer',
    name: {
      en: 'Breast Cancer',
      tr: 'Meme Kanseri'
    },
    description: {
      en: 'Comprehensive breast cancer care with genomic-guided therapy',
      tr: 'Genomik güdümlü terapi ile kapsamlı meme kanseri bakımı'
    },
    aiModels: ['mammogram-ai-detector', 'tumor-subtype-classifier', 'recurrence-predictor'],
    quantumFeatures: ['genomic-profiling', 'drug-response-simulation', 'metastasis-modeling'],
    criticalityLevel: 'HIGH',
    requiredExpertise: ['breast-surgery', 'medical-oncology', 'radiation-oncology', 'genetics']
  },

  // 5. Colon Cancer (Kolon Kanseri)
  COLON_CANCER: {
    id: 'colon-cancer',
    name: {
      en: 'Colon Cancer',
      tr: 'Kolon Kanseri'
    },
    description: {
      en: 'Advanced colorectal cancer treatment with precision medicine',
      tr: 'Hassas tıp ile gelişmiş kolorektal kanser tedavisi'
    },
    aiModels: ['colonoscopy-ai', 'polyp-detection-ai', 'staging-predictor'],
    quantumFeatures: ['microsatellite-instability-analysis', 'immunotherapy-response-prediction'],
    criticalityLevel: 'HIGH',
    requiredExpertise: ['colorectal-surgery', 'gastroenterology', 'medical-oncology']
  },

  // 6. Congenital Heart Disease (Doğuştan Kalp Hastalığı)
  CONGENITAL_HEART_DISEASE: {
    id: 'congenital-heart-disease',
    name: {
      en: 'Congenital Heart Disease',
      tr: 'Doğuştan Kalp Hastalığı'
    },
    description: {
      en: 'Pediatric and adult congenital heart defect repair',
      tr: 'Pediatrik ve yetişkin doğuştan kalp defekti onarımı'
    },
    aiModels: ['fetal-echocardiography-ai', 'surgical-simulation-ai', 'growth-prediction-ai'],
    quantumFeatures: ['hemodynamic-simulation', 'surgical-outcome-modeling'],
    criticalityLevel: 'CRITICAL',
    requiredExpertise: ['pediatric-cardiology', 'cardiac-surgery', 'cardiothoracic-surgery']
  },

  // 7. Glioma (Glioma)
  GLIOMA: {
    id: 'glioma',
    name: {
      en: 'Glioma',
      tr: 'Glioma'
    },
    description: {
      en: 'Advanced glioblastoma and glioma treatment with immunotherapy',
      tr: 'İmmünoterapi ile gelişmiş glioblastoma ve glioma tedavisi'
    },
    aiModels: ['glioma-grading-ai', 'tumor-border-detection', 'treatment-response-monitor'],
    quantumFeatures: ['molecular-subtyping', 'blood-brain-barrier-simulation', 'drug-delivery-optimization'],
    criticalityLevel: 'CRITICAL',
    requiredExpertise: ['neurosurgery', 'neuro-oncology', 'radiation-oncology', 'molecular-biology']
  },

  // 8. Heart Arrhythmia (Kalp Aritmisi)
  HEART_ARRHYTHMIA: {
    id: 'heart-arrhythmia',
    name: {
      en: 'Heart Arrhythmia',
      tr: 'Kalp Aritmisi'
    },
    description: {
      en: 'Electrophysiology and ablation therapy for cardiac rhythm disorders',
      tr: 'Kardiyak ritim bozuklukları için elektrofizyoloji ve ablasyon terapisi'
    },
    aiModels: ['ecg-arrhythmia-detector', 'ablation-target-identifier', 'rhythm-prediction-ai'],
    quantumFeatures: ['electrical-conduction-modeling', 'ablation-outcome-simulation'],
    criticalityLevel: 'HIGH',
    requiredExpertise: ['electrophysiology', 'cardiology', 'interventional-cardiology']
  },

  // 9. Heart Valve Disease (Kalp Kapakçığı Hastalığı)
  HEART_VALVE_DISEASE: {
    id: 'heart-valve-disease',
    name: {
      en: 'Heart Valve Disease',
      tr: 'Kalp Kapakçığı Hastalığı'
    },
    description: {
      en: 'Minimally invasive valve repair and replacement',
      tr: 'Minimal invaziv kapak onarımı ve değişimi'
    },
    aiModels: ['valve-assessment-ai', 'tavr-planning-ai', 'post-op-monitoring-ai'],
    quantumFeatures: ['hemodynamic-flow-simulation', 'valve-durability-prediction'],
    criticalityLevel: 'HIGH',
    requiredExpertise: ['cardiac-surgery', 'interventional-cardiology', 'echocardiography']
  },

  // 10. Living Donor Organ Transplant (Canlı Vericiden Organ Nakli)
  LIVING_DONOR_TRANSPLANT: {
    id: 'living-donor-transplant',
    name: {
      en: 'Living Donor Organ Transplant',
      tr: 'Canlı Vericiden Organ Nakli'
    },
    description: {
      en: 'Living donor kidney, liver, and pancreas transplantation',
      tr: 'Canlı vericiden böbrek, karaciğer ve pankreas nakli'
    },
    aiModels: ['donor-recipient-matching-ai', 'rejection-risk-predictor', 'surgical-planning-ai'],
    quantumFeatures: ['immunological-compatibility-analysis', 'organ-quality-assessment'],
    criticalityLevel: 'CRITICAL',
    requiredExpertise: ['transplant-surgery', 'nephrology', 'hepatology', 'immunology']
  },

  // 11. Lung Transplant (Akciğer Nakli)
  LUNG_TRANSPLANT: {
    id: 'lung-transplant',
    name: {
      en: 'Lung Transplant',
      tr: 'Akciğer Nakli'
    },
    description: {
      en: 'Advanced lung transplantation for end-stage pulmonary disease',
      tr: 'Son dönem akciğer hastalığı için gelişmiş akciğer nakli'
    },
    aiModels: ['lung-function-predictor', 'rejection-monitor-ai', 'complication-detector'],
    quantumFeatures: ['tissue-compatibility-scoring', 'ischemia-time-optimization'],
    criticalityLevel: 'CRITICAL',
    requiredExpertise: ['thoracic-surgery', 'pulmonology', 'transplant-immunology']
  },

  // 12. Sarcoma (Sarkom)
  SARCOMA: {
    id: 'sarcoma',
    name: {
      en: 'Sarcoma',
      tr: 'Sarkom'
    },
    description: {
      en: 'Rare bone and soft tissue tumor treatment',
      tr: 'Nadir kemik ve yumuşak doku tümörü tedavisi'
    },
    aiModels: ['sarcoma-subtype-classifier', 'surgical-margin-planner', 'chemotherapy-response-predictor'],
    quantumFeatures: ['molecular-profiling', 'drug-sensitivity-testing', 'metastasis-prediction'],
    criticalityLevel: 'HIGH',
    requiredExpertise: ['orthopedic-oncology', 'surgical-oncology', 'medical-oncology', 'pathology']
  },

  // 13. Testicular Cancer (Testis Kanseri)
  TESTICULAR_CANCER: {
    id: 'testicular-cancer',
    name: {
      en: 'Testicular Cancer',
      tr: 'Testis Kanseri'
    },
    description: {
      en: 'High cure rate treatment for testicular germ cell tumors',
      tr: 'Testis germ hücreli tümörleri için yüksek iyileşme oranlı tedavi'
    },
    aiModels: ['tumor-marker-analyzer', 'staging-predictor', 'fertility-preservation-planner'],
    quantumFeatures: ['chemotherapy-response-modeling', 'relapse-risk-calculation'],
    criticalityLevel: 'HIGH',
    requiredExpertise: ['urologic-oncology', 'medical-oncology', 'radiation-oncology']
  },

  // 14. Advanced Genomic Medicine (Gelişmiş Genomik Tıp)
  GENOMIC_MEDICINE: {
    id: 'genomic-medicine',
    name: {
      en: 'Advanced Genomic Medicine',
      tr: 'Gelişmiş Genomik Tıp'
    },
    description: {
      en: 'Precision medicine based on genetic profiling',
      tr: 'Genetik profillemeye dayalı hassas tıp'
    },
    aiModels: ['variant-interpretation-ai', 'pharmacogenomics-advisor', 'disease-risk-calculator'],
    quantumFeatures: ['whole-genome-analysis', 'protein-folding-prediction', 'drug-target-discovery'],
    criticalityLevel: 'ADVANCED',
    requiredExpertise: ['medical-genetics', 'genomic-counseling', 'bioinformatics']
  }
};

class SpecialtyCareEngine {
  constructor() {
    this.specialties = SPECIALTY_AREAS;
    this.activeConsultations = new Map();
    this.quantumProcessors = new Map();
  }

  /**
   * Get specialty by ID
   */
  getSpecialty(specialtyId) {
    return this.specialties[specialtyId] || this.specialties[
      Object.keys(this.specialties).find(
        key => this.specialties[key].id === specialtyId
      )
    ];
  }

  /**
   * Analyze patient case for specialty recommendation
   */
  async analyzePatientCase(patientData, symptoms, medicalHistory) {
    const analysis = {
      recommendedSpecialties: [],
      urgencyLevel: 'routine',
      requiredTests: [],
      initialAssessment: '',
      quantumAnalysisNeeded: false
    };

    // Emergency keyword detection
    const emergencyKeywords = [
      'aneurysm', 'rupture', 'severe pain', 'unconscious', 'seizure',
      'chest pain', 'difficulty breathing', 'stroke', 'heart attack'
    ];

    const symptomsLower = symptoms.toLowerCase();
    const hasEmergency = emergencyKeywords.some(keyword => symptomsLower.includes(keyword));

    if (hasEmergency) {
      analysis.urgencyLevel = 'EMERGENCY';
    }

    // Specialty matching logic
    if (symptomsLower.includes('brain') || symptomsLower.includes('head') || symptomsLower.includes('neurological')) {
      if (symptomsLower.includes('aneurysm')) {
        analysis.recommendedSpecialties.push(this.specialties.BRAIN_ANEURYSM);
      } else if (symptomsLower.includes('tumor')) {
        analysis.recommendedSpecialties.push(this.specialties.BRAIN_TUMOR);
      } else if (symptomsLower.includes('glioma') || symptomsLower.includes('glioblastoma')) {
        analysis.recommendedSpecialties.push(this.specialties.GLIOMA);
      }
    }

    if (symptomsLower.includes('heart') || symptomsLower.includes('cardiac') || symptomsLower.includes('chest pain')) {
      if (symptomsLower.includes('arrhythmia') || symptomsLower.includes('irregular heartbeat')) {
        analysis.recommendedSpecialties.push(this.specialties.HEART_ARRHYTHMIA);
      } else if (symptomsLower.includes('valve')) {
        analysis.recommendedSpecialties.push(this.specialties.HEART_VALVE_DISEASE);
      } else if (symptomsLower.includes('congenital') || symptomsLower.includes('birth defect')) {
        analysis.recommendedSpecialties.push(this.specialties.CONGENITAL_HEART_DISEASE);
      }
    }

    if (symptomsLower.includes('cancer') || symptomsLower.includes('tumor') || symptomsLower.includes('oncology')) {
      if (symptomsLower.includes('breast')) {
        analysis.recommendedSpecialties.push(this.specialties.BREAST_CANCER);
      } else if (symptomsLower.includes('colon') || symptomsLower.includes('colorectal')) {
        analysis.recommendedSpecialties.push(this.specialties.COLON_CANCER);
      } else if (symptomsLower.includes('sarcoma') || symptomsLower.includes('bone')) {
        analysis.recommendedSpecialties.push(this.specialties.SARCOMA);
      } else if (symptomsLower.includes('testicular') || symptomsLower.includes('testis')) {
        analysis.recommendedSpecialties.push(this.specialties.TESTICULAR_CANCER);
      }
    }

    if (symptomsLower.includes('transplant') || symptomsLower.includes('organ failure')) {
      if (symptomsLower.includes('bone marrow') || symptomsLower.includes('stem cell')) {
        analysis.recommendedSpecialties.push(this.specialties.BONE_MARROW_TRANSPLANT);
      } else if (symptomsLower.includes('lung')) {
        analysis.recommendedSpecialties.push(this.specialties.LUNG_TRANSPLANT);
      } else if (symptomsLower.includes('kidney') || symptomsLower.includes('liver')) {
        analysis.recommendedSpecialties.push(this.specialties.LIVING_DONOR_TRANSPLANT);
      }
    }

    // Genomic medicine recommendation
    if (symptomsLower.includes('genetic') || symptomsLower.includes('hereditary') || symptomsLower.includes('family history')) {
      analysis.recommendedSpecialties.push(this.specialties.GENOMIC_MEDICINE);
      analysis.quantumAnalysisNeeded = true;
    }

    // If no specific specialty matched, recommend general assessment
    if (analysis.recommendedSpecialties.length === 0) {
      analysis.initialAssessment = 'Comprehensive medical evaluation recommended. Multiple specialties may be involved.';
    } else {
      const specialtyNames = analysis.recommendedSpecialties
        .map(s => s.name.en)
        .join(', ');
      analysis.initialAssessment = `Recommended specialties: ${specialtyNames}`;
    }

    return analysis;
  }

  /**
   * Get AI models for specialty
   */
  getAIModelsForSpecialty(specialtyId) {
    const specialty = this.getSpecialty(specialtyId);
    if (!specialty) return [];

    return specialty.aiModels.map(modelName => ({
      name: modelName,
      type: this.determineModelType(modelName),
      provider: this.determineProvider(modelName)
    }));
  }

  /**
   * Determine model type
   */
  determineModelType(modelName) {
    if (modelName.includes('imaging') || modelName.includes('detection')) {
      return 'computer-vision';
    } else if (modelName.includes('predictor') || modelName.includes('classifier')) {
      return 'predictive-analytics';
    } else if (modelName.includes('planning') || modelName.includes('simulation')) {
      return 'surgical-planning';
    } else {
      return 'clinical-decision-support';
    }
  }

  /**
   * Determine AI provider
   */
  determineProvider(modelName) {
    // Route to appropriate AI provider based on task
    if (modelName.includes('imaging') || modelName.includes('detection')) {
      return 'azure-computer-vision';
    } else if (modelName.includes('genomic') || modelName.includes('molecular')) {
      return 'anthropic-claude'; // Best for complex reasoning
    } else if (modelName.includes('predictor') || modelName.includes('risk')) {
      return 'azure-openai'; // Primary provider
    } else {
      return 'groq'; // Fast inference
    }
  }

  /**
   * Get quantum features for specialty
   */
  getQuantumFeaturesForSpecialty(specialtyId) {
    const specialty = this.getSpecialty(specialtyId);
    if (!specialty) return [];

    return specialty.quantumFeatures.map(featureName => ({
      name: featureName,
      description: this.getQuantumFeatureDescription(featureName),
      computationalComplexity: this.getQuantumComplexity(featureName)
    }));
  }

  /**
   * Get quantum feature description
   */
  getQuantumFeatureDescription(featureName) {
    const descriptions = {
      'HLA-matching-optimization': 'Quantum optimization of HLA compatibility for transplant matching',
      'graft-vs-host-prediction': 'Quantum simulation of graft-versus-host disease risk',
      'blood-flow-simulation': 'Quantum fluid dynamics for cerebral blood flow',
      'aneurysm-growth-modeling': 'Quantum molecular dynamics for aneurysm wall stress',
      'molecular-tumor-profiling': 'Quantum chemistry for tumor molecular characterization',
      'treatment-response-prediction': 'Quantum machine learning for treatment outcomes',
      'genomic-profiling': 'Quantum genomic analysis for precision medicine',
      'drug-response-simulation': 'Quantum pharmacology simulations',
      'metastasis-modeling': 'Quantum cellular dynamics for metastatic spread',
      'microsatellite-instability-analysis': 'Quantum DNA sequence analysis',
      'immunotherapy-response-prediction': 'Quantum immune system modeling',
      'hemodynamic-simulation': 'Quantum computational fluid dynamics',
      'surgical-outcome-modeling': 'Quantum predictive modeling for surgical success',
      'molecular-subtyping': 'Quantum molecular classification',
      'blood-brain-barrier-simulation': 'Quantum drug delivery modeling',
      'drug-delivery-optimization': 'Quantum pharmacokinetics optimization',
      'electrical-conduction-modeling': 'Quantum electrophysiology simulation',
      'ablation-outcome-simulation': 'Quantum tissue response modeling',
      'hemodynamic-flow-simulation': 'Quantum cardiac hemodynamics',
      'valve-durability-prediction': 'Quantum materials science for prosthetic valves',
      'immunological-compatibility-analysis': 'Quantum immunology for rejection prediction',
      'organ-quality-assessment': 'Quantum tissue viability assessment',
      'tissue-compatibility-scoring': 'Quantum histocompatibility analysis',
      'ischemia-time-optimization': 'Quantum time-dependent tissue degradation modeling',
      'drug-sensitivity-testing': 'Quantum drug-target interaction modeling',
      'metastasis-prediction': 'Quantum cancer cell migration modeling',
      'chemotherapy-response-modeling': 'Quantum pharmacodynamics simulation',
      'relapse-risk-calculation': 'Quantum disease recurrence prediction',
      'whole-genome-analysis': 'Quantum genomics for variant interpretation',
      'protein-folding-prediction': 'Quantum protein structure prediction',
      'drug-target-discovery': 'Quantum drug discovery and design'
    };

    return descriptions[featureName] || `Advanced quantum computation for ${featureName}`;
  }

  /**
   * Get quantum computational complexity
   */
  getQuantumComplexity(featureName) {
    if (featureName.includes('whole-genome') || featureName.includes('protein-folding')) {
      return 'VERY_HIGH'; // 50+ qubits required
    } else if (featureName.includes('simulation') || featureName.includes('modeling')) {
      return 'HIGH'; // 30-50 qubits
    } else if (featureName.includes('prediction') || featureName.includes('analysis')) {
      return 'MEDIUM'; // 20-30 qubits
    } else {
      return 'LOW'; // <20 qubits
    }
  }

  /**
   * Get all specialties
   */
  getAllSpecialties() {
    return Object.values(this.specialties);
  }

  /**
   * Get specialties by criticality
   */
  getSpecialtiesByCriticality(level) {
    return Object.values(this.specialties).filter(
      specialty => specialty.criticalityLevel === level
    );
  }
}

// Singleton instance
const specialtyCareEngine = new SpecialtyCareEngine();

module.exports = specialtyCareEngine;
module.exports.SPECIALTY_AREAS = SPECIALTY_AREAS;
module.exports.SpecialtyCareEngine = SpecialtyCareEngine;
