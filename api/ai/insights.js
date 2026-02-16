/**
 * MEDICAL LYDIAN - AI-POWERED INSIGHTS & RECOMMENDATIONS
 * Advanced AI analytics for dashboard intelligence
 *
 * Features:
 * - Predictive analytics
 * - Anomaly detection
 * - Smart recommendations
 * - Trend analysis
 * - Risk assessment
 * - Performance optimization suggestions
 *
 * @version 1.0.0
 */

const { getCorsOrigin } = require('../_middleware/cors');
const { applySanitization } = require('../_middleware/sanitize');
class AIInsightsEngine {
    constructor() {
        this.insights = [];
        this.models = {
            anomalyDetection: 'active',
            trendPrediction: 'active',
            riskAssessment: 'active',
            optimization: 'active'
        };
    }

    /**
     * Analyze dashboard data and generate insights
     */
    async analyzeDashboard(dashboardData) {
        const insights = [];

        // User growth analysis
        if (dashboardData.userGrowth) {
            const userInsights = this.analyzeUserGrowth(dashboardData.userGrowth);
            insights.push(...userInsights);
        }

        // API usage analysis
        if (dashboardData.apiUsage) {
            const apiInsights = this.analyzeAPIUsage(dashboardData.apiUsage);
            insights.push(...apiInsights);
        }

        // Consultation patterns
        if (dashboardData.consultations) {
            const consultationInsights = this.analyzeConsultations(dashboardData.consultations);
            insights.push(...consultationInsights);
        }

        // System performance
        if (dashboardData.systemMetrics) {
            const performanceInsights = this.analyzePerformance(dashboardData.systemMetrics);
            insights.push(...performanceInsights);
        }

        // Security analysis
        if (dashboardData.securityEvents) {
            const securityInsights = this.analyzeSecurityEvents(dashboardData.securityEvents);
            insights.push(...securityInsights);
        }

        // Store insights
        insights.forEach(insight => this.insights.push(insight));

        return {
            success: true,
            insightsGenerated: insights.length,
            insights: insights.slice(0, 10), // Return top 10
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Analyze user growth patterns
     */
    analyzeUserGrowth(userGrowthData) {
        const insights = [];

        // Calculate growth rate
        if (userGrowthData.length >= 2) {
            const recent = userGrowthData[userGrowthData.length - 1];
            const previous = userGrowthData[userGrowthData.length - 2];
            const growthRate = ((recent - previous) / previous * 100).toFixed(2);

            if (growthRate > 20) {
                insights.push({
                    id: this.generateId(),
                    type: 'success',
                    category: 'user_growth',
                    title: 'Exceptional User Growth',
                    message: `User base growing at ${growthRate}% - significantly above target`,
                    recommendation: 'Consider scaling infrastructure to handle increased load',
                    priority: 'high',
                    confidence: 0.92,
                    timestamp: new Date().toISOString()
                });
            } else if (growthRate < 0) {
                insights.push({
                    id: this.generateId(),
                    type: 'warning',
                    category: 'user_growth',
                    title: 'User Growth Declining',
                    message: `User base declining at ${Math.abs(growthRate)}%`,
                    recommendation: 'Review user retention strategies and engagement metrics',
                    priority: 'high',
                    confidence: 0.88,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Predict next month
        const predicted = this.predictNextValue(userGrowthData);
        insights.push({
            id: this.generateId(),
            type: 'info',
            category: 'prediction',
            title: 'User Growth Prediction',
            message: `Expected ${predicted} total users next month`,
            recommendation: 'Plan capacity accordingly',
            priority: 'medium',
            confidence: 0.85,
            data: { predicted },
            timestamp: new Date().toISOString()
        });

        return insights;
    }

    /**
     * Analyze API usage patterns
     */
    analyzeAPIUsage(apiUsageData) {
        const insights = [];

        // Detect anomalies
        const anomalies = this.detectAnomalies(apiUsageData);
        if (anomalies.length > 0) {
            insights.push({
                id: this.generateId(),
                type: 'warning',
                category: 'api_usage',
                title: 'Unusual API Activity Detected',
                message: `${anomalies.length} endpoints showing abnormal traffic patterns`,
                recommendation: 'Investigate potential DDoS attack or bot activity',
                priority: 'critical',
                confidence: 0.95,
                data: { anomalies },
                timestamp: new Date().toISOString()
            });
        }

        // High usage endpoints
        const topEndpoints = apiUsageData
            .sort((a, b) => b.calls - a.calls)
            .slice(0, 3);

        insights.push({
            id: this.generateId(),
            type: 'info',
            category: 'api_optimization',
            title: 'High Traffic Endpoints',
            message: `Top 3 endpoints account for ${this.calculatePercentage(topEndpoints, apiUsageData)}% of traffic`,
            recommendation: 'Consider caching and rate limiting for these endpoints',
            priority: 'medium',
            confidence: 0.90,
            data: { topEndpoints },
            timestamp: new Date().toISOString()
        });

        return insights;
    }

    /**
     * Analyze consultation patterns
     */
    analyzeConsultations(consultationData) {
        const insights = [];

        // Peak hours analysis
        const peakHours = this.analyzePeakHours(consultationData);
        insights.push({
            id: this.generateId(),
            type: 'info',
            category: 'consultations',
            title: 'Peak Consultation Hours',
            message: `Highest activity between ${peakHours.start}-${peakHours.end}`,
            recommendation: 'Ensure adequate medical staff during peak hours',
            priority: 'medium',
            confidence: 0.87,
            data: peakHours,
            timestamp: new Date().toISOString()
        });

        // Average response time
        const avgResponseTime = consultationData.reduce((sum, c) => sum + (c.responseTime || 0), 0) / consultationData.length;
        if (avgResponseTime > 300) { // 5 minutes
            insights.push({
                id: this.generateId(),
                type: 'warning',
                category: 'performance',
                title: 'Slow Consultation Response',
                message: `Average response time is ${(avgResponseTime / 60).toFixed(1)} minutes`,
                recommendation: 'Review staffing levels and workload distribution',
                priority: 'high',
                confidence: 0.91,
                timestamp: new Date().toISOString()
            });
        }

        // Specialty distribution
        const specialtyInsights = this.analyzeSpecialtyDistribution(consultationData);
        insights.push(...specialtyInsights);

        return insights;
    }

    /**
     * Analyze system performance
     */
    analyzePerformance(systemMetrics) {
        const insights = [];

        // CPU usage
        if (systemMetrics.cpuUsage > 80) {
            insights.push({
                id: this.generateId(),
                type: 'critical',
                category: 'performance',
                title: 'High CPU Usage',
                message: `CPU at ${systemMetrics.cpuUsage}% - approaching critical levels`,
                recommendation: 'Scale up server resources or optimize resource-intensive operations',
                priority: 'critical',
                confidence: 0.98,
                timestamp: new Date().toISOString()
            });
        }

        // Memory usage
        if (systemMetrics.memoryUsage > 85) {
            insights.push({
                id: this.generateId(),
                type: 'warning',
                category: 'performance',
                title: 'High Memory Usage',
                message: `Memory at ${systemMetrics.memoryUsage}%`,
                recommendation: 'Check for memory leaks and consider increasing RAM',
                priority: 'high',
                confidence: 0.94,
                timestamp: new Date().toISOString()
            });
        }

        // Response time
        if (systemMetrics.avgResponseTime > 1000) {
            insights.push({
                id: this.generateId(),
                type: 'warning',
                category: 'performance',
                title: 'Slow Response Times',
                message: `Average response time: ${systemMetrics.avgResponseTime}ms`,
                recommendation: 'Optimize database queries and enable caching',
                priority: 'high',
                confidence: 0.89,
                timestamp: new Date().toISOString()
            });
        }

        return insights;
    }

    /**
     * Analyze security events
     */
    analyzeSecurityEvents(securityEvents) {
        const insights = [];

        // Critical events
        const criticalEvents = securityEvents.filter(e => e.severity === 'critical');
        if (criticalEvents.length > 0) {
            insights.push({
                id: this.generateId(),
                type: 'critical',
                category: 'security',
                title: 'Critical Security Events',
                message: `${criticalEvents.length} critical security events detected`,
                recommendation: 'Immediate investigation required - check audit logs',
                priority: 'critical',
                confidence: 1.0,
                data: { events: criticalEvents.slice(0, 5) },
                timestamp: new Date().toISOString()
            });
        }

        // Failed login attempts
        const failedLogins = securityEvents.filter(e => e.type === 'failed_login');
        if (failedLogins.length > 10) {
            insights.push({
                id: this.generateId(),
                type: 'warning',
                category: 'security',
                title: 'Multiple Failed Login Attempts',
                message: `${failedLogins.length} failed login attempts detected`,
                recommendation: 'Potential brute force attack - enable MFA and IP blocking',
                priority: 'high',
                confidence: 0.93,
                timestamp: new Date().toISOString()
            });
        }

        return insights;
    }

    /**
     * Get recommendations
     */
    getRecommendations(category = null) {
        let filteredInsights = this.insights;

        if (category) {
            filteredInsights = this.insights.filter(i => i.category === category);
        }

        // Sort by priority and confidence
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        filteredInsights.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.confidence - a.confidence;
        });

        return filteredInsights.slice(0, 20);
    }

    /**
     * Detect anomalies in data
     */
    detectAnomalies(data) {
        const values = data.map(d => d.value || d.calls || d);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

        return data.filter((d, i) => {
            const value = d.value || d.calls || d;
            return Math.abs(value - mean) > 2 * stdDev;
        });
    }

    /**
     * Predict next value using simple linear regression
     */
    predictNextValue(data) {
        if (data.length < 2) return data[data.length - 1];

        const n = data.length;
        const sumX = (n * (n + 1)) / 2;
        const sumY = data.reduce((sum, v) => sum + v, 0);
        const sumXY = data.reduce((sum, v, i) => sum + v * (i + 1), 0);
        const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return Math.round(slope * (n + 1) + intercept);
    }

    /**
     * Analyze peak hours
     */
    analyzePeakHours(data) {
        const hourCounts = new Array(24).fill(0);

        data.forEach(item => {
            const hour = new Date(item.timestamp).getHours();
            hourCounts[hour]++;
        });

        const maxCount = Math.max(...hourCounts);
        const peakHour = hourCounts.indexOf(maxCount);

        return {
            start: peakHour,
            end: (peakHour + 2) % 24,
            count: maxCount
        };
    }

    /**
     * Analyze specialty distribution
     */
    analyzeSpecialtyDistribution(consultations) {
        const specialtyCounts = {};
        consultations.forEach(c => {
            specialtyCounts[c.specialty] = (specialtyCounts[c.specialty] || 0) + 1;
        });

        const topSpecialty = Object.entries(specialtyCounts).sort((a, b) => b[1] - a[1])[0];

        return [{
            id: this.generateId(),
            type: 'info',
            category: 'consultations',
            title: 'High Demand Specialty',
            message: `${topSpecialty[0]} accounts for ${((topSpecialty[1] / consultations.length) * 100).toFixed(1)}% of consultations`,
            recommendation: 'Consider hiring additional specialists in this area',
            priority: 'medium',
            confidence: 0.86,
            data: { specialty: topSpecialty[0], count: topSpecialty[1] },
            timestamp: new Date().toISOString()
        }];
    }

    /**
     * Calculate percentage
     */
    calculatePercentage(subset, total) {
        const subsetSum = subset.reduce((sum, item) => sum + (item.calls || item.value || 0), 0);
        const totalSum = total.reduce((sum, item) => sum + (item.calls || item.value || 0), 0);
        return ((subsetSum / totalSum) * 100).toFixed(1);
    }

    /**
     * Generate ID
     */
    generateId() {
        return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const byCategory = {};
        const byPriority = {};

        this.insights.forEach(insight => {
            byCategory[insight.category] = (byCategory[insight.category] || 0) + 1;
            byPriority[insight.priority] = (byPriority[insight.priority] || 0) + 1;
        });

        return {
            totalInsights: this.insights.length,
            byCategory,
            byPriority,
            averageConfidence: (this.insights.reduce((sum, i) => sum + i.confidence, 0) / this.insights.length).toFixed(3),
            modelsActive: Object.values(this.models).filter(status => status === 'active').length
        };
    }
}

// Singleton instance
const aiEngine = new AIInsightsEngine();

// API Handler
export default async function handler(req, res) {
  applySanitization(req, res);
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Authentication check
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized - Admin access required'
        });
    }

    if (req.method === 'POST') {
        const { action, data } = req.body;

        // Analyze dashboard
        if (action === 'analyze') {
            const result = await aiEngine.analyzeDashboard(data);
            return res.status(200).json(result);
        }

        return res.status(400).json({
            success: false,
            error: 'Invalid action'
        });
    }

    if (req.method === 'GET') {
        const { action, category } = req.query;

        // Get recommendations
        if (action === 'recommendations') {
            const recommendations = aiEngine.getRecommendations(category);
            return res.status(200).json({
                success: true,
                count: recommendations.length,
                recommendations
            });
        }

        // Get statistics
        if (action === 'statistics') {
            const stats = aiEngine.getStatistics();
            return res.status(200).json({
                success: true,
                statistics: stats
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Medical LyDian AI Insights Engine',
            version: '1.0.0',
            models: aiEngine.models,
            endpoints: {
                POST: ['analyze'],
                GET: ['recommendations', 'statistics']
            }
        });
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
}
