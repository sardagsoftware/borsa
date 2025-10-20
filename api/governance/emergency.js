/**
 * AI Governance - Emergency Controls & Kill-Switch
 * Circuit breakers, kill switches, and emergency model shutdown
 * Integrated into AILydian Ultra Pro
 */

const express = require('express');
const router = express.Router();

// In-memory storage for kill switches and circuit breakers
const killSwitches = new Map();
const circuitBreakers = new Map();
const emergencyLogs = [];

/**
 * POST /api/governance/emergency/kill-switch
 * Create a kill switch for a model
 */
router.post('/kill-switch', async (req, res) => {
  try {
    const { modelId, reason, triggeredBy } = req.body;

    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: modelId',
      });
    }

    const killSwitch = {
      id: `ks-${Date.now()}`,
      modelId,
      status: 'ACTIVE',
      reason: reason || 'Manual trigger',
      triggeredBy: triggeredBy || 'system',
      triggeredAt: new Date().toISOString(),
      affectedEndpoints: ['all'],
    };

    killSwitches.set(modelId, killSwitch);

    // Log the emergency action
    emergencyLogs.push({
      type: 'KILL_SWITCH_ACTIVATED',
      modelId,
      reason,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: killSwitch,
      message: `Kill switch activated for model ${modelId}`,
    });
  } catch (error) {
    console.error('Create kill switch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/governance/emergency/kill-switch/:modelId
 * Deactivate kill switch
 */
router.delete('/kill-switch/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const killSwitch = killSwitches.get(modelId);
    if (!killSwitch) {
      return res.status(404).json({
        success: false,
        error: 'Kill switch not found for this model',
      });
    }

    killSwitches.delete(modelId);

    // Log the deactivation
    emergencyLogs.push({
      type: 'KILL_SWITCH_DEACTIVATED',
      modelId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Kill switch deactivated for model ${modelId}`,
    });
  } catch (error) {
    console.error('Delete kill switch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/governance/emergency/kill-switch/:modelId
 * Check if kill switch is active for a model
 */
router.get('/kill-switch/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;

    const killSwitch = killSwitches.get(modelId);

    if (!killSwitch) {
      return res.json({
        success: true,
        data: {
          modelId,
          active: false,
          message: 'No kill switch active for this model',
        },
      });
    }

    res.json({
      success: true,
      data: {
        ...killSwitch,
        active: true,
      },
    });
  } catch (error) {
    console.error('Get kill switch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/governance/emergency/circuit-breaker
 * Create a circuit breaker for a model
 */
router.post('/circuit-breaker', async (req, res) => {
  try {
    const { modelId, name, threshold = 5, windowMs = 60000 } = req.body;

    if (!modelId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: modelId, name',
      });
    }

    const breakerId = `cb-${Date.now()}`;
    const circuitBreaker = {
      id: breakerId,
      modelId,
      name,
      threshold,
      windowMs,
      failureCount: 0,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      lastFailureAt: null,
      createdAt: new Date().toISOString(),
      trips: [],
    };

    circuitBreakers.set(breakerId, circuitBreaker);

    res.status(201).json({
      success: true,
      data: circuitBreaker,
      message: 'Circuit breaker created successfully',
    });
  } catch (error) {
    console.error('Create circuit breaker error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/governance/emergency/record-failure
 * Record a failure event for circuit breaker
 */
router.post('/record-failure', async (req, res) => {
  try {
    const { modelId, error } = req.body;

    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: modelId',
      });
    }

    // Find circuit breakers for this model
    const modelBreakers = Array.from(circuitBreakers.values()).filter(
      (cb) => cb.modelId === modelId
    );

    if (modelBreakers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No circuit breakers found for this model',
      });
    }

    const results = [];

    for (const breaker of modelBreakers) {
      breaker.failureCount++;
      breaker.lastFailureAt = new Date().toISOString();

      // Check if threshold exceeded
      if (breaker.failureCount >= breaker.threshold) {
        breaker.state = 'OPEN';
        breaker.trips.push({
          timestamp: new Date().toISOString(),
          failureCount: breaker.failureCount,
          error: error || 'Unknown error',
        });

        // Log the trip
        emergencyLogs.push({
          type: 'CIRCUIT_BREAKER_TRIPPED',
          modelId,
          breakerId: breaker.id,
          name: breaker.name,
          timestamp: new Date().toISOString(),
        });

        // Auto-activate kill switch if circuit breaker trips
        if (!killSwitches.has(modelId)) {
          const killSwitch = {
            id: `ks-${Date.now()}`,
            modelId,
            status: 'ACTIVE',
            reason: `Circuit breaker tripped: ${breaker.name}`,
            triggeredBy: 'circuit-breaker',
            triggeredAt: new Date().toISOString(),
            affectedEndpoints: ['all'],
          };
          killSwitches.set(modelId, killSwitch);
        }
      }

      circuitBreakers.set(breaker.id, breaker);
      results.push(breaker);
    }

    res.json({
      success: true,
      data: results,
      message: `Recorded failure for ${modelBreakers.length} circuit breaker(s)`,
    });
  } catch (error) {
    console.error('Record failure error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/governance/emergency/circuit-breaker/:breakerId/reset
 * Reset a circuit breaker
 */
router.post('/circuit-breaker/:breakerId/reset', async (req, res) => {
  try {
    const { breakerId } = req.params;

    const breaker = circuitBreakers.get(breakerId);
    if (!breaker) {
      return res.status(404).json({
        success: false,
        error: 'Circuit breaker not found',
      });
    }

    breaker.failureCount = 0;
    breaker.state = 'CLOSED';
    breaker.lastFailureAt = null;

    circuitBreakers.set(breakerId, breaker);

    // Log the reset
    emergencyLogs.push({
      type: 'CIRCUIT_BREAKER_RESET',
      breakerId,
      modelId: breaker.modelId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: breaker,
      message: 'Circuit breaker reset successfully',
    });
  } catch (error) {
    console.error('Reset circuit breaker error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/governance/emergency/status
 * Get overall emergency control status
 */
router.get('/status', async (req, res) => {
  try {
    const activeKillSwitches = Array.from(killSwitches.values());
    const allCircuitBreakers = Array.from(circuitBreakers.values());
    const openCircuitBreakers = allCircuitBreakers.filter((cb) => cb.state === 'OPEN');

    res.json({
      success: true,
      data: {
        summary: {
          activeKillSwitches: activeKillSwitches.length,
          totalCircuitBreakers: allCircuitBreakers.length,
          openCircuitBreakers: openCircuitBreakers.length,
          recentEmergencies: emergencyLogs.slice(-10).reverse(),
        },
        killSwitches: activeKillSwitches,
        circuitBreakers: allCircuitBreakers,
      },
    });
  } catch (error) {
    console.error('Get emergency status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/governance/emergency/logs
 * Get emergency action logs
 */
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, type } = req.query;

    let logs = [...emergencyLogs];

    // Filter by type if specified
    if (type) {
      logs = logs.filter((log) => log.type === type.toUpperCase());
    }

    // Reverse to show most recent first
    logs.reverse();

    // Limit results
    logs = logs.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        count: logs.length,
        logs,
      },
    });
  } catch (error) {
    console.error('Get emergency logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;
