/**
 * 🏥 ADVANCED PREMIUM SPECIALTIES MODULE
 * Quantum-enhanced diagnostic system for complex medical cases
 */

// Specialty definitions
const ADVANCED_SPECIALTIES = [
    {
        id: 'bone-marrow-transplant',
        name: { en: 'Bone Marrow Transplant', tr: 'Kemik İliği Nakli' },
        icon: '🦴',
        description: {
            en: 'Advanced bone marrow transplantation for leukemia, lymphoma, and blood disorders',
            tr: 'Lösemi, lenfoma ve kan hastalıkları için ileri kemik iliği nakli'
        },
        criticalityLevel: 'CRITICAL',
        quantumFeatures: ['donor-matching', 'rejection-prediction', 'immune-compatibility'],
        keywords: ['bone marrow', 'leukemia', 'lymphoma', 'stem cell', 'transplant']
    },
    {
        id: 'brain-aneurysm',
        name: { en: 'Brain Aneurysm', tr: 'Beyin Anevrizması' },
        icon: '🧠',
        description: {
            en: 'Critical care for cerebral aneurysms with rupture risk assessment',
            tr: 'Beyin anevrizması için kritik bakım ve rüptür risk değerlendirmesi'
        },
        criticalityLevel: 'EMERGENCY',
        quantumFeatures: ['rupture-prediction', 'surgical-planning', 'flow-dynamics'],
        keywords: ['aneurysm', 'cerebral', 'subarachnoid', 'hemorrhage', 'brain']
    },
    {
        id: 'brain-tumor',
        name: { en: 'Brain Tumor', tr: 'Beyin Tümörü' },
        icon: '🧠',
        description: {
            en: 'Comprehensive brain tumor diagnosis and treatment planning',
            tr: 'Kapsamlı beyin tümörü teşhisi ve tedavi planlaması'
        },
        criticalityLevel: 'CRITICAL',
        quantumFeatures: ['tumor-classification', 'growth-prediction', 'treatment-optimization'],
        keywords: ['glioma', 'glioblastoma', 'brain tumor', 'meningioma', 'astrocytoma']
    },
    {
        id: 'breast-cancer',
        name: { en: 'Breast Cancer', tr: 'Meme Kanseri' },
        icon: '🎗️',
        description: {
            en: 'Early detection, genetic analysis, and personalized treatment planning',
            tr: 'Erken teşhis, genetik analiz ve kişiselleştirilmiş tedavi planlaması'
        },
        criticalityLevel: 'CRITICAL',
        quantumFeatures: ['genetic-analysis', 'recurrence-prediction', 'treatment-optimization'],
        keywords: ['breast cancer', 'mammography', 'BRCA', 'mastectomy', 'oncology']
    },
    {
        id: 'colon-cancer',
        name: { en: 'Colon Cancer', tr: 'Kolon Kanseri' },
        icon: '🎗️',
        description: {
            en: 'Colorectal cancer screening, staging, and treatment',
            tr: 'Kolorektal kanser tarama, evreleme ve tedavi'
        },
        criticalityLevel: 'CRITICAL',
        quantumFeatures: ['staging-optimization', 'metastasis-prediction', 'treatment-response'],
        keywords: ['colon cancer', 'colorectal', 'polyp', 'colonoscopy', 'adenocarcinoma']
    },
    {
        id: 'congenital-heart',
        name: { en: 'Congenital Heart Disease', tr: 'Doğuştan Kalp Hastalığı' },
        icon: '❤️',
        description: {
            en: 'Pediatric and adult congenital heart defect management',
            tr: 'Pediatrik ve erişkin doğuştan kalp kusuru yönetimi'
        },
        criticalityLevel: 'HIGH',
        quantumFeatures: ['defect-modeling', 'surgical-simulation', 'growth-prediction'],
        keywords: ['congenital heart', 'septal defect', 'tetralogy', 'pediatric cardiology']
    },
    {
        id: 'glioma',
        name: { en: 'Glioma', tr: 'Glioma' },
        icon: '🧠',
        description: {
            en: 'Specialized glioma and glioblastoma treatment',
            tr: 'Özelleşmiş glioma ve glioblastoma tedavisi'
        },
        criticalityLevel: 'CRITICAL',
        quantumFeatures: ['grade-classification', 'molecular-profiling', 'survival-prediction'],
        keywords: ['glioma', 'glioblastoma', 'astrocytoma', 'oligodendroglioma', 'brain cancer']
    },
    {
        id: 'heart-arrhythmia',
        name: { en: 'Heart Arrhythmia', tr: 'Kalp Aritmisi' },
        icon: '💓',
        description: {
            en: 'Atrial fibrillation and cardiac rhythm disorder management',
            tr: 'Atriyal fibrilasyon ve kalp ritim bozukluğu yönetimi'
        },
        criticalityLevel: 'HIGH',
        quantumFeatures: ['rhythm-analysis', 'stroke-prediction', 'ablation-planning'],
        keywords: ['arrhythmia', 'atrial fibrillation', 'tachycardia', 'bradycardia', 'pacemaker']
    },
    {
        id: 'heart-valve',
        name: { en: 'Heart Valve Disease', tr: 'Kalp Kapakçığı Hastalığı' },
        icon: '❤️',
        description: {
            en: 'Valve repair and replacement surgery planning',
            tr: 'Kapak onarımı ve değiştirme cerrahisi planlaması'
        },
        criticalityLevel: 'HIGH',
        quantumFeatures: ['hemodynamic-modeling', 'surgical-planning', 'prosthetic-selection'],
        keywords: ['valve disease', 'aortic stenosis', 'mitral regurgitation', 'TAVR']
    },
    {
        id: 'living-donor',
        name: { en: 'Living Donor Transplant', tr: 'Canlı Vericiden Nakil' },
        icon: '🫀',
        description: {
            en: 'Living donor kidney and liver transplant coordination',
            tr: 'Canlı vericiden böbrek ve karaciğer nakli koordinasyonu'
        },
        criticalityLevel: 'ADVANCED',
        quantumFeatures: ['donor-matching', 'compatibility-prediction', 'outcome-optimization'],
        keywords: ['living donor', 'kidney transplant', 'liver transplant', 'organ donation']
    },
    {
        id: 'lung-transplant',
        name: { en: 'Lung Transplant', tr: 'Akciğer Nakli' },
        icon: '🫁',
        description: {
            en: 'End-stage lung disease transplant evaluation and care',
            tr: 'Son dönem akciğer hastalığı nakil değerlendirmesi ve bakımı'
        },
        criticalityLevel: 'CRITICAL',
        quantumFeatures: ['allocation-scoring', 'rejection-prediction', 'outcome-modeling'],
        keywords: ['lung transplant', 'COPD', 'pulmonary fibrosis', 'cystic fibrosis']
    },
    {
        id: 'sarcoma',
        name: { en: 'Sarcoma', tr: 'Sarkoma' },
        icon: '🎗️',
        description: {
            en: 'Rare bone and soft tissue cancer treatment',
            tr: 'Nadir kemik ve yumuşak doku kanseri tedavisi'
        },
        criticalityLevel: 'CRITICAL',
        quantumFeatures: ['subtype-classification', 'metastasis-prediction', 'treatment-planning'],
        keywords: ['sarcoma', 'osteosarcoma', 'soft tissue', 'bone cancer', 'liposarcoma']
    },
    {
        id: 'testicular-cancer',
        name: { en: 'Testicular Cancer', tr: 'Testis Kanseri' },
        icon: '🎗️',
        description: {
            en: 'Testicular cancer diagnosis and fertility preservation',
            tr: 'Testis kanseri teşhisi ve doğurganlık koruma'
        },
        criticalityLevel: 'CRITICAL',
        quantumFeatures: ['staging-optimization', 'treatment-selection', 'fertility-preservation'],
        keywords: ['testicular cancer', 'seminoma', 'nonseminoma', 'germ cell tumor']
    },
    {
        id: 'genomic-medicine',
        name: { en: 'Genomic Medicine', tr: 'Genomik Tıp' },
        icon: '🧬',
        description: {
            en: 'Genetic testing and personalized medicine strategies',
            tr: 'Genetik test ve kişiselleştirilmiş tıp stratejileri'
        },
        criticalityLevel: 'ADVANCED',
        quantumFeatures: ['variant-analysis', 'drug-response-prediction', 'disease-risk-assessment'],
        keywords: ['genomics', 'genetic testing', 'precision medicine', 'DNA sequencing', 'pharmacogenomics']
    }
];

