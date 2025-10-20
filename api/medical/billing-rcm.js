/**
 * Medical Billing & Revenue Cycle Management AI
 *
 * AI-powered medical billing with claims processing, denial prediction,
 * revenue cycle optimization, coding compliance, and automated workflows
 *
 * Features:
 * - AI Claims Validation & Scrubbing
 * - Denial Prediction & Prevention
 * - ICD-10 & CPT Code Validation
 * - Revenue Cycle Analytics
 * - Insurance Eligibility Verification
 * - Payment Posting Automation
 * - AR (Accounts Receivable) Management
 * - Prior Authorization Management
 * - Coding Compliance Checks
 * - Real-time Claim Status Tracking
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// INSURANCE PAYERS DATABASE
// ============================================================================

const INSURANCE_PAYERS = [
    {
        payerId: 'PAY001',
        name: 'Blue Cross Blue Shield',
        type: 'Commercial',
        clearinghouse: 'Availity',
        claimFormat: 'EDI 837',
        avgPaymentDays: 15,
        denialRate: 0.08,
        acceptsElectronic: true
    },
    {
        payerId: 'PAY002',
        name: 'Medicare',
        type: 'Government',
        clearinghouse: 'Direct',
        claimFormat: 'CMS-1500',
        avgPaymentDays: 30,
        denialRate: 0.12,
        acceptsElectronic: true
    },
    {
        payerId: 'PAY003',
        name: 'UnitedHealthcare',
        type: 'Commercial',
        clearinghouse: 'Change Healthcare',
        claimFormat: 'EDI 837',
        avgPaymentDays: 18,
        denialRate: 0.10,
        acceptsElectronic: true
    },
    {
        payerId: 'PAY004',
        name: 'Aetna',
        type: 'Commercial',
        clearinghouse: 'Availity',
        claimFormat: 'EDI 837',
        avgPaymentDays: 20,
        denialRate: 0.09,
        acceptsElectronic: true
    },
    {
        payerId: 'PAY005',
        name: 'Medicaid',
        type: 'Government',
        clearinghouse: 'State Gateway',
        claimFormat: 'CMS-1500',
        avgPaymentDays: 45,
        denialRate: 0.15,
        acceptsElectronic: true
    }
];

// ============================================================================
// ICD-10 & CPT CODES DATABASE
// ============================================================================

const ICD10_CODES = [
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
    { code: 'I10', description: 'Essential (primary) hypertension', category: 'Circulatory' },
    { code: 'J45.909', description: 'Unspecified asthma, uncomplicated', category: 'Respiratory' },
    { code: 'M25.511', description: 'Pain in right shoulder', category: 'Musculoskeletal' },
    { code: 'R51', description: 'Headache', category: 'Symptoms' },
    { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings', category: 'Factors' },
    { code: 'E78.5', description: 'Hyperlipidemia, unspecified', category: 'Endocrine' },
    { code: 'K21.9', description: 'Gastro-esophageal reflux disease without esophagitis', category: 'Digestive' }
];

const CPT_CODES = [
    { code: '99213', description: 'Office/outpatient visit, established patient, low to moderate complexity', fee: 109.00, rvu: 1.3 },
    { code: '99214', description: 'Office/outpatient visit, established patient, moderate complexity', fee: 167.00, rvu: 1.92 },
    { code: '99215', description: 'Office/outpatient visit, established patient, high complexity', fee: 211.00, rvu: 2.8 },
    { code: '99203', description: 'Office/outpatient visit, new patient, low to moderate complexity', fee: 135.00, rvu: 1.6 },
    { code: '99204', description: 'Office/outpatient visit, new patient, moderate complexity', fee: 203.00, rvu: 2.6 },
    { code: '99205', description: 'Office/outpatient visit, new patient, high complexity', fee: 270.00, rvu: 3.5 },
    { code: '80053', description: 'Comprehensive metabolic panel', fee: 35.00, rvu: 0.5 },
    { code: '85025', description: 'Complete blood count (CBC) with differential', fee: 25.00, rvu: 0.4 },
    { code: '93000', description: 'Electrocardiogram (ECG)', fee: 45.00, rvu: 0.6 },
    { code: '71045', description: 'Chest X-ray, single view', fee: 75.00, rvu: 0.7 }
];

// ============================================================================
// SAMPLE CLAIMS DATABASE
// ============================================================================

let sampleClaims = [
    {
        claimId: 'CLM2024100001',
        patientId: 'PT001',
        patientName: 'John Doe',
        dateOfService: '2024-10-01',
        providerId: 'DR001',
        providerName: 'Dr. Sarah Johnson',
        payerId: 'PAY001',
        payerName: 'Blue Cross Blue Shield',
        claimType: 'Professional',
        claimAmount: 276.00,
        status: 'SUBMITTED',
        submittedDate: '2024-10-02',
        diagnosisCodes: ['E11.9', 'I10'],
        procedureCodes: [
            { code: '99214', units: 1, fee: 167.00 },
            { code: '99213', units: 1, fee: 109.00 }
        ],
        aiValidation: {
            passed: true,
            confidence: 0.95,
            flags: [],
            denialRisk: 0.05,
            recommendations: ['Claim structure is compliant', 'Coding is appropriate for diagnosis']
        },
        clearinghouse: 'Availity',
        expectedPaymentDate: '2024-10-17'
    },
    {
        claimId: 'CLM2024100002',
        patientId: 'PT002',
        patientName: 'Jane Smith',
        dateOfService: '2024-10-02',
        providerId: 'DR002',
        providerName: 'Dr. Michael Chen',
        payerId: 'PAY002',
        payerName: 'Medicare',
        claimType: 'Professional',
        claimAmount: 380.00,
        status: 'DENIED',
        submittedDate: '2024-10-03',
        deniedDate: '2024-10-05',
        denialReason: 'Medical necessity not established',
        denialCode: 'CO-50',
        diagnosisCodes: ['R51'],
        procedureCodes: [
            { code: '99205', units: 1, fee: 270.00 },
            { code: '71045', units: 1, fee: 75.00 },
            { code: '80053', units: 1, fee: 35.00 }
        ],
        aiValidation: {
            passed: false,
            confidence: 0.78,
            flags: ['Insufficient diagnosis coding for high-level visit', 'Missing supporting documentation'],
            denialRisk: 0.65,
            recommendations: [
                'Add more specific ICD-10 codes to support 99205',
                'Include clinical documentation for medical necessity',
                'Consider appeal with additional records'
            ]
        },
        clearinghouse: 'Direct',
        appealStatus: 'PENDING'
    },
    {
        claimId: 'CLM2024100003',
        patientId: 'PT003',
        patientName: 'Robert Wilson',
        dateOfService: '2024-09-28',
        providerId: 'DR001',
        providerName: 'Dr. Sarah Johnson',
        payerId: 'PAY003',
        payerName: 'UnitedHealthcare',
        claimType: 'Professional',
        claimAmount: 203.00,
        status: 'PAID',
        submittedDate: '2024-09-29',
        paidDate: '2024-10-15',
        paidAmount: 182.70,
        adjustmentAmount: 20.30,
        diagnosisCodes: ['J45.909', 'I10'],
        procedureCodes: [
            { code: '99204', units: 1, fee: 203.00 }
        ],
        aiValidation: {
            passed: true,
            confidence: 0.92,
            flags: [],
            denialRisk: 0.08,
            recommendations: ['Clean claim with proper coding']
        },
        clearinghouse: 'Change Healthcare',
        paymentMethod: 'EFT',
        era835: 'ERA20241015001'
    }
];

// ============================================================================
// AI DENIAL PREDICTION MODEL
// ============================================================================

function predictDenialRisk(claim) {
    let riskScore = 0;
    const flags = [];
    const recommendations = [];

    // Check diagnosis-procedure alignment
    const hasComplexProcedure = claim.procedureCodes.some(p =>
        ['99205', '99215'].includes(p.code)
    );
    const hasSimpleDiagnosis = claim.diagnosisCodes.some(d =>
        ['R51', 'Z00.00'].includes(d)
    );

    if (hasComplexProcedure && hasSimpleDiagnosis) {
        riskScore += 0.40;
        flags.push('High-level E/M code with simple diagnosis');
        recommendations.push('Add more specific ICD-10 codes to justify complexity');
    }

    // Check for missing modifiers
    if (claim.procedureCodes.length > 1) {
        const hasModifiers = claim.procedureCodes.some(p => p.modifier);
        if (!hasModifiers) {
            riskScore += 0.15;
            flags.push('Multiple procedures without modifiers');
            recommendations.push('Add appropriate modifiers (25, 59) for multiple procedures');
        }
    }

    // Check payer-specific rules
    const payer = INSURANCE_PAYERS.find(p => p.payerId === claim.payerId);
    if (payer) {
        riskScore += payer.denialRate * 0.3; // Factor in historical denial rate
    }

    // Check claim amount vs average
    if (claim.claimAmount > 500) {
        riskScore += 0.10;
        flags.push('High claim amount may trigger review');
    }

    // Calculate confidence
    const confidence = Math.max(0.60, Math.min(0.99, 1 - riskScore));

    return {
        denialRisk: Math.min(0.95, riskScore),
        confidence: confidence,
        passed: riskScore < 0.30,
        flags: flags,
        recommendations: recommendations.length > 0 ? recommendations : ['Claim structure is compliant']
    };
}

// ============================================================================
// REVENUE CYCLE ANALYTICS
// ============================================================================

function calculateRCMMetrics(claims) {
    const totalClaims = claims.length;
    const submittedClaims = claims.filter(c => ['SUBMITTED', 'PAID', 'DENIED'].includes(c.status));
    const paidClaims = claims.filter(c => c.status === 'PAID');
    const deniedClaims = claims.filter(c => c.status === 'DENIED');

    const totalBilled = claims.reduce((sum, c) => sum + c.claimAmount, 0);
    const totalPaid = paidClaims.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const totalDenied = deniedClaims.reduce((sum, c) => sum + c.claimAmount, 0);

    const denialRate = submittedClaims.length > 0
        ? (deniedClaims.length / submittedClaims.length) * 100
        : 0;

    const collectionRate = totalBilled > 0
        ? (totalPaid / totalBilled) * 100
        : 0;

    // Calculate average days to payment
    const paidClaimsWithDates = paidClaims.filter(c => c.submittedDate && c.paidDate);
    const avgDaysToPayment = paidClaimsWithDates.length > 0
        ? paidClaimsWithDates.reduce((sum, c) => {
            const submitted = new Date(c.submittedDate);
            const paid = new Date(c.paidDate);
            const days = Math.floor((paid - submitted) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0) / paidClaimsWithDates.length
        : 0;

    // AR aging analysis
    const now = new Date();
    const arAging = {
        current: 0,      // 0-30 days
        days30to60: 0,   // 31-60 days
        days60to90: 0,   // 61-90 days
        over90: 0        // 90+ days
    };

    claims.filter(c => c.status === 'SUBMITTED').forEach(claim => {
        const submitted = new Date(claim.submittedDate);
        const daysPending = Math.floor((now - submitted) / (1000 * 60 * 60 * 24));

        if (daysPending <= 30) arAging.current += claim.claimAmount;
        else if (daysPending <= 60) arAging.days30to60 += claim.claimAmount;
        else if (daysPending <= 90) arAging.days60to90 += claim.claimAmount;
        else arAging.over90 += claim.claimAmount;
    });

    return {
        totalClaims,
        submittedClaims: submittedClaims.length,
        paidClaims: paidClaims.length,
        deniedClaims: deniedClaims.length,
        totalBilled: totalBilled.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalDenied: totalDenied.toFixed(2),
        denialRate: denialRate.toFixed(2),
        collectionRate: collectionRate.toFixed(2),
        avgDaysToPayment: avgDaysToPayment.toFixed(0),
        arAging: {
            current: arAging.current.toFixed(2),
            days30to60: arAging.days30to60.toFixed(2),
            days60to90: arAging.days60to90.toFixed(2),
            over90: arAging.over90.toFixed(2)
        },
        cleanClaimRate: ((totalClaims - deniedClaims.length) / totalClaims * 100).toFixed(2)
    };
}

// ============================================================================
// CODING COMPLIANCE VALIDATOR
// ============================================================================

function validateCoding(diagnosisCodes, procedureCodes) {
    const errors = [];
    const warnings = [];
    const suggestions = [];

    // Validate ICD-10 codes
    diagnosisCodes.forEach(code => {
        const icd10 = ICD10_CODES.find(c => c.code === code);
        if (!icd10) {
            errors.push(`Invalid ICD-10 code: ${code}`);
        }
    });

    // Validate CPT codes
    procedureCodes.forEach(proc => {
        const cpt = CPT_CODES.find(c => c.code === proc.code);
        if (!cpt) {
            errors.push(`Invalid CPT code: ${proc.code}`);
        }
    });

    // Check for missing diagnosis
    if (diagnosisCodes.length === 0) {
        errors.push('At least one diagnosis code is required');
    }

    // Check for missing procedures
    if (procedureCodes.length === 0) {
        errors.push('At least one procedure code is required');
    }

    // Check for duplicate E/M codes
    const emCodes = procedureCodes.filter(p => p.code.startsWith('99'));
    if (emCodes.length > 1) {
        warnings.push('Multiple E/M codes detected - verify modifier usage');
    }

    // Suggest additional codes
    if (diagnosisCodes.includes('I10') && !procedureCodes.some(p => ['80053', '85025'].includes(p.code))) {
        suggestions.push('Consider adding lab work (80053, 85025) for hypertension management');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
    };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// 1. Submit New Claim with AI Validation
router.post('/submit-claim', async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            dateOfService,
            providerId,
            providerName,
            payerId,
            diagnosisCodes,
            procedureCodes
        } = req.body;

        // Calculate claim amount
        const claimAmount = procedureCodes.reduce((sum, p) => sum + (p.fee * p.units), 0);

        // Find payer info
        const payer = INSURANCE_PAYERS.find(p => p.payerId === payerId);

        // Create claim object
        const newClaim = {
            claimId: `CLM${new Date().getFullYear()}${String(Date.now()).slice(-8)}`,
            patientId,
            patientName,
            dateOfService,
            providerId,
            providerName,
            payerId,
            payerName: payer?.name || 'Unknown Payer',
            claimType: 'Professional',
            claimAmount,
            status: 'DRAFT',
            diagnosisCodes,
            procedureCodes,
            clearinghouse: payer?.clearinghouse || 'Direct',
            expectedPaymentDate: new Date(Date.now() + (payer?.avgPaymentDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        // Run AI validation
        const aiValidation = predictDenialRisk(newClaim);
        newClaim.aiValidation = aiValidation;

        // Run coding compliance check
        const codingValidation = validateCoding(diagnosisCodes, procedureCodes);

        // If passed all validations, mark as submitted
        if (aiValidation.passed && codingValidation.isValid) {
            newClaim.status = 'SUBMITTED';
            newClaim.submittedDate = new Date().toISOString().split('T')[0];
        }

        sampleClaims.push(newClaim);

        res.json({
            success: true,
            claim: newClaim,
            aiValidation,
            codingValidation,
            message: aiValidation.passed && codingValidation.isValid
                ? 'Claim submitted successfully'
                : 'Claim saved as draft - review required'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 2. Get Claims List with Filters
router.get('/claims', async (req, res) => {
    try {
        const { status, patientId, payerId, startDate, endDate, limit = 50 } = req.query;

        let filteredClaims = [...sampleClaims];

        if (status) {
            filteredClaims = filteredClaims.filter(c => c.status === status);
        }

        if (patientId) {
            filteredClaims = filteredClaims.filter(c => c.patientId === patientId);
        }

        if (payerId) {
            filteredClaims = filteredClaims.filter(c => c.payerId === payerId);
        }

        if (startDate) {
            filteredClaims = filteredClaims.filter(c => c.dateOfService >= startDate);
        }

        if (endDate) {
            filteredClaims = filteredClaims.filter(c => c.dateOfService <= endDate);
        }

        // Sort by submitted date (newest first)
        filteredClaims.sort((a, b) =>
            new Date(b.submittedDate || b.dateOfService) - new Date(a.submittedDate || a.dateOfService)
        );

        const paginatedClaims = filteredClaims.slice(0, parseInt(limit));

        res.json({
            success: true,
            total: filteredClaims.length,
            claims: paginatedClaims
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. Get Claim Details by ID
router.get('/claims/:claimId', async (req, res) => {
    try {
        const { claimId } = req.params;

        const claim = sampleClaims.find(c => c.claimId === claimId);

        if (!claim) {
            return res.status(404).json({
                success: false,
                error: 'Claim not found'
            });
        }

        // Get payer details
        const payer = INSURANCE_PAYERS.find(p => p.payerId === claim.payerId);

        // Get coding details
        const diagnosisDetails = claim.diagnosisCodes.map(code =>
            ICD10_CODES.find(icd => icd.code === code)
        );

        const procedureDetails = claim.procedureCodes.map(proc => ({
            ...proc,
            ...CPT_CODES.find(cpt => cpt.code === proc.code)
        }));

        res.json({
            success: true,
            claim: {
                ...claim,
                payerDetails: payer,
                diagnosisDetails,
                procedureDetails
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. Get Revenue Cycle Analytics
router.get('/analytics', async (req, res) => {
    try {
        const metrics = calculateRCMMetrics(sampleClaims);

        // Add additional insights
        const insights = [];

        if (parseFloat(metrics.denialRate) > 10) {
            insights.push({
                type: 'warning',
                message: `Denial rate is ${metrics.denialRate}% - Industry average is 5-10%`,
                action: 'Review denied claims for common patterns'
            });
        }

        if (parseFloat(metrics.avgDaysToPayment) > 30) {
            insights.push({
                type: 'warning',
                message: `Average days to payment is ${metrics.avgDaysToPayment} days`,
                action: 'Follow up on pending claims over 30 days'
            });
        }

        if (parseFloat(metrics.collectionRate) < 95) {
            insights.push({
                type: 'info',
                message: `Collection rate is ${metrics.collectionRate}% - Target is 95%+`,
                action: 'Focus on reducing denials and improving coding accuracy'
            });
        }

        res.json({
            success: true,
            metrics,
            insights,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. Predict Denial Risk for Existing Claim
router.post('/predict-denial/:claimId', async (req, res) => {
    try {
        const { claimId } = req.params;

        const claim = sampleClaims.find(c => c.claimId === claimId);

        if (!claim) {
            return res.status(404).json({
                success: false,
                error: 'Claim not found'
            });
        }

        const prediction = predictDenialRisk(claim);

        res.json({
            success: true,
            claimId,
            prediction,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 6. Validate Coding Compliance
router.post('/validate-coding', async (req, res) => {
    try {
        const { diagnosisCodes, procedureCodes } = req.body;

        const validation = validateCoding(diagnosisCodes, procedureCodes);

        res.json({
            success: true,
            validation,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 7. Get Insurance Payers List
router.get('/payers', async (req, res) => {
    try {
        res.json({
            success: true,
            total: INSURANCE_PAYERS.length,
            payers: INSURANCE_PAYERS
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 8. Search ICD-10 Codes
router.get('/icd10/search', async (req, res) => {
    try {
        const { query, category } = req.query;

        let results = [...ICD10_CODES];

        if (query) {
            const searchTerm = query.toLowerCase();
            results = results.filter(code =>
                code.code.toLowerCase().includes(searchTerm) ||
                code.description.toLowerCase().includes(searchTerm)
            );
        }

        if (category) {
            results = results.filter(code => code.category === category);
        }

        res.json({
            success: true,
            total: results.length,
            codes: results
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 9. Search CPT Codes
router.get('/cpt/search', async (req, res) => {
    try {
        const { query, minFee, maxFee } = req.query;

        let results = [...CPT_CODES];

        if (query) {
            const searchTerm = query.toLowerCase();
            results = results.filter(code =>
                code.code.toLowerCase().includes(searchTerm) ||
                code.description.toLowerCase().includes(searchTerm)
            );
        }

        if (minFee) {
            results = results.filter(code => code.fee >= parseFloat(minFee));
        }

        if (maxFee) {
            results = results.filter(code => code.fee <= parseFloat(maxFee));
        }

        res.json({
            success: true,
            total: results.length,
            codes: results
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 10. Appeal Denied Claim
router.post('/claims/:claimId/appeal', async (req, res) => {
    try {
        const { claimId } = req.params;
        const { appealReason, supportingDocuments } = req.body;

        const claim = sampleClaims.find(c => c.claimId === claimId);

        if (!claim) {
            return res.status(404).json({
                success: false,
                error: 'Claim not found'
            });
        }

        if (claim.status !== 'DENIED') {
            return res.status(400).json({
                success: false,
                error: 'Only denied claims can be appealed'
            });
        }

        // Update claim with appeal info
        claim.appealStatus = 'SUBMITTED';
        claim.appealDate = new Date().toISOString().split('T')[0];
        claim.appealReason = appealReason;
        claim.appealDocuments = supportingDocuments || [];

        res.json({
            success: true,
            message: 'Appeal submitted successfully',
            claim,
            estimatedReviewDays: 30
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 11. Get Denial Reasons Summary
router.get('/denial-analysis', async (req, res) => {
    try {
        const deniedClaims = sampleClaims.filter(c => c.status === 'DENIED');

        const denialReasons = {};
        deniedClaims.forEach(claim => {
            const reason = claim.denialReason || 'Unknown';
            denialReasons[reason] = (denialReasons[reason] || 0) + 1;
        });

        const topReasons = Object.entries(denialReasons)
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            totalDenials: deniedClaims.length,
            topReasons,
            denialsByPayer: INSURANCE_PAYERS.map(payer => ({
                payerId: payer.payerId,
                payerName: payer.name,
                denials: deniedClaims.filter(c => c.payerId === payer.payerId).length
            }))
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 12. Batch Claim Status Check
router.post('/batch-status-check', async (req, res) => {
    try {
        const { claimIds } = req.body;

        const results = claimIds.map(claimId => {
            const claim = sampleClaims.find(c => c.claimId === claimId);
            return claim ? {
                claimId: claim.claimId,
                status: claim.status,
                paidAmount: claim.paidAmount || 0,
                denialReason: claim.denialReason || null
            } : {
                claimId,
                status: 'NOT_FOUND',
                error: 'Claim not found'
            };
        });

        res.json({
            success: true,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
