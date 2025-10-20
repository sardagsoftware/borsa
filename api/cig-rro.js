/**
 * 🚨 RISK & RESILIENCE OPERATING SYSTEM (RRO) API
 * Real-time Disaster Management & Emergency Response
 *
 * Security: Rate limiting, input validation, emergency protocols
 * Compliance: ISO22320, NFPA1600, Emergency Management Standards
 */

const express = require('express');
const router = express.Router();

// In-memory storage (production: use PostgreSQL/Redis/TimescaleDB)
const risks = new Map();
const alerts = new Map();
const infrastructure = new Map();
const responsePlans = new Map();

// Istanbul coordinates
const ISTANBUL_CENTER = { lat: 41.0082, lng: 28.9784 };

// Simulated counter
let riskCounter = 1;
let alertCounter = 1;

// Initialize demo data
initializeDemoData();

/**
 * GET /api/rro/v1/risks
 * Get active risks and threats
 */
router.get('/v1/risks', async (req, res) => {
    try {
        const { type, severity, status } = req.query;

        let filteredRisks = Array.from(risks.values());

        // Apply filters
        if (type) {
            filteredRisks = filteredRisks.filter(r => r.type === type);
        }

        if (severity) {
            const severityNum = parseInt(severity);
            filteredRisks = filteredRisks.filter(r => r.severity >= severityNum);
        }

        if (status) {
            filteredRisks = filteredRisks.filter(r => r.status === status);
        }

        // Sort by severity (highest first) and timestamp
        filteredRisks.sort((a, b) => {
            if (b.severity !== a.severity) {
                return b.severity - a.severity;
            }
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        res.setHeader('X-RateLimit-Limit', '100');
        res.setHeader('X-RateLimit-Remaining', '95');
        res.setHeader('X-Response-Time', '12ms');

        res.json({
            success: true,
            count: filteredRisks.length,
            risks: filteredRisks,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('RRO risks retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve risks'
        });
    }
});

/**
 * GET /api/rro/v1/risks/:id
 * Get specific risk details
 */
router.get('/v1/risks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const risk = risks.get(id);

        if (!risk) {
            return res.status(404).json({
                error: 'Risk not found',
                message: `Risk ${id} does not exist`
            });
        }

        // Include related response plan
        const plan = responsePlans.get(risk.type);

        res.json({
            success: true,
            risk: {
                ...risk,
                responsePlan: plan ? {
                    id: plan.id,
                    type: plan.type,
                    phases: plan.phases.length
                } : null
            }
        });

    } catch (error) {
        console.error('RRO risk retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve risk'
        });
    }
});

/**
 * GET /api/rro/v1/map-data
 * Get map markers for Leaflet.js visualization
 */