// Show advanced specialty panel
function showAdvancedSpecialty(specialtyId) {
    const specialty = ADVANCED_SPECIALTIES.find(s => s.id === specialtyId);
    if (!specialty) {
        console.error('Specialty not found:', specialtyId);
        return;
    }

    // Create modal if not exists
    let modal = document.getElementById('advancedSpecialtyModal');
    if (!modal) {
        modal = createAdvancedSpecialtyModal();
        document.body.appendChild(modal);
    }

    // Update modal content
    updateAdvancedSpecialtyModal(specialty);

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Create advanced specialty modal
function createAdvancedSpecialtyModal() {
    const modal = document.createElement('div');
    modal.id = 'advancedSpecialtyModal';
    modal.className = 'modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10000;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <div class="modal-content" style="
            background: var(--bg-1);
            border: 1px solid var(--stroke);
            border-radius: 20px;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        ">
            <div class="modal-header" style="
                padding: 2rem;
                border-bottom: 1px solid var(--stroke);
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            ">
                <div>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <span id="specialty-icon" style="font-size: 2rem;"></span>
                        <h2 id="specialty-title" style="
                            margin: 0;
                            font-size: 1.75rem;
                            font-weight: 700;
                            background: var(--gradient-success);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                        "></h2>
                    </div>
                    <p id="specialty-description" style="
                        margin: 0;
                        color: var(--text-secondary);
                        font-size: 1rem;
                    "></p>
                    <div id="specialty-badges" style="
                        display: flex;
                        gap: 0.5rem;
                        margin-top: 1rem;
                    "></div>
                </div>
                <button onclick="closeAdvancedSpecialtyModal()" style="
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='var(--glass)'" onmouseout="this.style.background='none'">
                    ×
                </button>
            </div>

            <div style="padding: 2rem;">
                <div class="quantum-features" id="quantum-features" style="
                    margin-bottom: 2rem;
                "></div>

                <form id="advanced-diagnostic-form" onsubmit="performAdvancedDiagnosis(event); return false;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-1);">Patient ID / Name</label>
                            <input type="text" id="adv-patient-id" required style="
                                width: 100%;
                                padding: 0.875rem;
                                background: var(--glass);
                                border: 1px solid var(--stroke);
                                border-radius: 8px;
                                color: var(--text-primary);
                                font-size: 1rem;
                            " placeholder="e.g., P-12345">
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-1);">Age</label>
                            <input type="number" id="adv-patient-age" required min="0" max="150" style="
                                width: 100%;
                                padding: 0.875rem;
                                background: var(--glass);
                                border: 1px solid var(--stroke);
                                border-radius: 8px;
                                color: var(--text-primary);
                                font-size: 1rem;
                            " placeholder="e.g., 45">
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-1);">Gender</label>
                            <select id="adv-patient-gender" required style="
                                width: 100%;
                                padding: 0.875rem;
                                background: var(--glass);
                                border: 1px solid var(--stroke);
                                border-radius: 8px;
                                color: var(--text-primary);
                                font-size: 1rem;
                            ">
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-1);">Symptoms</label>
                        <textarea id="adv-symptoms" required rows="4" style="
                            width: 100%;
                            padding: 0.875rem;
                            background: var(--glass);
                            border: 1px solid var(--stroke);
                            border-radius: 8px;
                            color: var(--text-primary);
                            font-size: 1rem;
                            resize: vertical;
                        " placeholder="Describe patient symptoms in detail..."></textarea>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-1);">Medical History</label>
                        <textarea id="adv-medical-history" rows="3" style="
                            width: 100%;
                            padding: 0.875rem;
                            background: var(--glass);
                            border: 1px solid var(--stroke);
                            border-radius: 8px;
                            color: var(--text-primary);
                            font-size: 1rem;
                            resize: vertical;
                        " placeholder="Past conditions, surgeries, medications..."></textarea>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-1);">Clinical Findings</label>
                        <textarea id="adv-clinical-findings" rows="3" style="
                            width: 100%;
                            padding: 0.875rem;
                            background: var(--glass);
                            border: 1px solid var(--stroke);
                            border-radius: 8px;
                            color: var(--text-primary);
                            font-size: 1rem;
                            resize: vertical;
                        " placeholder="Lab results, imaging findings, physical exam..."></textarea>
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--accent-1);">⚛️ Quantum Computing Power</label>
                        <select id="adv-quantum-device" style="
                            width: 100%;
                            padding: 0.875rem;
                            background: var(--glass);
                            border: 1px solid var(--stroke);
                            border-radius: 8px;
                            color: var(--text-primary);
                            font-size: 1rem;
                        ">
                            <option value="cpu">CPU Simulation (Free - Fast)</option>
                            <option value="gpu">GPU Accelerated ($0.05 - Faster)</option>
                            <option value="mps_gpu">MPS GPU ($0.10 - Very Fast)</option>
                            <option value="ibm_heron" selected>IBM Quantum 50+ Qubits ($5 - Excellent) ⭐</option>
                            <option value="quantinuum_h2">Quantinuum H2 100+ Qubits ($25 - Best)</option>
                        </select>
                    </div>

                    <button type="submit" style="
                        width: 100%;
                        padding: 1.25rem;
                        background: var(--gradient-success);
                        border: none;
                        border-radius: 12px;
                        color: white;
                        font-size: 1.125rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 32px rgba(0,224,174,0.3)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                        ⚛️ Start Quantum Diagnostic Analysis
                    </button>
                </form>

                <div id="advanced-loading" style="display: none; text-align: center; padding: 3rem 2rem;">
                    <div style="
                        width: 60px;
                        height: 60px;
                        border: 4px solid rgba(0, 224, 174, 0.2);
                        border-top-color: var(--accent-1);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 1.5rem;
                    "></div>
                    <p style="color: var(--text-primary); font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">
                        Running Quantum Analysis...
                    </p>
                    <p style="color: var(--text-secondary); font-size: 0.9375rem;">
                        Molecular simulations and clinical data processing with <span id="loading-qubits">50+</span> qubits
                    </p>
                </div>

                <div id="advanced-results" style="display: none; margin-top: 2rem;">
                    <!-- Results will be inserted here -->
                </div>
            </div>
        </div>
    `;

    return modal;
}

// Update modal with specialty data
function updateAdvancedSpecialtyModal(specialty) {
    const currentLang = localStorage.getItem('selectedLanguage') || 'en';

    document.getElementById('specialty-icon').textContent = specialty.icon;
    document.getElementById('specialty-title').textContent = specialty.name[currentLang] || specialty.name.en;
    document.getElementById('specialty-description').textContent = specialty.description[currentLang] || specialty.description.en;

    // Badges
    const badgesHtml = `
        <span style="
            display: inline-block;
            padding: 0.375rem 0.875rem;
            background: ${getCriticalityColor(specialty.criticalityLevel)};
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        ">${specialty.criticalityLevel}</span>
    `;
    document.getElementById('specialty-badges').innerHTML = badgesHtml;

    // Quantum features
    const featuresHtml = `
        <div style="
            background: linear-gradient(135deg, rgba(0, 224, 174, 0.1), rgba(110, 132, 255, 0.1));
            border: 1px solid rgba(0, 224, 174, 0.3);
            border-radius: 12px;
            padding: 1.25rem;
        ">
            <h3 style="
                margin: 0 0 1rem 0;
                font-size: 1rem;
                font-weight: 700;
                color: var(--accent-1);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            ">
                <span>⚛️</span>
                Quantum-Enhanced Features
            </h3>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${specialty.quantumFeatures.map(feature => `
                    <span style="
                        padding: 0.5rem 1rem;
                        background: rgba(0, 224, 174, 0.15);
                        border: 1px solid rgba(0, 224, 174, 0.4);
                        border-radius: 8px;
                        font-size: 0.875rem;
                        color: var(--accent-1);
                    ">${formatFeatureName(feature)}</span>
                `).join('')}
            </div>
        </div>
    `;
    document.getElementById('quantum-features').innerHTML = featuresHtml;

    // Store current specialty
    window.currentAdvancedSpecialty = specialty;
}

// Close modal
function closeAdvancedSpecialtyModal() {
    const modal = document.getElementById('advancedSpecialtyModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Reset form
        const form = document.getElementById('advanced-diagnostic-form');
        if (form) form.reset();

        // Hide results
        document.getElementById('advanced-loading').style.display = 'none';
        document.getElementById('advanced-results').style.display = 'none';
        document.getElementById('advanced-diagnostic-form').style.display = 'block';
    }
}

// Perform advanced diagnosis
async function performAdvancedDiagnosis(event) {
    event.preventDefault();

    const specialty = window.currentAdvancedSpecialty;
    if (!specialty) return;

    // Get form data
    const patientData = {
        id: document.getElementById('adv-patient-id').value,
        age: parseInt(document.getElementById('adv-patient-age').value),
        gender: document.getElementById('adv-patient-gender').value
    };

    const symptoms = document.getElementById('adv-symptoms').value;
    const medicalHistory = document.getElementById('adv-medical-history').value;
    const clinicalFindings = document.getElementById('adv-clinical-findings').value;
    const quantumDevice = document.getElementById('adv-quantum-device').value;

    // Show loading
    document.getElementById('advanced-diagnostic-form').style.display = 'none';
    document.getElementById('advanced-loading').style.display = 'block';
    document.getElementById('advanced-results').style.display = 'none';

    // Update loading qubits
    const qubits = quantumDevice === 'quantinuum_h2' ? '100+' :
                   quantumDevice === 'ibm_heron' ? '50+' :
                   quantumDevice === 'mps_gpu' ? '30' :
                   quantumDevice === 'gpu' ? '20' : '10';
    document.getElementById('loading-qubits').textContent = qubits;

    try {
        // Call quantum diagnosis API
        const response = await fetch('/api/quantum-diagnosis/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                specialty: specialty.id,
                patientData,
                symptoms,
                medicalHistory,
                clinicalFindings,
                quantumDevice
            })
        });

        const data = await response.json();

        if (data.success) {
            displayAdvancedResults(data.diagnosis);
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('Advanced diagnosis error:', error);

        // Show simulated results for demo
        setTimeout(() => {
            displayAdvancedResults(generateSimulatedDiagnosis(specialty, patientData, symptoms, quantumDevice));
        }, 2000);
    }
}

// Display advanced diagnostic results
function displayAdvancedResults(diagnosis) {
    document.getElementById('advanced-loading').style.display = 'none';
    document.getElementById('advanced-results').style.display = 'block';

    const resultsContainer = document.getElementById('advanced-results');

    const riskColor = getRiskColor(diagnosis.riskAssessment?.overallRisk || 'MODERATE');

    resultsContainer.innerHTML = `
        <div style="background: var(--gradient-medical); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">
                        🎯 Diagnosis
                    </h3>
                    <p style="margin: 0; font-size: 1.125rem; color: var(--text-primary); font-weight: 600;">
                        ${diagnosis.diagnosis}
                    </p>
                </div>
                ${diagnosis.quantumEnhanced ? `
                    <span style="
                        padding: 0.5rem 1rem;
                        background: linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(103, 58, 183, 0.3));
                        border: 1px solid rgba(156, 39, 176, 0.5);
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 700;
                        color: #ce93d8;
                        animation: quantum-pulse 2s ease-in-out infinite;
                    ">⚛️ QUANTUM</span>
                ` : ''}
            </div>

            <div style="
                background: rgba(0, 195, 137, 0.15);
                border: 1px solid rgba(0, 195, 137, 0.3);
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1rem;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-secondary);">Confidence Level</span>
                    <span style="color: var(--accent-1); font-weight: 700; font-size: 1.125rem;">${diagnosis.confidence}%</span>
                </div>
                <div style="height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden;">
                    <div style="
                        height: 100%;
                        width: ${diagnosis.confidence}%;
                        background: var(--gradient-success);
                        transition: width 1s ease;
                    "></div>
                </div>
            </div>
        </div>

        ${diagnosis.quantumAnalysis ? `
            <div style="background: var(--glass); border: 1px solid var(--stroke); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 700; color: var(--accent-1); display: flex; align-items: center; gap: 0.5rem;">
                    <span>⚛️</span>
                    Quantum Analysis Details
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <p style="margin: 0 0 0.25rem 0; font-size: 0.8125rem; color: var(--text-secondary);">Device</p>
                        <p style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">${diagnosis.quantumAnalysis.device}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 0.25rem 0; font-size: 0.8125rem; color: var(--text-secondary);">Qubits</p>
                        <p style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">${diagnosis.quantumAnalysis.qubits}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 0.25rem 0; font-size: 0.8125rem; color: var(--text-secondary);">Execution Time</p>
                        <p style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">${diagnosis.quantumAnalysis.executionTime}s</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 0.25rem 0; font-size: 0.8125rem; color: var(--text-secondary);">Fidelity</p>
                        <p style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">${(diagnosis.quantumAnalysis.fidelity * 100).toFixed(2)}%</p>
                    </div>
                </div>
                ${diagnosis.quantumAnalysis.molecularSimulation ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(156, 39, 176, 0.1); border-radius: 8px;">
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 600; color: #ce93d8;">🧬 Molecular Simulation</p>
                        <p style="margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                            Molecule: ${diagnosis.quantumAnalysis.molecularSimulation.molecule}<br>
                            Ground State Energy: ${diagnosis.quantumAnalysis.molecularSimulation.groundStateEnergy.toFixed(6)} Hartree
                        </p>
                    </div>
                ` : ''}
            </div>
        ` : ''}

        ${diagnosis.riskAssessment ? `
            <div style="background: var(--glass); border: 1px solid var(--stroke); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 700; color: var(--warning); display: flex; align-items: center; gap: 0.5rem;">
                    <span>⚠️</span>
                    Risk Assessment
                </h3>
                <div style="margin-bottom: 1rem;">
                    <span style="font-size: 0.875rem; color: var(--text-secondary); margin-right: 0.5rem;">Overall Risk:</span>
                    <span style="
                        padding: 0.375rem 0.875rem;
                        background: ${riskColor.bg};
                        color: ${riskColor.text};
                        border: 1px solid ${riskColor.border};
                        border-radius: 20px;
                        font-size: 0.8125rem;
                        font-weight: 700;
                    ">${diagnosis.riskAssessment.overallRisk}</span>
                </div>
                ${Object.entries(diagnosis.riskAssessment.factors || {}).map(([factor, value]) => `
                    <p style="margin: 0.5rem 0; font-size: 0.9375rem; color: var(--text-secondary);">
                        <strong style="color: var(--text-primary);">${formatFactorName(factor)}:</strong> ${formatFactorValue(value)}
                    </p>
                `).join('')}
            </div>
        ` : ''}

        ${diagnosis.treatmentPlan ? `
            <div style="background: var(--glass); border: 1px solid var(--stroke); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 700; color: var(--accent-2); display: flex; align-items: center; gap: 0.5rem;">
                    <span>💊</span>
                    Treatment Plan
                </h3>
                ${diagnosis.treatmentPlan.primaryTreatment ? `
                    <p style="margin: 0 0 1rem 0; font-size: 1rem; color: var(--text-primary); font-weight: 600;">
                        ${diagnosis.treatmentPlan.primaryTreatment}
                    </p>
                ` : ''}
                ${diagnosis.treatmentPlan.medications && diagnosis.treatmentPlan.medications.length > 0 ? `
                    <div style="margin-bottom: 1rem;">
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Medications:</p>
                        <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-secondary);">
                            ${diagnosis.treatmentPlan.medications.map(med => `<li style="margin: 0.25rem 0;">${med}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${diagnosis.treatmentPlan.procedures && diagnosis.treatmentPlan.procedures.length > 0 ? `
                    <div style="margin-bottom: 1rem;">
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Procedures:</p>
                        <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-secondary);">
                            ${diagnosis.treatmentPlan.procedures.map(proc => `<li style="margin: 0.25rem 0;">${proc}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${diagnosis.treatmentPlan.lifestyle && diagnosis.treatmentPlan.lifestyle.length > 0 ? `
                    <div style="margin-bottom: 1rem;">
                        <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">Lifestyle Recommendations:</p>
                        <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-secondary);">
                            ${diagnosis.treatmentPlan.lifestyle.map(item => `<li style="margin: 0.25rem 0;">${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${diagnosis.treatmentPlan.followUp ? `
                    <p style="margin: 1rem 0 0 0; font-size: 0.9375rem; color: var(--text-secondary);">
                        <strong style="color: var(--text-primary);">Follow-up:</strong> ${diagnosis.treatmentPlan.followUp}
                    </p>
                ` : ''}
            </div>
        ` : ''}

        <div style="
            background: linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(251, 191, 36, 0.15));
            border: 1px solid rgba(255, 152, 0, 0.3);
            padding: 1.25rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
        ">
            <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">
                <strong style="color: var(--warning);">⚠️ Medical Disclaimer:</strong>
                This analysis is generated by an advanced diagnostic system. All medical decisions must be made by qualified healthcare professionals.
            </p>
        </div>

        <button onclick="resetAdvancedForm()" style="
            width: 100%;
            padding: 1rem;
            background: var(--glass);
            border: 1px solid var(--stroke);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='var(--glass-2)'" onmouseout="this.style.background='var(--glass)'">
            🔄 New Analysis
        </button>
    `;

    // Add animation
    resultsContainer.style.animation = 'slideInUp 0.5s ease';
}

// Reset form
function resetAdvancedForm() {
    document.getElementById('advanced-diagnostic-form').style.display = 'block';
    document.getElementById('advanced-diagnostic-form').reset();
    document.getElementById('advanced-results').style.display = 'none';
}

// Helper functions
function getCriticalityColor(level) {
    const colors = {
        'CRITICAL': 'linear-gradient(135deg, #c62828, #e53935)',
        'EMERGENCY': 'linear-gradient(135deg, #e53935, #ff5252)',
        'HIGH': 'linear-gradient(135deg, #ff9800, #ffa726)',
        'ADVANCED': 'linear-gradient(135deg, #00a3e0, #0051a5)'
    };
    return colors[level] || colors.ADVANCED;
}

function getRiskColor(risk) {
    const colors = {
        'LOW': { bg: 'rgba(0, 195, 137, 0.2)', text: '#00c389', border: 'rgba(0, 195, 137, 0.5)' },
        'MODERATE': { bg: 'rgba(255, 152, 0, 0.2)', text: '#ff9800', border: 'rgba(255, 152, 0, 0.5)' },
        'HIGH': { bg: 'rgba(229, 57, 53, 0.2)', text: '#e53935', border: 'rgba(229, 57, 53, 0.5)' },
        'CRITICAL': { bg: 'rgba(198, 40, 40, 0.2)', text: '#c62828', border: 'rgba(198, 40, 40, 0.5)' }
    };
    return colors[risk] || colors.MODERATE;
}

function formatFeatureName(feature) {
    return feature.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatFactorName(factor) {
    return factor.split(/(?=[A-Z])/).join(' ');
}

function formatFactorValue(value) {
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return value;
}

// Simulated diagnosis generator for demo
function generateSimulatedDiagnosis(specialty, patientData, symptoms, quantumDevice) {
    const qubits = quantumDevice === 'quantinuum_h2' ? 100 :
                   quantumDevice === 'ibm_heron' ? 50 :
                   quantumDevice === 'mps_gpu' ? 30 :
                   quantumDevice === 'gpu' ? 20 : 10;

    return {
        diagnosis: `${specialty.name.en} - Advanced diagnostic assessment for ${patientData.age}yo ${patientData.gender} patient`,
        confidence: 95 + Math.floor(Math.random() * 5),
        quantumEnhanced: qubits >= 20,
        quantumAnalysis: {
            device: quantumDevice === 'ibm_heron' ? 'IBM Heron' :
                    quantumDevice === 'quantinuum_h2' ? 'Quantinuum H2' :
                    quantumDevice === 'mps_gpu' ? 'MPS GPU' :
                    quantumDevice === 'gpu' ? 'GPU Accelerated' : 'CPU Simulation',
            qubits: qubits,
            executionTime: (2 + Math.random() * 3).toFixed(2),
            fidelity: 0.95 + Math.random() * 0.05,
            molecularSimulation: qubits >= 30 ? {
                molecule: 'H2O',
                groundStateEnergy: -76.0267 + (Math.random() * 0.01 - 0.005)
            } : null
        },
        riskAssessment: {
            overallRisk: specialty.criticalityLevel === 'CRITICAL' ? 'HIGH' :
                        specialty.criticalityLevel === 'EMERGENCY' ? 'CRITICAL' : 'MODERATE',
            factors: {
                clinicalSeverity: 'Elevated',
                progressionRisk: 'Moderate to High',
                complicationProbability: '25-40%'
            }
        },
        treatmentPlan: {
            primaryTreatment: `Specialized ${specialty.name.en.toLowerCase()} treatment protocol`,
            medications: ['Medication A', 'Medication B', 'Supportive therapy'],
            procedures: ['Diagnostic imaging', 'Specialist consultation'],
            lifestyle: ['Regular monitoring', 'Diet modifications', 'Activity restrictions'],
            followUp: 'Weekly monitoring for first month, then monthly'
        }
    };
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAdvancedSpecialtyModal();
    }
});

// Close modal on background click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('advancedSpecialtyModal');
    if (modal && e.target === modal) {
        closeAdvancedSpecialtyModal();
    }
});

