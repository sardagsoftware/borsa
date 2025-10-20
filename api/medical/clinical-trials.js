/**
 * Clinical Trials Management & Research Platform
 *
 * Comprehensive clinical research management system with patient recruitment,
 * trial monitoring, regulatory compliance, and data collection
 *
 * Features:
 * - Clinical Trial Registry & Management
 * - Patient Recruitment & Enrollment
 * - Study Protocol Management
 * - Randomization & Blinding
 * - Adverse Event Tracking
 * - Regulatory Compliance (FDA, EMA, ICH-GCP)
 * - Site Management & Monitoring
 * - Data Collection & EDC (Electronic Data Capture)
 * - IRB/Ethics Committee Tracking
 * - Real-time Trial Analytics
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// CLINICAL TRIAL PHASES
// ============================================================================

const TRIAL_PHASES = {
    'Phase 0': { name: 'Phase 0 (Exploratory)', participants: '10-15', duration: 'Months' },
    'Phase I': { name: 'Phase I (Safety)', participants: '20-100', duration: '6-12 months' },
    'Phase II': { name: 'Phase II (Efficacy)', participants: '100-300', duration: '1-2 years' },
    'Phase III': { name: 'Phase III (Confirmatory)', participants: '1000-3000', duration: '2-4 years' },
    'Phase IV': { name: 'Phase IV (Post-Marketing)', participants: 'Thousands', duration: 'Ongoing' }
};

// ============================================================================
// REGULATORY BODIES
// ============================================================================

const REGULATORY_BODIES = [
    { id: 'FDA', name: 'US FDA', country: 'United States', type: 'Federal' },
    { id: 'EMA', name: 'European Medicines Agency', country: 'European Union', type: 'Regional' },
    { id: 'PMDA', name: 'Pharmaceuticals and Medical Devices Agency', country: 'Japan', type: 'National' },
    { id: 'MHRA', name: 'Medicines and Healthcare products Regulatory Agency', country: 'United Kingdom', type: 'National' },
    { id: 'TGA', name: 'Therapeutic Goods Administration', country: 'Australia', type: 'National' }
];

// ============================================================================
// SAMPLE CLINICAL TRIALS DATABASE
// ============================================================================

let clinicalTrials = [
    {
        trialId: 'NCT2024001',
        title: 'Efficacy and Safety of Novel Diabetes Drug XYZ-101',
        phase: 'Phase III',
        condition: 'Type 2 Diabetes Mellitus',
        intervention: 'Drug: XYZ-101 vs Placebo',
        sponsor: 'PharmaCorp International',
        principalInvestigator: 'Dr. Sarah Johnson, MD, PhD',
        status: 'RECRUITING',
        startDate: '2024-01-15',
        estimatedCompletion: '2026-12-31',
        sites: [
            { siteId: 'SITE001', name: 'Johns Hopkins Hospital', location: 'Baltimore, MD', status: 'ACTIVE', enrolled: 45, target: 100 },
            { siteId: 'SITE002', name: 'Mayo Clinic', location: 'Rochester, MN', status: 'ACTIVE', enrolled: 38, target: 100 },
            { siteId: 'SITE003', name: 'Stanford Medical Center', location: 'Stanford, CA', status: 'PENDING', enrolled: 0, target: 100 }
        ],
        enrollment: {
            target: 1200,
            current: 83,
            screening: 156,
            randomized: 83,
            completed: 0,
            withdrawn: 12
        },
        eligibility: {
            minAge: 18,
            maxAge: 75,
            gender: 'All',
            criteria: [
                'HbA1c between 7.5% and 11%',
                'BMI 25-40 kg/m²',
                'No history of cardiovascular disease',
                'No renal impairment (eGFR > 60)'
            ]
        },
        primaryOutcome: 'Change in HbA1c from baseline at 24 weeks',
        secondaryOutcomes: [
            'Fasting plasma glucose reduction',
            'Weight change from baseline',
            'Incidence of hypoglycemia'
        ],
        adverseEvents: {
            total: 23,
            serious: 2,
            mild: 15,
            moderate: 6
        },
        regulatoryStatus: {
            FDA: { status: 'APPROVED', approvalDate: '2024-01-10', irbNumber: 'IRB-2024-001' },
            EMA: { status: 'APPROVED', approvalDate: '2024-01-08', irbNumber: 'EMA-2024-XYZ' }
        },
        studyDesign: {
            allocation: 'Randomized',
            interventionModel: 'Parallel Assignment',
            masking: 'Double Blind (Participant, Investigator)',
            primaryPurpose: 'Treatment'
        }
    },
    {
        trialId: 'NCT2024002',
        title: 'CAR-T Cell Therapy for Relapsed/Refractory Lymphoma',
        phase: 'Phase II',
        condition: 'Non-Hodgkin Lymphoma',
        intervention: 'Biological: CAR-T Cell Infusion',
        sponsor: 'OncoTherapeutics Inc.',
        principalInvestigator: 'Dr. Michael Chen, MD',
        status: 'ACTIVE',
        startDate: '2023-09-01',
        estimatedCompletion: '2025-08-31',
        sites: [
            { siteId: 'SITE004', name: 'MD Anderson Cancer Center', location: 'Houston, TX', status: 'ACTIVE', enrolled: 28, target: 75 },
            { siteId: 'SITE005', name: 'Memorial Sloan Kettering', location: 'New York, NY', status: 'ACTIVE', enrolled: 31, target: 75 }
        ],
        enrollment: {
            target: 150,
            current: 59,
            screening: 89,
            randomized: 59,
            completed: 12,
            withdrawn: 8
        },
        eligibility: {
            minAge: 18,
            maxAge: 70,
            gender: 'All',
            criteria: [
                'Histologically confirmed B-cell lymphoma',
                'Failed at least 2 prior therapies',
                'ECOG performance status 0-2',
                'Adequate organ function'
            ]
        },
        primaryOutcome: 'Overall response rate at 3 months',
        secondaryOutcomes: [
            'Complete response rate',
            'Duration of response',
            'Progression-free survival',
            'Incidence of cytokine release syndrome'
        ],
        adverseEvents: {
            total: 47,
            serious: 9,
            mild: 22,
            moderate: 16
        },
        regulatoryStatus: {
            FDA: { status: 'APPROVED', approvalDate: '2023-08-15', irbNumber: 'IRB-2023-089' }
        },
        studyDesign: {
            allocation: 'Non-Randomized',
            interventionModel: 'Single Group Assignment',
            masking: 'None (Open Label)',
            primaryPurpose: 'Treatment'
        }
    },
    {
        trialId: 'NCT2024003',
        title: 'Digital Therapeutic for Major Depressive Disorder',
        phase: 'Phase I',
        condition: 'Major Depressive Disorder',
        intervention: 'Device: AI-powered CBT mobile app',
        sponsor: 'MindHealth Technologies',
        principalInvestigator: 'Dr. Emily Rodriguez, PhD',
        status: 'ENROLLING',
        startDate: '2024-03-01',
        estimatedCompletion: '2024-09-30',
        sites: [
            { siteId: 'SITE006', name: 'UCLA Medical Center', location: 'Los Angeles, CA', status: 'ACTIVE', enrolled: 23, target: 50 }
        ],
        enrollment: {
            target: 50,
            current: 23,
            screening: 67,
            randomized: 23,
            completed: 0,
            withdrawn: 3
        },
        eligibility: {
            minAge: 18,
            maxAge: 65,
            gender: 'All',
            criteria: [
                'DSM-5 diagnosis of Major Depressive Disorder',
                'PHQ-9 score ≥ 10',
                'Smartphone ownership required',
                'No active suicidal ideation'
            ]
        },
        primaryOutcome: 'Safety and tolerability of digital intervention',
        secondaryOutcomes: [
            'Change in PHQ-9 score',
            'User engagement metrics',
            'Preliminary efficacy signals'
        ],
        adverseEvents: {
            total: 5,
            serious: 0,
            mild: 4,
            moderate: 1
        },
        regulatoryStatus: {
            FDA: { status: 'APPROVED', approvalDate: '2024-02-20', irbNumber: 'IRB-2024-015' }
        },
        studyDesign: {
            allocation: 'Randomized',
            interventionModel: 'Parallel Assignment',
            masking: 'Single Blind (Outcome Assessor)',
            primaryPurpose: 'Treatment'
        }
    }
];

// ============================================================================
// PATIENT RECRUITMENT DATABASE
// ============================================================================

let recruitmentCandidates = [
    {
        candidateId: 'CAND001',
        patientId: 'PT12345',
        patientName: 'John Doe',
        age: 52,
        gender: 'Male',
        eligibleTrials: ['NCT2024001'],
        matchScore: 0.95,
        screeningStatus: 'PENDING',
        conditions: ['Type 2 Diabetes', 'Hypertension'],
        labs: { hba1c: 8.2, bmi: 32.5, egfr: 75 }
    },
    {
        candidateId: 'CAND002',
        patientId: 'PT67890',
        patientName: 'Jane Smith',
        age: 45,
        gender: 'Female',
        eligibleTrials: ['NCT2024002'],
        matchScore: 0.88,
        screeningStatus: 'QUALIFIED',
        conditions: ['B-cell Lymphoma (Relapsed)'],
        labs: { ecogStatus: 1, priorTherapies: 3 }
    }
];

// ============================================================================
// ADVERSE EVENTS DATABASE
// ============================================================================

let adverseEvents = [
    {
        eventId: 'AE001',
        trialId: 'NCT2024001',
        participantId: 'P001',
        siteId: 'SITE001',
        severity: 'SERIOUS',
        term: 'Hypoglycemic Episode',
        onset: '2024-02-15',
        resolution: '2024-02-15',
        outcome: 'Resolved',
        relatedness: 'POSSIBLY_RELATED',
        action: 'Dose modification',
        reported: true,
        reportedDate: '2024-02-16',
        reportedTo: ['FDA', 'Sponsor', 'IRB']
    },
    {
        eventId: 'AE002',
        trialId: 'NCT2024002',
        participantId: 'P012',
        siteId: 'SITE004',
        severity: 'SERIOUS',
        term: 'Cytokine Release Syndrome (Grade 3)',
        onset: '2024-01-20',
        resolution: '2024-01-25',
        outcome: 'Resolved with sequelae',
        relatedness: 'DEFINITELY_RELATED',
        action: 'ICU admission, Tocilizumab administered',
        reported: true,
        reportedDate: '2024-01-20',
        reportedTo: ['FDA', 'Sponsor', 'IRB', 'DSMB']
    }
];

// ============================================================================
// AI PATIENT MATCHING ALGORITHM
// ============================================================================

function matchPatientToTrials(patient, trials) {
    const matches = [];

    trials.forEach(trial => {
        let score = 0;
        let reasons = [];

        // Age eligibility
        if (patient.age >= trial.eligibility.minAge && patient.age <= trial.eligibility.maxAge) {
            score += 0.3;
            reasons.push('Age eligible');
        }

        // Gender eligibility
        if (trial.eligibility.gender === 'All' || trial.eligibility.gender === patient.gender) {
            score += 0.2;
            reasons.push('Gender match');
        }

        // Condition match (simplified)
        const conditionMatch = patient.conditions.some(c =>
            trial.condition.toLowerCase().includes(c.toLowerCase())
        );
        if (conditionMatch) {
            score += 0.5;
            reasons.push('Primary condition match');
        }

        if (score >= 0.6 && trial.status === 'RECRUITING') {
            matches.push({
                trialId: trial.trialId,
                trialTitle: trial.title,
                matchScore: score,
                phase: trial.phase,
                sponsor: trial.sponsor,
                reasons: reasons,
                enrollmentStatus: `${trial.enrollment.current}/${trial.enrollment.target}`
            });
        }
    });

    return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// ============================================================================
// TRIAL ANALYTICS CALCULATOR
// ============================================================================

function calculateTrialMetrics(trial) {
    const enrollmentRate = (trial.enrollment.current / trial.enrollment.target * 100).toFixed(1);
    const withdrawalRate = (trial.enrollment.withdrawn / trial.enrollment.randomized * 100).toFixed(1);

    const startDate = new Date(trial.startDate);
    const completionDate = new Date(trial.estimatedCompletion);
    const today = new Date();

    const totalDuration = Math.floor((completionDate - startDate) / (1000 * 60 * 60 * 24));
    const elapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const progress = (elapsed / totalDuration * 100).toFixed(1);

    const seriousAERate = (trial.adverseEvents.serious / trial.enrollment.randomized * 100).toFixed(1);

    const sitesActive = trial.sites.filter(s => s.status === 'ACTIVE').length;
    const avgEnrollmentPerSite = trial.sites.length > 0
        ? (trial.enrollment.current / sitesActive).toFixed(1)
        : 0;

    return {
        enrollmentRate: `${enrollmentRate}%`,
        withdrawalRate: `${withdrawalRate}%`,
        trialProgress: `${progress}%`,
        daysElapsed: elapsed,
        daysRemaining: totalDuration - elapsed,
        seriousAERate: `${seriousAERate}%`,
        activeSites: sitesActive,
        avgEnrollmentPerSite: avgEnrollmentPerSite,
        screenFailureRate: trial.enrollment.screening > 0
            ? `${((trial.enrollment.screening - trial.enrollment.randomized) / trial.enrollment.screening * 100).toFixed(1)}%`
            : '0%'
    };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// 1. Get All Clinical Trials
router.get('/trials', async (req, res) => {
    try {
        const { status, phase, condition } = req.query;

        let filteredTrials = [...clinicalTrials];

        if (status) {
            filteredTrials = filteredTrials.filter(t => t.status === status);
        }

        if (phase) {
            filteredTrials = filteredTrials.filter(t => t.phase === phase);
        }

        if (condition) {
            filteredTrials = filteredTrials.filter(t =>
                t.condition.toLowerCase().includes(condition.toLowerCase())
            );
        }

        res.json({
            success: true,
            total: filteredTrials.length,
            trials: filteredTrials
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 2. Get Trial Details
router.get('/trials/:trialId', async (req, res) => {
    try {
        const { trialId } = req.params;

        const trial = clinicalTrials.find(t => t.trialId === trialId);

        if (!trial) {
            return res.status(404).json({
                success: false,
                error: 'Trial not found'
            });
        }

        const metrics = calculateTrialMetrics(trial);

        res.json({
            success: true,
            trial,
            metrics
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. Create New Clinical Trial
router.post('/trials', async (req, res) => {
    try {
        const {
            title,
            phase,
            condition,
            intervention,
            sponsor,
            principalInvestigator,
            targetEnrollment,
            eligibility
        } = req.body;

        const newTrial = {
            trialId: `NCT${new Date().getFullYear()}${String(clinicalTrials.length + 1).padStart(3, '0')}`,
            title,
            phase,
            condition,
            intervention,
            sponsor,
            principalInvestigator,
            status: 'PLANNED',
            startDate: new Date().toISOString().split('T')[0],
            estimatedCompletion: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            sites: [],
            enrollment: {
                target: targetEnrollment,
                current: 0,
                screening: 0,
                randomized: 0,
                completed: 0,
                withdrawn: 0
            },
            eligibility: eligibility || {
                minAge: 18,
                maxAge: 75,
                gender: 'All',
                criteria: []
            },
            adverseEvents: {
                total: 0,
                serious: 0,
                mild: 0,
                moderate: 0
            },
            regulatoryStatus: {},
            studyDesign: {}
        };

        clinicalTrials.push(newTrial);

        res.json({
            success: true,
            trial: newTrial,
            message: 'Clinical trial created successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. Patient Matching & Recruitment
router.post('/recruitment/match', async (req, res) => {
    try {
        const { patientId, patientData } = req.body;

        const matches = matchPatientToTrials(patientData, clinicalTrials);

        res.json({
            success: true,
            patientId,
            totalMatches: matches.length,
            matches,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. Get Recruitment Candidates
router.get('/recruitment/candidates', async (req, res) => {
    try {
        const { trialId } = req.query;

        let candidates = [...recruitmentCandidates];

        if (trialId) {
            candidates = candidates.filter(c => c.eligibleTrials.includes(trialId));
        }

        res.json({
            success: true,
            total: candidates.length,
            candidates
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 6. Enroll Patient in Trial
router.post('/enrollment', async (req, res) => {
    try {
        const { trialId, patientId, siteId } = req.body;

        const trial = clinicalTrials.find(t => t.trialId === trialId);

        if (!trial) {
            return res.status(404).json({
                success: false,
                error: 'Trial not found'
            });
        }

        const site = trial.sites.find(s => s.siteId === siteId);

        if (!site) {
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }

        // Update enrollment
        trial.enrollment.current += 1;
        trial.enrollment.randomized += 1;
        site.enrolled += 1;

        const enrollmentRecord = {
            enrollmentId: `ENR${Date.now()}`,
            trialId,
            patientId,
            siteId,
            enrollmentDate: new Date().toISOString().split('T')[0],
            randomizationArm: Math.random() > 0.5 ? 'Treatment' : 'Placebo',
            status: 'ACTIVE'
        };

        res.json({
            success: true,
            enrollment: enrollmentRecord,
            message: 'Patient enrolled successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 7. Report Adverse Event
router.post('/adverse-events', async (req, res) => {
    try {
        const {
            trialId,
            participantId,
            siteId,
            severity,
            term,
            onset,
            relatedness
        } = req.body;

        const newAE = {
            eventId: `AE${String(adverseEvents.length + 1).padStart(3, '0')}`,
            trialId,
            participantId,
            siteId,
            severity,
            term,
            onset,
            resolution: null,
            outcome: 'ONGOING',
            relatedness,
            action: 'Under evaluation',
            reported: severity === 'SERIOUS',
            reportedDate: severity === 'SERIOUS' ? new Date().toISOString().split('T')[0] : null,
            reportedTo: severity === 'SERIOUS' ? ['FDA', 'Sponsor', 'IRB'] : []
        };

        adverseEvents.push(newAE);

        // Update trial AE count
        const trial = clinicalTrials.find(t => t.trialId === trialId);
        if (trial) {
            trial.adverseEvents.total += 1;
            if (severity === 'SERIOUS') trial.adverseEvents.serious += 1;
            else if (severity === 'MODERATE') trial.adverseEvents.moderate += 1;
            else trial.adverseEvents.mild += 1;
        }

        res.json({
            success: true,
            adverseEvent: newAE,
            requiresImmediateReporting: severity === 'SERIOUS',
            message: severity === 'SERIOUS'
                ? 'Serious adverse event reported. Regulatory notifications initiated.'
                : 'Adverse event recorded successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 8. Get Adverse Events
router.get('/adverse-events', async (req, res) => {
    try {
        const { trialId, severity } = req.query;

        let filteredAEs = [...adverseEvents];

        if (trialId) {
            filteredAEs = filteredAEs.filter(ae => ae.trialId === trialId);
        }

        if (severity) {
            filteredAEs = filteredAEs.filter(ae => ae.severity === severity);
        }

        res.json({
            success: true,
            total: filteredAEs.length,
            adverseEvents: filteredAEs
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 9. Get Trial Analytics
router.get('/analytics', async (req, res) => {
    try {
        const totalTrials = clinicalTrials.length;
        const activeTrials = clinicalTrials.filter(t => ['RECRUITING', 'ACTIVE', 'ENROLLING'].includes(t.status)).length;

        const totalEnrollment = clinicalTrials.reduce((sum, t) => sum + t.enrollment.current, 0);
        const targetEnrollment = clinicalTrials.reduce((sum, t) => sum + t.enrollment.target, 0);
        const enrollmentRate = ((totalEnrollment / targetEnrollment) * 100).toFixed(1);

        const totalAEs = adverseEvents.length;
        const seriousAEs = adverseEvents.filter(ae => ae.severity === 'SERIOUS').length;

        const phaseDistribution = {};
        clinicalTrials.forEach(trial => {
            phaseDistribution[trial.phase] = (phaseDistribution[trial.phase] || 0) + 1;
        });

        const topConditions = {};
        clinicalTrials.forEach(trial => {
            topConditions[trial.condition] = (topConditions[trial.condition] || 0) + 1;
        });

        res.json({
            success: true,
            analytics: {
                totalTrials,
                activeTrials,
                totalEnrollment,
                targetEnrollment,
                enrollmentRate: `${enrollmentRate}%`,
                totalAdverseEvents: totalAEs,
                seriousAdverseEvents: seriousAEs,
                phaseDistribution,
                topConditions,
                averageEnrollmentPerTrial: (totalEnrollment / totalTrials).toFixed(1)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 10. Add Study Site
router.post('/trials/:trialId/sites', async (req, res) => {
    try {
        const { trialId } = req.params;
        const { name, location, targetEnrollment } = req.body;

        const trial = clinicalTrials.find(t => t.trialId === trialId);

        if (!trial) {
            return res.status(404).json({
                success: false,
                error: 'Trial not found'
            });
        }

        const newSite = {
            siteId: `SITE${String(trial.sites.length + 1).padStart(3, '0')}`,
            name,
            location,
            status: 'PENDING',
            enrolled: 0,
            target: targetEnrollment || 100
        };

        trial.sites.push(newSite);

        res.json({
            success: true,
            site: newSite,
            message: 'Study site added successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 11. Get Regulatory Bodies
router.get('/regulatory-bodies', async (req, res) => {
    try {
        res.json({
            success: true,
            total: REGULATORY_BODIES.length,
            regulatoryBodies: REGULATORY_BODIES
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 12. Submit Regulatory Application
router.post('/trials/:trialId/regulatory', async (req, res) => {
    try {
        const { trialId } = req.params;
        const { regulatoryBody, irbNumber } = req.body;

        const trial = clinicalTrials.find(t => t.trialId === trialId);

        if (!trial) {
            return res.status(404).json({
                success: false,
                error: 'Trial not found'
            });
        }

        trial.regulatoryStatus[regulatoryBody] = {
            status: 'PENDING',
            submissionDate: new Date().toISOString().split('T')[0],
            irbNumber: irbNumber
        };

        res.json({
            success: true,
            message: `Regulatory application submitted to ${regulatoryBody}`,
            regulatoryStatus: trial.regulatoryStatus
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