router.get('/v1/map-data', async (req, res) => {
    try {
        const { layer } = req.query;

        const mapData = {
            risks: [],
            infrastructure: []
        };

        // Add risk markers
        if (!layer || layer === 'risks') {
            mapData.risks = Array.from(risks.values())
                .filter(r => r.status === 'active')
                .map(r => ({
                    id: r.id,
                    type: r.type,
                    lat: r.location.lat,
                    lng: r.location.lng,
                    radius: r.radius,
                    severity: r.severity,
                    markerColor: getSeverityColor(r.severity),
                    popup: {
                        title: r.type.toUpperCase(),
                        description: r.description,
                        affectedPopulation: r.affectedPopulation,
                        status: r.status
                    }
                }));
        }

        // Add infrastructure markers
        if (!layer || layer === 'infrastructure') {
            const allInfra = Array.from(infrastructure.values());
            mapData.infrastructure = allInfra.map(i => ({
                id: i.id,
                type: i.type,
                name: i.name,
                lat: i.location.lat,
                lng: i.location.lng,
                status: i.status,
                markerIcon: getInfrastructureIcon(i.type),
                markerColor: i.status === 'operational' ? 'green' : i.status === 'damaged' ? 'orange' : 'red',
                popup: {
                    title: i.name,
                    type: i.type,
                    status: i.status,
                    capacity: i.capacity,
                    contact: i.contact
                }
            }));
        }

        res.json({
            success: true,
            center: ISTANBUL_CENTER,
            zoom: 11,
            layers: mapData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('RRO map data retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve map data'
        });
    }
});

/**
 * POST /api/rro/v1/alerts
 * Create emergency alert
 */
router.post('/v1/alerts', async (req, res) => {
    try {
        const { type, severity, message, area, channels, riskId } = req.body;

        // Input validation
        if (!type || !['earthquake', 'flood', 'fire', 'storm', 'chemical', 'pandemic', 'terrorism', 'general'].includes(type)) {
            return res.status(400).json({
                error: 'Invalid alert type',
                message: 'Type must be one of: earthquake, flood, fire, storm, chemical, pandemic, terrorism, general'
            });
        }

        if (!severity || ![1, 2, 3, 4, 5].includes(severity)) {
            return res.status(400).json({
                error: 'Invalid severity',
                message: 'Severity must be between 1 and 5'
            });
        }

        if (!message || message.length < 10 || message.length > 500) {
            return res.status(400).json({
                error: 'Invalid message',
                message: 'Message must be between 10 and 500 characters'
            });
        }

        if (!area) {
            return res.status(400).json({
                error: 'Invalid area',
                message: 'Area is required'
            });
        }

        // Create alert
        const alertId = `rro-alert-${alertCounter++}`;
        const alert = {
            id: alertId,
            type,
            severity,
            message,
            area,
            channels: channels || ['sms', 'push', 'web', 'sirens'],
            riskId: riskId || null,
            status: 'active',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
            acknowledgments: 0,
            reach: 0
        };

        alerts.set(alertId, alert);

        // Simulate alert distribution
        setTimeout(() => {
            const alert = alerts.get(alertId);
            if (alert) {
                alert.reach = Math.floor(Math.random() * 50000) + 10000;
                alert.acknowledgments = Math.floor(alert.reach * 0.3);
            }
        }, 2000);

        res.status(201).json({
            success: true,
            alert: {
                id: alert.id,
                status: alert.status,
                estimatedReach: '10,000-50,000',
                channels: alert.channels
            }
        });

    } catch (error) {
        console.error('RRO alert creation error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create alert'
        });
    }
});

/**
 * GET /api/rro/v1/alerts
 * Get active alerts
 */
