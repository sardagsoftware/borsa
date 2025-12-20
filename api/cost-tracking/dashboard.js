/**
 * 💰 Cost Tracking Dashboard API
 * Tracks Azure service costs, AI model usage costs, and provides budget alerts
 */

const express = require('express');
const router = express.Router();
const rbac = require('../../middleware/rbac');
const insightsService = require('../../azure-services/application-insights');

// In-memory cost tracking (will be replaced with database)
const costStore = {
  aiModels: {
    openai: { requests: 0, tokens: 0, cost: 0 },
    anthropic: { requests: 0, tokens: 0, cost: 0 },
    groq: { requests: 0, tokens: 0, cost: 0 },
    google: { requests: 0, tokens: 0, cost: 0 },
    mistral: { requests: 0, tokens: 0, cost: 0 },
    zhipu: { requests: 0, tokens: 0, cost: 0 },
    yi: { requests: 0, tokens: 0, cost: 0 }
  },
  azure: {
    openai: { requests: 0, cost: 0 },
    speech: { requests: 0, cost: 0 },
    storage: { gb: 0, cost: 0 },
    insights: { events: 0, cost: 0 }
  },
  daily: {},  // { '2025-10-02': { totalCost: 0, aiCost: 0, azureCost: 0 } }
  monthly: {} // { '2025-10': { totalCost: 0, budget: 1000, alertsSent: 0 } }
};

// AI Model Cost Rates (per 1K tokens)
const AI_COSTS = {
  'OX5C9E2B': { input: 0.03, output: 0.06 },
  'OX7A3F8D': { input: 0.01, output: 0.03 },
  'OX7A3F8D': { input: 0.005, output: 0.015 },
  'OX1D4A7F': { input: 0.0015, output: 0.002 },
  'AX9F7E2B': { input: 0.003, output: 0.015 },
  'AX4D8C1A': { input: 0.015, output: 0.075 },
  'AX9F7E2B-3-sonnet': { input: 0.003, output: 0.015 },
  'gemini-2.0-flash': { input: 0.00002, output: 0.00008 },
  'GE6D8A4F': { input: 0.0035, output: 0.01 },
  'GX4B7F3C': { input: 0.0007, output: 0.0007 },
  'MX7C4E9A': { input: 0.004, output: 0.012 },
  'GX9A5E1D': { input: 0.0005, output: 0.0008 },
  'yi-large': { input: 0.003, output: 0.003 },
  'glm-4': { input: 0.0015, output: 0.002 }
};

// Azure Service Costs (estimated)
const AZURE_COSTS = {
  openai: { requestCost: 0.0001 },
  speech: { minuteCost: 0.016 },
  storage: { gbMonthCost: 0.02 },
  insights: { eventCost: 0.0000001 }
};

/**
 * GET /api/cost-tracking/dashboard
 * Get comprehensive cost dashboard
 */
