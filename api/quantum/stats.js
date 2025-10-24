/**
 * 📊 QUANTUM STATS API ENDPOINT
 * =============================
 * GET /api/quantum/stats
 *
 * Purpose: Get Quantum Gateway usage statistics
 *
 * @author LyDian AI Team
 * @date 2024-10-24
 */

const { getQuantumGateway } = require('../../services/quantum-gateway');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only GET allowed
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Use GET to retrieve stats'
        });
    }

    try {
        // Get Quantum Gateway
        const quantum = getQuantumGateway();

        // Get stats
        const stats = quantum.getStats();

        // Prepare response
        const response = {
            success: true,
            data: {
                performance: {
                    totalJobs: stats.totalJobs,
                    successfulJobs: stats.successfulJobs,
                    failedJobs: stats.failedJobs,
                    successRate: stats.successRate
                },
                cache: {
                    hits: stats.cacheHits,
                    hitRate: stats.cacheHitRate
                },
                cost: {
                    total: `$${stats.totalCost.toFixed(2)}`,
                    breakdown: stats.deviceUsage
                },
                devices: stats.deviceUsage
            },
            meta: {
                timestamp: new Date().toISOString(),
                apiVersion: '1.0.0'
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Stats Error:', error);

        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