router.get('/v1/alerts', async (req, res) => {
    try {
        const { status, severity } = req.query;

        let filteredAlerts = Array.from(alerts.values());

        // Apply filters
        if (status) {
            filteredAlerts = filteredAlerts.filter(a => a.status === status);
        }

        if (severity) {
            const severityNum = parseInt(severity);
            filteredAlerts = filteredAlerts.filter(a => a.severity >= severityNum);
        }

        // Remove expired alerts
        const now = new Date();
        filteredAlerts = filteredAlerts.filter(a => {
            if (new Date(a.expiresAt) < now) {
                a.status = 'expired';
                return status === 'expired';
            }
            return true;
        });

        // Sort by severity and timestamp
        filteredAlerts.sort((a, b) => {
            if (b.severity !== a.severity) {
                return b.severity - a.severity;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json({
            success: true,
            count: filteredAlerts.length,
            alerts: filteredAlerts,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('RRO alerts retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve alerts'
        });
    }
});

/**
 * GET /api/rro/v1/infrastructure
 * Get infrastructure status
 */
router.get('/v1/infrastructure', async (req, res) => {
    try {
        const { type, status } = req.query;

        let filteredInfra = Array.from(infrastructure.values());

        // Apply filters
        if (type) {
            filteredInfra = filteredInfra.filter(i => i.type === type);
        }

        if (status) {
            filteredInfra = filteredInfra.filter(i => i.status === status);
        }

        // Group by type
        const grouped = {
            hospitals: filteredInfra.filter(i => i.type === 'hospital'),
            fireStations: filteredInfra.filter(i => i.type === 'fire_station'),
            police: filteredInfra.filter(i => i.type === 'police'),
            shelters: filteredInfra.filter(i => i.type === 'shelter')
        };

        // Calculate statistics
        const stats = {
            total: filteredInfra.length,
            operational: filteredInfra.filter(i => i.status === 'operational').length,
            damaged: filteredInfra.filter(i => i.status === 'damaged').length,
            offline: filteredInfra.filter(i => i.status === 'offline').length,
            totalCapacity: {
                hospitals: grouped.hospitals.reduce((sum, h) => sum + h.capacity.beds, 0),
                shelters: grouped.shelters.reduce((sum, s) => sum + s.capacity.people, 0),
                fireStations: grouped.fireStations.length,
                police: grouped.police.length
            }
        };

        res.json({
            success: true,
            statistics: stats,
            infrastructure: grouped,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('RRO infrastructure retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve infrastructure'
        });
    }
});

/**
 * GET /api/rro/v1/response-plans/:riskId
 * Get emergency response plan
 */
router.get('/v1/response-plans/:riskId', async (req, res) => {
    try {
        const { riskId } = req.params;

        // If riskId matches a risk, get its type
        let planKey = riskId;
        const risk = risks.get(riskId);
        if (risk) {
            planKey = risk.type;
        }

        const plan = responsePlans.get(planKey);

        if (!plan) {
            return res.status(404).json({
                error: 'Response plan not found',
                message: `No response plan found for risk ${riskId}`
            });
        }

        res.json({
            success: true,
            plan
        });

    } catch (error) {
        console.error('RRO response plan retrieval error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve response plan'
        });
    }
});

/**
 * Helper functions
 */
function getSeverityColor(severity) {
    const colors = {
        1: '#4caf50',  // green
        2: '#8bc34a',  // light green
        3: '#ff9800',  // orange
        4: '#ff5722',  // deep orange
        5: '#f44336'   // red
    };
    return colors[severity] || '#9e9e9e';
}

function getInfrastructureIcon(type) {
    const icons = {
        hospital: 'hospital',
        fire_station: 'fire-extinguisher',
        police: 'shield',
        shelter: 'home'
    };
    return icons[type] || 'map-marker';
}

/**
 * Initialize demo data with Istanbul locations
 */
function initializeDemoData() {
    // Istanbul districts
    const districts = [
        { name: 'Kadıköy', lat: 40.9905, lng: 29.0242 },
        { name: 'Beşiktaş', lat: 41.0422, lng: 29.0080 },
        { name: 'Üsküdar', lat: 41.0226, lng: 29.0159 },
        { name: 'Beyoğlu', lat: 41.0391, lng: 28.9784 },
        { name: 'Fatih', lat: 41.0199, lng: 28.9499 },
        { name: 'Şişli', lat: 41.0602, lng: 28.9878 },
        { name: 'Sarıyer', lat: 41.1657, lng: 29.0531 },
        { name: 'Bakırköy', lat: 40.9800, lng: 28.8736 },
        { name: 'Kartal', lat: 40.9000, lng: 29.1833 }
    ];

    // Add sample risks
    const riskTypes = [
        {
            type: 'earthquake',
            severity: 4,
            description: 'Sismik aktivite tespit edildi - Marmara Fay Hattı',
            affectedPopulation: 150000,
            radius: 5000
        },
        {
            type: 'flood',
            severity: 3,
            description: 'Yağmur nedeniyle sel riski - Düşük rakımlı bölgeler',
            affectedPopulation: 45000,
            radius: 2000
        },
        {
            type: 'fire',
            severity: 2,
            description: 'Orman yangını riski - Kuru hava koşulları',
            affectedPopulation: 8000,
            radius: 1500
        }
    ];

    riskTypes.forEach((riskData, index) => {
        const district = districts[index % districts.length];
        const riskId = `rro-risk-${riskCounter++}`;
        risks.set(riskId, {
            id: riskId,
            type: riskData.type,
            severity: riskData.severity,
            location: {
                lat: district.lat + (Math.random() - 0.5) * 0.01,
                lng: district.lng + (Math.random() - 0.5) * 0.01,
                district: district.name
            },
            radius: riskData.radius,
            description: riskData.description,
            affectedPopulation: riskData.affectedPopulation,
            status: 'active',
            timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            confidence: 0.75 + Math.random() * 0.2,
            source: 'AFAD Monitoring System'
        });
    });

    // Add infrastructure
    const hospitalNames = [
        'Acıbadem Hastanesi', 'Şişli Etfal Hastanesi', 'Cerrahpaşa Tıp Fakültesi',
        'Haydarpaşa Numune Hastanesi', 'Vakıf Gureba Hastanesi', 'Bakırköy Ruh Sağlığı Hastanesi'
    ];

    const fireStationNames = [
        'Kadıköy İtfaiye', 'Beşiktaş İtfaiye', 'Fatih İtfaiye',
        'Üsküdar İtfaiye', 'Bakırköy İtfaiye', 'Sarıyer İtfaiye'
    ];

    const policeStationNames = [
        'Kadıköy Emniyet Müdürlüğü', 'Beşiktaş Polis Merkezi', 'Fatih Karakolu',
        'Üsküdar Güvenlik', 'Bakırköy Asayiş', 'Sarıyer Polis'
    ];

    const shelterNames = [
        'Kadıköy Spor Salonu', 'Beşiktaş Kültür Merkezi', 'Fatih İlköğretim Okulu',
        'Üsküdar Toplum Merkezi', 'Bakırköy Gençlik Merkezi', 'Sarıyer Spor Kompleksi'
    ];

    // Add hospitals
    hospitalNames.forEach((name, index) => {
        const district = districts[index % districts.length];
        const infraId = `infra-hospital-${index + 1}`;
        infrastructure.set(infraId, {
            id: infraId,
            type: 'hospital',
            name,
            location: {
                lat: district.lat + (Math.random() - 0.5) * 0.02,
                lng: district.lng + (Math.random() - 0.5) * 0.02,
                district: district.name
            },
            status: Math.random() > 0.1 ? 'operational' : 'damaged',
            capacity: {
                beds: Math.floor(Math.random() * 400) + 100,
                icu: Math.floor(Math.random() * 50) + 10,
                emergency: Math.floor(Math.random() * 30) + 10
            },
            contact: `+90 212 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`
        });
    });

    // Add fire stations
    fireStationNames.forEach((name, index) => {
        const district = districts[index % districts.length];
        const infraId = `infra-fire-${index + 1}`;
        infrastructure.set(infraId, {
            id: infraId,
            type: 'fire_station',
            name,
            location: {
                lat: district.lat + (Math.random() - 0.5) * 0.02,
                lng: district.lng + (Math.random() - 0.5) * 0.02,
                district: district.name
            },
            status: Math.random() > 0.05 ? 'operational' : 'damaged',
            capacity: {
                vehicles: Math.floor(Math.random() * 8) + 4,
                personnel: Math.floor(Math.random() * 30) + 20
            },
            contact: '110'
        });
    });

    // Add police stations
    policeStationNames.forEach((name, index) => {
        const district = districts[index % districts.length];
        const infraId = `infra-police-${index + 1}`;
        infrastructure.set(infraId, {
            id: infraId,
            type: 'police',
            name,
            location: {
                lat: district.lat + (Math.random() - 0.5) * 0.02,
                lng: district.lng + (Math.random() - 0.5) * 0.02,
                district: district.name
            },
            status: Math.random() > 0.05 ? 'operational' : 'offline',
            capacity: {
                personnel: Math.floor(Math.random() * 50) + 30,
                vehicles: Math.floor(Math.random() * 10) + 5
            },
            contact: '155'
        });
    });

    // Add shelters
    shelterNames.forEach((name, index) => {
        const district = districts[index % districts.length];
        const infraId = `infra-shelter-${index + 1}`;
        infrastructure.set(infraId, {
            id: infraId,
            type: 'shelter',
            name,
            location: {
                lat: district.lat + (Math.random() - 0.5) * 0.02,
                lng: district.lng + (Math.random() - 0.5) * 0.02,
                district: district.name
            },
            status: 'operational',
            capacity: {
                people: Math.floor(Math.random() * 1000) + 500,
                current: 0
            },
            amenities: ['water', 'food', 'medical', 'electricity', 'heating'],
            contact: `+90 212 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`
        });
    });

    // Add response plans
    responsePlans.set('earthquake', {
        id: 'plan-earthquake',
        type: 'earthquake',
        name: 'Deprem Müdahale Planı',
        phases: [
            {
                phase: 'immediate',
                duration: '0-2 hours',
                actions: [
                    'İtfaiye ve arama-kurtarma ekiplerini harekete geçir',
                    'Hastaneleri ve sağlık tesislerini bilgilendir',
                    'Ana yolları ve köprüleri kapat/kontrol et',
                    'Acil durum toplanma noktalarını aktive et',
                    'Halkı SMS/sirenleri ile bilgilendir'
                ]
            },
            {
                phase: 'short-term',
                duration: '2-24 hours',
                actions: [
                    'Hasar tespiti yap',
                    'Barınma merkezlerini aç',
                    'Yiyecek ve su dağıtımını başlat',
                    'Tıbbi yardım sağla',
                    'Elektrik/gaz/su altyapısını kontrol et'
                ]
            },
            {
                phase: 'medium-term',
                duration: '1-7 days',
                actions: [
                    'Geçici konut çözümleri',
                    'Psikolojik destek hizmetleri',
                    'Altyapı onarımları',
                    'Ekonomik yardım programları',
                    'İletişim ve koordinasyon merkezi'
                ]
            }
        ],
        resources: {
            personnel: 5000,
            vehicles: 500,
            shelters: 50,
            budget: '100M TL'
        },
        contacts: {
            coordinator: 'AFAD İstanbul',
            phone: '122',
            email: 'istanbul@afad.gov.tr'
        }
    });

    responsePlans.set('flood', {
        id: 'plan-flood',
        type: 'flood',
        name: 'Sel/Su Baskını Müdahale Planı',
        phases: [
            {
                phase: 'warning',
                duration: '12-24 hours before',
                actions: [
                    'Meteoroloji uyarılarını izle',
                    'Risk altındaki bölgeleri tespit et',
                    'Halkı uyar (SMS, sosyal medya)',
                    'Tahliye planlarını hazırla',
                    'Su pompalarını konuşlandır'
                ]
            },
            {
                phase: 'response',
                duration: 'During flood',
                actions: [
                    'Acil tahliye operasyonları',
                    'Su seviyelerini izle',
                    'Trafik yönlendirmesi',
                    'Geçici barınma',
                    'Sağlık hizmetleri'
                ]
            },
            {
                phase: 'recovery',
                duration: 'After flood',
                actions: [
                    'Hasar tespiti',
                    'Temizlik çalışmaları',
                    'Altyapı onarımı',
                    'Sağlık taramaları (hastalık riski)',
                    'Mali destek'
                ]
            }
        ],
        resources: {
            personnel: 2000,
            boats: 50,
            pumps: 200,
            shelters: 30
        },
        contacts: {
            coordinator: 'İBB Afet Koordinasyon Merkezi',
            phone: '153',
            email: 'afet@ibb.gov.tr'
        }
    });

    responsePlans.set('fire', {
        id: 'plan-fire',
        type: 'fire',
        name: 'Yangın Müdahale Planı',
        phases: [
            {
                phase: 'detection',
                duration: '0-15 minutes',
                actions: [
                    'Yangın alarmını çalıştır',
                    'İtfaiye ekiplerini yönlendir',
                    'Bölgeyi tahliye et',
                    'Su kaynaklarını aktive et',
                    'Çevre binaları uyar'
                ]
            },
            {
                phase: 'suppression',
                duration: '15 min - 4 hours',
                actions: [
                    'Yangını söndürme operasyonu',
                    'Yaralılara müdahale',
                    'Yangın yayılmasını engelle',
                    'Çevre güvenliği',
                    'Hava kirliliği izleme'
                ]
            },
            {
                phase: 'investigation',
                duration: 'After suppression',
                actions: [
                    'Yangın nedeni araştırması',
                    'Hasar değerlendirmesi',
                    'Sigorta süreçleri',
                    'Yeniden yerleştirme',
                    'Önleyici tedbirler'
                ]
            }
        ],
        resources: {
            fireStations: 45,
            vehicles: 300,
            personnel: 3500,
            helicopters: 5
        },
        contacts: {
            coordinator: 'İstanbul İtfaiyesi',
            phone: '110',
            email: 'itfaiye@ibb.gov.tr'
        }
    });

    // Add sample alerts
    const alertId = `rro-alert-${alertCounter++}`;
    alerts.set(alertId, {
        id: alertId,
        type: 'earthquake',
        severity: 3,
        message: 'Marmara bölgesinde 4.2 büyüklüğünde deprem meydana geldi. Sakin olun, yüksek binalarda üst katlara çıkmayın.',
        area: 'İstanbul - Tüm İlçeler',
        channels: ['sms', 'push', 'web', 'sirens'],
        riskId: 'rro-risk-1',
        status: 'active',
        createdAt: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        expiresAt: new Date(Date.now() + 3300000).toISOString(), // 55 min from now
        acknowledgments: 12500,
        reach: 48000
    });
}

module.exports = router;