router.get('/dashboard', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Calculate total costs
    const aiTotalCost = Object.values(costStore.aiModels).reduce((sum, model) => sum + model.cost, 0);
    const azureTotalCost = Object.values(costStore.azure).reduce((sum, service) => sum + service.cost, 0);
    const totalCost = aiTotalCost + azureTotalCost;

    // Get monthly data
    if (!costStore.monthly[thisMonth]) {
      costStore.monthly[thisMonth] = {
        totalCost: 0,
        aiCost: 0,
        azureCost: 0,
        budget: 1000, // Default $1000 budget
        alertsSent: 0
      };
    }

    const monthlyData = costStore.monthly[thisMonth];
    monthlyData.totalCost = totalCost;
    monthlyData.aiCost = aiTotalCost;
    monthlyData.azureCost = azureTotalCost;

    const budgetUsage = (totalCost / monthlyData.budget) * 100;

    // Top 5 most expensive AI models
    const topModels = Object.entries(costStore.aiModels)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Daily trend (last 30 days)
    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyTrend.push({
        date: dateStr,
        cost: costStore.daily[dateStr]?.totalCost || 0
      });
    }

    // Cost optimization recommendations
    const recommendations = generateRecommendations(costStore);

    const dashboard = {
      summary: {
        totalCost: totalCost.toFixed(2),
        aiCost: aiTotalCost.toFixed(2),
        azureCost: azureTotalCost.toFixed(2),
        currency: 'USD',
        period: 'current_month'
      },
      budget: {
        limit: monthlyData.budget,
        spent: totalCost.toFixed(2),
        remaining: (monthlyData.budget - totalCost).toFixed(2),
        usage: budgetUsage.toFixed(1),
        status: budgetUsage > 90 ? 'critical' : budgetUsage > 75 ? 'warning' : 'healthy'
      },
      aiModels: {
        totalRequests: Object.values(costStore.aiModels).reduce((sum, m) => sum + m.requests, 0),
        totalTokens: Object.values(costStore.aiModels).reduce((sum, m) => sum + m.tokens, 0),
        totalCost: aiTotalCost.toFixed(2),
        topModels
      },
      azureServices: {
        totalCost: azureTotalCost.toFixed(2),
        services: Object.entries(costStore.azure).map(([name, data]) => ({
          name,
          ...data,
          cost: data.cost.toFixed(2)
        }))
      },
      trends: {
        daily: dailyTrend,
        monthlyTotal: totalCost.toFixed(2)
      },
      recommendations,
      alerts: generateAlerts(budgetUsage, monthlyData)
    };

    insightsService.trackEvent('Cost_Dashboard_Viewed', {
      userId: req.user.id,
      totalCost,
      budgetUsage: budgetUsage.toFixed(1)
    });

    res.json(dashboard);

  } catch (error) {
    console.error('Error fetching cost dashboard:', error);
    insightsService.trackException(error, { endpoint: '/api/cost-tracking/dashboard' });

    res.status(500).json({
      error: 'Failed to fetch cost dashboard',
      message: error.message
    });
  }
});

/**
 * POST /api/cost-tracking/ai-usage
 * Track AI model usage and calculate cost
 */
router.post('/ai-usage', (req, res) => {
  try {
    const { provider, model, inputTokens, outputTokens, metadata } = req.body;

    if (!provider || !model || !inputTokens) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate cost
    const modelCost = AI_COSTS[model] || { input: 0.003, output: 0.01 };
    const cost = ((inputTokens / 1000) * modelCost.input) + ((outputTokens / 1000) * modelCost.output);

    // Update store
    const providerLower = provider.toLowerCase();
    if (!costStore.aiModels[providerLower]) {
      costStore.aiModels[providerLower] = { requests: 0, tokens: 0, cost: 0 };
    }

    costStore.aiModels[providerLower].requests++;
    costStore.aiModels[providerLower].tokens += inputTokens + outputTokens;
    costStore.aiModels[providerLower].cost += cost;

    // Update daily cost
    const today = new Date().toISOString().split('T')[0];
    if (!costStore.daily[today]) {
      costStore.daily[today] = { totalCost: 0, aiCost: 0, azureCost: 0 };
    }
    costStore.daily[today].totalCost += cost;
    costStore.daily[today].aiCost += cost;

    // Track in Application Insights
    insightsService.trackAIModelUsage(
      model,
      provider,
      inputTokens + outputTokens,
      metadata?.duration || 0,
      cost
    );

    res.json({
      success: true,
      cost: cost.toFixed(4),
      currency: 'USD'
    });

  } catch (error) {
    console.error('Error tracking AI usage:', error);
    res.status(500).json({ error: 'Failed to track AI usage' });
  }
});

/**
 * POST /api/cost-tracking/azure-usage
 * Track Azure service usage
 */
