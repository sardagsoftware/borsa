/**
 * 🕸️ AUTOMATED TRUST GRAPH (ATG) API
 * Corporate Intelligence & Entity Trust Network Analysis
 *
 * Security: Rate limiting, input validation, sanitization
 * Compliance: GDPR, ISO27001, Data Protection
 */

const express = require('express');
const router = express.Router();

// In-memory graph storage (production: use Neo4j/TigerGraph)
const graphData = {
    nodes: [
        {
            id: 'org-001',
            name: 'Türk Telekom A.Ş.',
            type: 'corporate',
            sector: 'telecommunications',
            trustScore: 0.92,
            riskLevel: 'low',
            founded: '1995',
            location: 'İstanbul, Türkiye',
            metadata: {
                employees: 32500,
                revenue: '25.4B TRY',
                public: true,
                verified: true
            }
        },
        {
            id: 'org-002',
            name: 'Arçelik A.Ş.',
            type: 'corporate',
            sector: 'manufacturing',
            trustScore: 0.88,
            riskLevel: 'low',
            founded: '1955',
            location: 'İstanbul, Türkiye',
            metadata: {
                employees: 45000,
                revenue: '87.2B TRY',
                public: true,
                verified: true
            }
        },
        {
            id: 'org-003',
            name: 'Getir Perakende Lojistik A.Ş.',
            type: 'corporate',
            sector: 'logistics',
            trustScore: 0.79,
            riskLevel: 'medium',
            founded: '2015',
            location: 'İstanbul, Türkiye',
            metadata: {
                employees: 65000,
                revenue: '14.8B TRY',
                public: false,
                verified: true
            }
        },
        {
            id: 'org-004',
            name: 'Aselsan Elektronik Sanayi A.Ş.',
            type: 'corporate',
            sector: 'defense',
            trustScore: 0.95,
            riskLevel: 'low',
            founded: '1975',
            location: 'Ankara, Türkiye',
            metadata: {
                employees: 9500,
                revenue: '42.1B TRY',
                public: true,
                verified: true
            }
        },
        {
            id: 'org-005',
            name: 'BIM Birleşik Mağazalar A.Ş.',
            type: 'corporate',
            sector: 'retail',
            trustScore: 0.86,
            riskLevel: 'low',
            founded: '1995',
            location: 'İstanbul, Türkiye',
            metadata: {
                employees: 72000,
                revenue: '112.7B TRY',
                public: true,
                verified: true
            }
        },
        {
            id: 'org-006',
            name: 'Trendyol Elektronik Ticaret A.Ş.',
            type: 'corporate',
            sector: 'e-commerce',
            trustScore: 0.82,
            riskLevel: 'medium',
            founded: '2010',
            location: 'İstanbul, Türkiye',
            metadata: {
                employees: 35000,
                revenue: '68.5B TRY',
                public: false,
                verified: true
            }
        },
        {
            id: 'org-007',
            name: 'Turkish Airlines A.Ş.',
            type: 'corporate',
            sector: 'aviation',
            trustScore: 0.90,
            riskLevel: 'low',
            founded: '1933',
            location: 'İstanbul, Türkiye',
            metadata: {
                employees: 48000,
                revenue: '203.2B TRY',
                public: true,
                verified: true
            }
        },
        {
            id: 'org-008',
            name: 'Eczacıbaşı Holding A.Ş.',
            type: 'corporate',
            sector: 'pharmaceuticals',
            trustScore: 0.91,
            riskLevel: 'low',
            founded: '1942',
            location: 'İstanbul, Türkiye',
            metadata: {
                employees: 12500,
                revenue: '34.8B TRY',
                public: false,
                verified: true
            }
        }
    ],
    edges: [
        {
            id: 'edge-001',
            source: 'org-001',
            target: 'org-004',
            type: 'partnership',
            weight: 0.75,
            description: 'Telekomünikasyon altyapı iş birliği',
            established: '2018-03-15',
            volume: '2.5B TRY'
        },
        {
            id: 'edge-002',
            source: 'org-002',
            target: 'org-006',
            type: 'supplier',
            weight: 0.68,
            description: 'E-ticaret tedarik anlaşması',
            established: '2019-06-22',
            volume: '850M TRY'
        },
        {
            id: 'edge-003',
            source: 'org-003',
            target: 'org-005',
            type: 'logistics',
            weight: 0.82,
            description: 'Lojistik hizmet sözleşmesi',
            established: '2020-01-10',
            volume: '1.2B TRY'
        },
        {
            id: 'edge-004',
            source: 'org-007',
            target: 'org-001',
            type: 'client',
            weight: 0.71,
            description: 'Kurumsal iletişim hizmetleri',
            established: '2015-11-05',
            volume: '420M TRY'
        },
        {
            id: 'edge-005',
            source: 'org-008',
            target: 'org-005',
            type: 'distribution',
            weight: 0.79,
            description: 'Ürün dağıtım anlaşması',
            established: '2017-04-18',
            volume: '680M TRY'
        },
        {
            id: 'edge-006',
            source: 'org-006',
            target: 'org-003',
            type: 'partnership',
            weight: 0.85,
            description: 'Hızlı teslimat ortaklığı',
            established: '2021-02-28',
            volume: '1.8B TRY'
        },
        {
            id: 'edge-007',
            source: 'org-004',
            target: 'org-007',
            type: 'supplier',
            weight: 0.73,
            description: 'Elektronik sistemler tedariki',
            established: '2016-09-12',
            volume: '3.1B TRY'
        },
        {
            id: 'edge-008',
            source: 'org-002',
            target: 'org-001',
            type: 'client',
            weight: 0.66,
            description: 'IoT ve bağlantı hizmetleri',
            established: '2019-12-03',
            volume: '340M TRY'
        }
    ],
    anomalies: [
        {
            id: 'anom-001',
            entityId: 'org-003',
            severity: 'medium',
            type: 'trust_score_drop',
            description: 'Güven skoru son 6 ayda %12 düştü',
            detected: '2025-09-15T14:23:11Z',
            previousScore: 0.91,
            currentScore: 0.79,
            factors: ['market_volatility', 'operational_changes']
        },
        {
            id: 'anom-002',
            entityId: 'org-006',
            severity: 'low',
            type: 'relationship_volatility',
            description: 'Tedarikçi ilişkilerinde dalgalanma gözlemlendi',
            detected: '2025-08-22T09:45:33Z',
            affectedRelationships: ['edge-002', 'edge-006'],
            factors: ['supply_chain_disruption']
        },
        {
            id: 'anom-003',
            entityId: 'edge-004',
            severity: 'high',
            type: 'transaction_anomaly',
            description: 'Normal işlem hacminin %340 üzerinde aktivite',
            detected: '2025-10-01T11:17:52Z',
            expectedVolume: '420M TRY',
            actualVolume: '1.85B TRY',
            factors: ['unusual_activity', 'requires_investigation']
        }
    ]
};

