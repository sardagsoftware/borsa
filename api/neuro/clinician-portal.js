/**
 * Clinician Portal Authentication & Validation API
 * For medical professional review of AI assessments
 */

const crypto = require('crypto');
const { createSecureError } = require('./_azure-config');

// Demo clinician database (in production: use LyDian Auth or database)
const DEMO_CLINICIANS = {
    'MD-123456': {
        name: 'Dr. Emily Chen',
        specialty: 'neurology',
        license: 'MD-123456',
        verified: true,
        institution: 'Stanford Medical Center',
        yearsExperience: 12
    },
    'RAD-789012': {
        name: 'Dr. Michael Rodriguez',
        specialty: 'radiology',
        license: 'RAD-789012',
        verified: true,
        institution: 'Mayo Clinic',
        yearsExperience: 15
    },
    'PSY-345678': {
        name: 'Dr. Sarah Johnson',
        specialty: 'psychiatry',
        license: 'PSY-345678',
        verified: true,
        institution: 'Johns Hopkins',
        yearsExperience: 10
    }
};

// Mock pending assessments queue
const PENDING_ASSESSMENTS = [
    {
        id: 2847,
        type: 'Brain Imaging Analysis',
        patientClusterId: 'SHA256-7f8a3b2c1d9e',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        aiFindings: 'Bilateral hippocampal atrophy detected (left: 15% volume loss, right: 12% volume loss). Mild periventricular white matter hyperintensities consistent with small vessel disease.',
        aiConfidence: 87,
        riskLevel: 'MODERATE',
        modality: 'MRI',
        status: 'pending'
    },
    {
        id: 2848,
        type: 'Neuro Risk Assessment',
        patientClusterId: 'SHA256-4c5d6e7f8g9h',
        submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        aiFindings: '10-year Alzheimer\'s risk: 32%. Family history positive, APOE4 heterozygous, hypertension present.',
        aiConfidence: 91,
        riskLevel: 'HIGH',
        status: 'pending'
    },
    {
        id: 2849,
        type: 'Digital Neuro-Twin',
        patientClusterId: 'SHA256-1a2b3c4d5e6f',
        submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        aiFindings: 'Brain age: 72 years (chronological: 65). Accelerated aging trajectory observed. Low cognitive reserve.',
        aiConfidence: 89,
        riskLevel: 'MODERATE',
        status: 'pending'
    }
];

// Clinician statistics (demo data)
function getClinicianStats(licenseNumber) {
    return {
        totalReviewed: 487,
        approvalRate: 92,
        avgResponseTime: '2.3h',
        rank: 8,
        recentActivity: {
            today: 5,
            thisWeek: 23,
            thisMonth: 87
        },
        specialtyBreakdown: {
            'imaging': 245,
            'riskAssessment': 156,
            'digitalTwin': 86
        }
    };
}

// Authentication
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Route handling
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // POST /api/neuro/clinician-portal - Authenticate
    if (req.method === 'POST' && (pathname === '/api/neuro/clinician-portal' || pathname === '/')) {
        try {
            const { licenseNumber, specialty } = req.body;

            if (!licenseNumber || !specialty) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'License number and specialty are required'
                });
            }

            // Verify clinician (in production: check against medical board database)
            const clinician = DEMO_CLINICIANS[licenseNumber];

            if (!clinician) {
                return res.status(401).json({
                    error: 'Authentication failed',
                    message: 'Invalid license number or clinician not found in database'
                });
            }

            if (clinician.specialty !== specialty) {
                return res.status(401).json({
                    error: 'Specialty mismatch',
                    message: 'License specialty does not match selected specialty'
                });
            }

            if (!clinician.verified) {
                return res.status(403).json({
                    error: 'Account not verified',
                    message: 'Your medical license is pending verification'
                });
            }

            // Generate session token (in production: use JWT with expiration)
            const sessionToken = crypto.randomBytes(32).toString('hex');

            // Get clinician stats
            const stats = getClinicianStats(licenseNumber);

            // Response
            res.status(200).json({
                success: true,
                authenticated: true,
                clinician: {
                    name: clinician.name,
                    specialty: clinician.specialty,
                    license: clinician.license,
                    institution: clinician.institution,
                    yearsExperience: clinician.yearsExperience
                },
                sessionToken,
                stats,
                permissions: [
                    'view_assessments',
                    'approve_assessments',
                    'revise_assessments',
                    'reject_assessments',
                    'view_analytics'
                ],
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Clinician authentication error:', error);
            return res.status(500).json(createSecureError(error));
        }
    }

    // GET /api/neuro/clinician-portal/queue - Get pending assessments
    else if (req.method === 'GET' && (pathname === '/api/neuro/clinician-portal/queue' || pathname === '/queue')) {
        try {
            // In production: verify session token from Authorization header

            res.status(200).json({
                success: true,
                pendingCount: PENDING_ASSESSMENTS.length,
                assessments: PENDING_ASSESSMENTS,
                filters: {
                    available: ['all', 'imaging', 'riskAssessment', 'digitalTwin'],
                    priority: ['all', 'high', 'moderate', 'low']
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Queue retrieval error:', error);
            return res.status(500).json(createSecureError(error));
        }
    }

    // POST /api/neuro/clinician-portal/validate - Validate assessment
    else if (req.method === 'POST' && (pathname === '/api/neuro/clinician-portal/validate' || pathname === '/validate')) {
        try {
            const { assessmentId, action, feedback } = req.body;

            if (!assessmentId || !action) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'Assessment ID and action are required'
                });
            }

            const validActions = ['approve', 'revise', 'reject'];
            if (!validActions.includes(action)) {
                return res.status(400).json({
                    error: 'Invalid action',
                    message: `Action must be one of: ${validActions.join(', ')}`
                });
            }

            // Find assessment
            const assessment = PENDING_ASSESSMENTS.find(a => a.id === parseInt(assessmentId));
            if (!assessment) {
                return res.status(404).json({
                    error: 'Assessment not found',
                    message: `No assessment found with ID: ${assessmentId}`
                });
            }

            // Update assessment status (in production: update database)
            assessment.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision_requested';
            assessment.validatedAt = new Date().toISOString();
            assessment.feedback = feedback;

            // Log validation for AI model improvement
            const validationLog = {
                assessmentId,
                action,
                feedback,
                aiConfidence: assessment.aiConfidence,
                clinicianFeedback: feedback,
                timestamp: new Date().toISOString()
            };

            console.log('[Clinician Validation]', validationLog);

            res.status(200).json({
                success: true,
                message: `Assessment #${assessmentId} ${action}d successfully`,
                assessment: {
                    id: assessment.id,
                    status: assessment.status,
                    validatedAt: assessment.validatedAt
                },
                aiModelUpdate: {
                    logged: true,
                    description: 'Feedback will be used for continuous model improvement'
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Assessment validation error:', error);
            return res.status(500).json(createSecureError(error));
        }
    }

    else {
        res.status(404).json({
            error: 'Endpoint not found',
            message: 'Invalid API endpoint'
        });
    }
};