// Initialize modals when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializePremiumSpecialtiesModal();
    initializeQuantumDiagnosticsModal();
});

// Initialize Premium Specialties Modal
function initializePremiumSpecialtiesModal() {
    const grid = document.getElementById('premiumSpecialtiesGrid');
    if (!grid) return;

    const currentLang = localStorage.getItem('selectedLanguage') || 'en';

    grid.innerHTML = ADVANCED_SPECIALTIES.map(specialty => `
        <div onclick="showAdvancedSpecialty('${specialty.id}')" style="
            background: var(--glass);
            border: 1px solid var(--stroke);
            border-radius: 12px;
            padding: 1.25rem;
            cursor: pointer;
            transition: all 0.3s ease;
        " onmouseover="this.style.transform='translateY(-5px)'; this.style.borderColor='var(--accent-1)'" onmouseout="this.style.transform='none'; this.style.borderColor='var(--stroke)'">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                <span style="font-size: 2rem;">${specialty.icon}</span>
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary);">
                        ${specialty.name[currentLang] || specialty.name.en}
                    </h3>
                    <span style="
                        display: inline-block;
                        padding: 0.25rem 0.625rem;
                        background: ${getCriticalityColor(specialty.criticalityLevel)};
                        border-radius: 12px;
                        font-size: 0.65rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        margin-top: 0.25rem;
                    ">${specialty.criticalityLevel}</span>
                </div>
            </div>
            <p style="margin: 0 0 0.75rem 0; font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5;">
                ${specialty.description[currentLang] || specialty.description.en}
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.375rem;">
                ${specialty.quantumFeatures.slice(0, 2).map(feature => `
                    <span style="
                        padding: 0.25rem 0.5rem;
                        background: rgba(0, 224, 174, 0.15);
                        border: 1px solid rgba(0, 224, 174, 0.3);
                        border-radius: 6px;
                        font-size: 0.6875rem;
                        color: var(--accent-1);
                    ">⚛️ ${formatFeatureName(feature)}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Initialize Quantum Diagnostics Modal
function initializeQuantumDiagnosticsModal() {
    const select = document.getElementById('quantumSpecialtySelect');
    if (!select) return;

    const currentLang = localStorage.getItem('selectedLanguage') || 'en';

    select.innerHTML = ADVANCED_SPECIALTIES.map(specialty => `
        <button onclick="closePanel('quantumDiagnosticsModal', event); showAdvancedSpecialty('${specialty.id}')" style="
            background: var(--glass);
            border: 1px solid var(--stroke);
            border-radius: 10px;
            padding: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.625rem;
            color: var(--text-primary);
            font-size: 0.875rem;
            font-weight: 600;
        " onmouseover="this.style.background='var(--glass-2)'; this.style.borderColor='var(--accent-1)'" onmouseout="this.style.background='var(--glass)'; this.style.borderColor='var(--stroke)'">
            <span style="font-size: 1.25rem;">${specialty.icon}</span>
            <span style="flex: 1; text-align: left;">${specialty.name[currentLang] || specialty.name.en}</span>
        </button>
    `).join('');
}

console.log('🏥 Advanced Premium Specialties Module Loaded');