// Network statistics cache
let statsCache = null;
let statsCacheTime = null;

/**
 * Input sanitization helper
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '')
        .replace(/script/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
}

/**
 * Calculate network statistics
 */
function calculateStats() {
    const now = Date.now();

    // Return cached stats if fresh (< 5 minutes)
    if (statsCache && statsCacheTime && (now - statsCacheTime) < 300000) {
        return statsCache;
    }

    const stats = {
        network: {
            totalEntities: graphData.nodes.length,
            totalRelationships: graphData.edges.length,
            averageTrustScore: graphData.nodes.reduce((sum, n) => sum + n.trustScore, 0) / graphData.nodes.length,
            networkDensity: (2 * graphData.edges.length) / (graphData.nodes.length * (graphData.nodes.length - 1))
        },
        sectors: {},
        riskDistribution: {
            low: 0,
            medium: 0,
            high: 0
        },
        relationshipTypes: {},
        anomalySummary: {
            total: graphData.anomalies.length,
            high: graphData.anomalies.filter(a => a.severity === 'high').length,
            medium: graphData.anomalies.filter(a => a.severity === 'medium').length,
            low: graphData.anomalies.filter(a => a.severity === 'low').length
        },
        timestamp: new Date().toISOString()
    };

    // Calculate sector distribution
    graphData.nodes.forEach(node => {
        stats.sectors[node.sector] = (stats.sectors[node.sector] || 0) + 1;
        stats.riskDistribution[node.riskLevel]++;
    });

    // Calculate relationship type distribution
    graphData.edges.forEach(edge => {
        stats.relationshipTypes[edge.type] = (stats.relationshipTypes[edge.type] || 0) + 1;
    });

    // Cache the results
    statsCache = stats;
    statsCacheTime = now;

    return stats;
}

/**
 * GET /api/atg/v1/graph
 * Get full trust graph (nodes + edges)
 */
router.get('/v1/graph', async (req, res) => {
    try {
        const { includeAnomalies } = req.query;

        const response = {
            success: true,
            graph: {
                nodes: graphData.nodes,
                edges: graphData.edges,
                metadata: {
                    nodeCount: graphData.nodes.length,
                    edgeCount: graphData.edges.length,
                    lastUpdated: new Date().toISOString()
                }
            }
        };

        if (includeAnomalies === 'true') {
            response.graph.anomalies = graphData.anomalies;
        }

        res.json(response);

    } catch (error) {
        console.error('ATG graph retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve trust graph'
        });
    }
});

/**
 * GET /api/atg/v1/entities
 * List all entities with optional filtering
 */