router.post('/azure-usage', (req, res) => {
  try {
    const { service, usage, metadata } = req.body;

    if (!service || !usage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let cost = 0;

    // Calculate cost based on service
    switch (service) {
      case 'lydian-labs':
        cost = usage.requests * AZURE_COSTS.openai.requestCost;
        costStore.azure.openai.requests += usage.requests;
        break;
      case 'speech':
        cost = usage.minutes * AZURE_COSTS.speech.minuteCost;
        costStore.azure.speech.requests += usage.minutes;
        break;
      case 'storage':
        cost = usage.gb * AZURE_COSTS.storage.gbMonthCost;
        costStore.azure.storage.gb += usage.gb;
        break;
      case 'insights':
        cost = usage.events * AZURE_COSTS.insights.eventCost;
        costStore.azure.insights.events += usage.events;
        break;
    }

    costStore.azure[service].cost += cost;

    // Update daily cost
    const today = new Date().toISOString().split('T')[0];
    if (!costStore.daily[today]) {
      costStore.daily[today] = { totalCost: 0, aiCost: 0, azureCost: 0 };
    }
    costStore.daily[today].totalCost += cost;
    costStore.daily[today].azureCost += cost;

    res.json({
      success: true,
      cost: cost.toFixed(4),
      currency: 'USD'
    });

  } catch (error) {
    console.error('Error tracking Azure usage:', error);
    res.status(500).json({ error: 'Failed to track Azure usage' });
  }
});

/**
 * PUT /api/cost-tracking/budget
 * Update monthly budget limit
 */
router.put('/budget', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  try {
    const { budget } = req.body;

    if (!budget || budget <= 0) {
      return res.status(400).json({ error: 'Invalid budget amount' });
    }

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (!costStore.monthly[thisMonth]) {
      costStore.monthly[thisMonth] = {
        totalCost: 0,
        aiCost: 0,
        azureCost: 0,
        budget: budget,
        alertsSent: 0
      };
    } else {
      costStore.monthly[thisMonth].budget = budget;
    }

    insightsService.trackEvent('Budget_Updated', {
      userId: req.user.id,
      newBudget: budget,
      month: thisMonth
    });

    res.json({
      success: true,
      message: 'Budget updated successfully',
      budget,
      month: thisMonth
    });

  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

/**
 * GET /api/cost-tracking/export
 * Export cost data as CSV
 */
router.get('/export', rbac.requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  try {
    const { format = 'csv', period = 'current_month' } = req.query;

    // Generate CSV
    let csv = 'Date,AI Cost,Azure Cost,Total Cost\n';

    Object.entries(costStore.daily).forEach(([date, data]) => {
      csv += `${date},${data.aiCost.toFixed(2)},${data.azureCost.toFixed(2)},${data.totalCost.toFixed(2)}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cost-report-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);

    insightsService.trackEvent('Cost_Report_Exported', {
      userId: req.user.id,
      format,
      period
    });

  } catch (error) {
    console.error('Error exporting cost data:', error);
    res.status(500).json({ error: 'Failed to export cost data' });
  }
});

// Helper functions

function generateRecommendations(store) {
  const recommendations = [];

  // Check for expensive AI models
  Object.entries(store.aiModels).forEach(([name, data]) => {
    if (data.cost > 50 && data.requests > 0) {
      const avgCost = data.cost / data.requests;
      if (avgCost > 0.05) {
        recommendations.push({
          type: 'cost_optimization',
          severity: 'medium',
          message: `Consider using a cheaper alternative to ${name}. Average cost per request: $${avgCost.toFixed(3)}`,
          savings: (data.cost * 0.3).toFixed(2) // Estimated 30% savings
        });
      }
    }
  });

  // Check for high token usage
  const totalTokens = Object.values(store.aiModels).reduce((sum, m) => sum + m.tokens, 0);
  if (totalTokens > 1000000) {
    recommendations.push({
      type: 'optimization',
      severity: 'low',
      message: 'High token usage detected. Consider implementing prompt caching and response caching.',
      savings: '100-200'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'info',
      severity: 'low',
      message: 'Your cost usage is optimal. No recommendations at this time.',
      savings: '0'
    });
  }

  return recommendations;
}

function generateAlerts(budgetUsage, monthlyData) {
  const alerts = [];

  if (budgetUsage >= 90) {
    alerts.push({
      type: 'critical',
      message: `Budget usage is at ${budgetUsage.toFixed(1)}%. Immediate action required!`,
      timestamp: new Date().toISOString()
    });
  } else if (budgetUsage >= 75) {
    alerts.push({
      type: 'warning',
      message: `Budget usage is at ${budgetUsage.toFixed(1)}%. Consider reducing costs.`,
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}

// Export cost store for server integration
module.exports = router;
module.exports.costStore = costStore;
module.exports.AI_COSTS = AI_COSTS;
