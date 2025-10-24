/**
 * 🌌 QUANTUM VQE API ENDPOINT
 * ===========================
 * POST /api/quantum/vqe
 *
 * Purpose: Molecular simulation using VQE (Variational Quantum Eigensolver)
 *
 * Use Cases:
 * - Medical Expert: Drug molecule analysis
 * - Chemical simulations
 * - Material science
 *
 * @author LyDian AI Team
 * @date 2024-10-24
 */

const { getQuantumGateway } = require('../../services/quantum-gateway');

/**
 * Rate limiting configuration
 * Free tier: 10 requests/minute
 * Paid tier: 100 requests/minute
 */
const RATE_LIMIT = {
    free: { requests: 10, window: 60 * 1000 },
    paid: { requests: 100, window: 60 * 1000 }
};

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitStore = new Map();

function checkRateLimit(userId, tier = 'free') {
    const key = `${userId}:${tier}`;
    const now = Date.now();
    const limit = RATE_LIMIT[tier];

    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 0, resetTime: now + limit.window });
    }

    const userLimit = rateLimitStore.get(key);

    // Reset if window expired
    if (now >= userLimit.resetTime) {
        userLimit.count = 0;
        userLimit.resetTime = now + limit.window;
    }

    // Check limit
    if (userLimit.count >= limit.requests) {
        const resetIn = Math.ceil((userLimit.resetTime - now) / 1000);
        return {
            allowed: false,
            resetIn,
            message: `Rate limit exceeded. Try again in ${resetIn} seconds.`
        };
    }

    userLimit.count++;
    return { allowed: true };
}

/**
 * Main handler
 */
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only POST allowed
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Use POST to submit VQE job'
        });
    }

    try {
        const {
            molecule = 'H2',
            bondDistance = 0.735,
            device = 'auto',
            budget = 0.10,
            userId = 'anonymous'
        } = req.body;

        // Validate inputs
        if (!molecule || typeof molecule !== 'string') {
            return res.status(400).json({
                error: 'Invalid molecule',
                message: 'Molecule must be a valid chemical formula (e.g., H2, H2O, NH3)'
            });
        }

        if (bondDistance && (bondDistance < 0.1 || bondDistance > 5.0)) {
            return res.status(400).json({
                error: 'Invalid bond distance',
                message: 'Bond distance must be between 0.1 and 5.0 Angstroms'
            });
        }

        // Rate limiting
        const rateCheck = checkRateLimit(userId, 'free');
        if (!rateCheck.allowed) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: rateCheck.message,
                resetIn: rateCheck.resetIn
            });
        }

        // Get Quantum Gateway
        const quantum = getQuantumGateway();

        // Start timer
        const startTime = Date.now();

        // Run VQE
        const result = await quantum.runVQE({
            molecule,
            bondDistance,
            device,
            budget
        });

        // Calculate execution time
        const executionTime = Date.now() - startTime;

        // Prepare response
        const response = {
            success: true,
            data: {
                molecule,
                bondDistance,
                device: result.device,
                energy: result.output ? extractEnergy(result.output) : null,
                cost: result.cost,
                executionTime: `${executionTime}ms`,
                fromCache: result.fromCache || false
            },
            meta: {
                timestamp: new Date().toISOString(),
                apiVersion: '1.0.0',
                quantumProvider: 'BlueQubit'
            }
        };

        // Add raw output if requested
        if (req.query.verbose === 'true') {
            response.debug = {
                rawOutput: result.output,
                stats: quantum.getStats()
            };
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('VQE Error:', error);

        // Handle specific errors
        if (error.message.includes('budget')) {
            return res.status(400).json({
                error: 'Budget exceeded',
                message: error.message,
                suggestion: 'Try using device="cpu" (free) or increase budget'
            });
        }

        if (error.message.includes('API key')) {
            return res.status(500).json({
                error: 'Configuration error',
                message: 'BlueQubit API key not configured',
                suggestion: 'Contact administrator to configure BLUEQUBIT_API_KEY'
            });
        }

        // Generic error
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Extract energy value from VQE output
 *
 * @param {string} output - Raw VQE output
 * @returns {Object|null} Parsed energy data
 */
function extractEnergy(output) {
    if (!output || typeof output !== 'string') {
        return null;
    }

    try {
        // Extract Hartree energy
        const hartreeMatch = output.match(/Ground state energy:\s*([-\d.]+)\s*Hartree/);
        const hartree = hartreeMatch ? parseFloat(hartreeMatch[1]) : null;

        // Extract kcal/mol energy
        const kcalMatch = output.match(/Energy in pharma units:\s*([-\d.]+)\s*kcal\/mol/);
        const kcalMol = kcalMatch ? parseFloat(kcalMatch[1]) : null;

        return {
            hartree,
            kcalMol,
            unit: 'Hartree (primary), kcal/mol (pharma)'
        };
    } catch (error) {
        return null;
    }
}