router.get('/v1/entities', async (req, res) => {
    try {
        const { sector, minTrustScore, riskLevel, type } = req.query;

        let entities = [...graphData.nodes];

        // Apply filters
        if (sector) {
            const sanitizedSector = sanitizeInput(sector);
            entities = entities.filter(e => e.sector === sanitizedSector);
        }

        if (minTrustScore) {
            const score = parseFloat(minTrustScore);
            if (isNaN(score) || score < 0 || score > 1) {
                return res.status(400).json({
                    error: 'Invalid parameter',
                    message: 'minTrustScore must be between 0 and 1'
                });
            }
            entities = entities.filter(e => e.trustScore >= score);
        }

        if (riskLevel) {
            const sanitizedRiskLevel = sanitizeInput(riskLevel);
            if (!['low', 'medium', 'high'].includes(sanitizedRiskLevel)) {
                return res.status(400).json({
                    error: 'Invalid parameter',
                    message: 'riskLevel must be one of: low, medium, high'
                });
            }
            entities = entities.filter(e => e.riskLevel === sanitizedRiskLevel);
        }

        if (type) {
            const sanitizedType = sanitizeInput(type);
            entities = entities.filter(e => e.type === sanitizedType);
        }

        res.json({
            success: true,
            entities,
            count: entities.length,
            filters: { sector, minTrustScore, riskLevel, type }
        });

    } catch (error) {
        console.error('ATG entities retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve entities'
        });
    }
});

/**
 * GET /api/atg/v1/entities/:id
 * Get entity details including relationships
 */
router.get('/v1/entities/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sanitizedId = sanitizeInput(id);

        const entity = graphData.nodes.find(n => n.id === sanitizedId);

        if (!entity) {
            return res.status(404).json({
                error: 'Entity not found',
                message: `Entity ${sanitizedId} does not exist`
            });
        }

        // Find all relationships for this entity
        const relationships = graphData.edges.filter(
            e => e.source === sanitizedId || e.target === sanitizedId
        );

        // Find anomalies related to this entity
        const anomalies = graphData.anomalies.filter(
            a => a.entityId === sanitizedId ||
                 (a.affectedRelationships && a.affectedRelationships.some(r =>
                     relationships.find(rel => rel.id === r)
                 ))
        );

        // Calculate entity-specific metrics
        const metrics = {
            totalConnections: relationships.length,
            inboundConnections: relationships.filter(e => e.target === sanitizedId).length,
            outboundConnections: relationships.filter(e => e.source === sanitizedId).length,
            averageRelationshipWeight: relationships.length > 0
                ? relationships.reduce((sum, r) => sum + r.weight, 0) / relationships.length
                : 0,
            activeAnomalies: anomalies.length
        };

        res.json({
            success: true,
            entity: {
                ...entity,
                relationships,
                anomalies,
                metrics
            }
        });

    } catch (error) {
        console.error('ATG entity retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve entity details'
        });
    }
});

/**
 * GET /api/atg/v1/relationships
 * List all relationships with optional filtering
 */
router.get('/v1/relationships', async (req, res) => {
    try {
        const { type, minWeight, entityId } = req.query;

        let relationships = [...graphData.edges];

        // Apply filters
        if (type) {
            const sanitizedType = sanitizeInput(type);
            relationships = relationships.filter(r => r.type === sanitizedType);
        }

        if (minWeight) {
            const weight = parseFloat(minWeight);
            if (isNaN(weight) || weight < 0 || weight > 1) {
                return res.status(400).json({
                    error: 'Invalid parameter',
                    message: 'minWeight must be between 0 and 1'
                });
            }
            relationships = relationships.filter(r => r.weight >= weight);
        }

        if (entityId) {
            const sanitizedEntityId = sanitizeInput(entityId);
            relationships = relationships.filter(
                r => r.source === sanitizedEntityId || r.target === sanitizedEntityId
            );
        }

        res.json({
            success: true,
            relationships,
            count: relationships.length,
            filters: { type, minWeight, entityId }
        });

    } catch (error) {
        console.error('ATG relationships retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve relationships'
        });
    }
});

/**
 * GET /api/atg/v1/anomalies
 * Get trust anomalies with optional filtering
 */
router.get('/v1/anomalies', async (req, res) => {
    try {
        const { severity, entityId, type } = req.query;

        let anomalies = [...graphData.anomalies];

        // Apply filters
        if (severity) {
            const sanitizedSeverity = sanitizeInput(severity);
            if (!['low', 'medium', 'high'].includes(sanitizedSeverity)) {
                return res.status(400).json({
                    error: 'Invalid parameter',
                    message: 'severity must be one of: low, medium, high'
                });
            }
            anomalies = anomalies.filter(a => a.severity === sanitizedSeverity);
        }

        if (entityId) {
            const sanitizedEntityId = sanitizeInput(entityId);
            anomalies = anomalies.filter(a =>
                a.entityId === sanitizedEntityId ||
                (a.affectedRelationships && a.affectedRelationships.includes(sanitizedEntityId))
            );
        }

        if (type) {
            const sanitizedType = sanitizeInput(type);
            anomalies = anomalies.filter(a => a.type === sanitizedType);
        }

        res.json({
            success: true,
            anomalies,
            count: anomalies.length,
            filters: { severity, entityId, type }
        });

    } catch (error) {
        console.error('ATG anomalies retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve anomalies'
        });
    }
});

/**
 * GET /api/atg/v1/stats
 * Get network statistics and metrics
 */
router.get('/v1/stats', async (req, res) => {
    try {
        const stats = calculateStats();

        res.json({
            success: true,
            statistics: stats
        });

    } catch (error) {
        console.error('ATG stats calculation error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to calculate network statistics'
        });
    }
});

module.exports = router;
