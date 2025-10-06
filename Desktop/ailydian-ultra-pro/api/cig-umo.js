/**
 * 🚦 URBAN MOBILITY ORCHESTRATOR (UMO) API
 * Smart City Traffic Management & Route Planning
 *
 * Security: Rate limiting, input validation, error handling
 * Coverage: Istanbul metro, major roads, real-time traffic
 */

const express = require('express');
const router = express.Router();

// In-memory storage (production: use PostgreSQL/Redis)
const incidents = new Map();
let incidentCounter = 1;

// Istanbul Metro Lines
const METRO_LINES = {
    M1: { name: 'M1A Yenikapı-Atatürk Havalimanı', color: '#ED1C24', type: 'metro' },
    M1B: { name: 'M1B Yenikapı-Kirazlı', color: '#ED1C24', type: 'metro' },
    M2: { name: 'M2 Yenikapı-Hacıosman', color: '#00A650', type: 'metro' },
    M3: { name: 'M3 Kirazlı-Olimpiyat', color: '#00A99D', type: 'metro' },
    M4: { name: 'M4 Kadıköy-Tavşantepe', color: '#F18E00', type: 'metro' },
    M5: { name: 'M5 Üsküdar-Çekmeköy', color: '#702F8A', type: 'metro' },
    M6: { name: 'M6 Levent-Boğaziçi Ü./Hisarüstü', color: '#C1A04C', type: 'metro' },
    M7: { name: 'M7 Mecidiyeköy-Mahmutbey', color: '#E0328C', type: 'metro' },
    M9: { name: 'M9 Ataköy-İkitelli', color: '#662483', type: 'metro' },
    T1: { name: 'T1 Bağcılar-Kabataş', color: '#ED1C24', type: 'tram' },
    T4: { name: 'T4 Topkapı-Mescid-i Selam', color: '#F18E00', type: 'tram' },
    F1: { name: 'F1 Kabataş-Taksim', color: '#ED1C24', type: 'funicular' }
};

// Major Istanbul roads and highways
const MAJOR_ROADS = [
    { id: 'E5', name: 'E5 (D100)', from: 'Avrupa', to: 'Asya' },
    { id: 'TEM', name: 'TEM Otoyolu', from: 'Avrupa', to: 'Asya' },
    { id: 'FSM', name: 'Fatih Sultan Mehmet Köprüsü', from: 'Avrupa', to: 'Asya' },
    { id: 'BOGAZ', name: 'Boğaziçi Köprüsü', from: 'Avrupa', to: 'Asya' },
    { id: 'YSS', name: 'Yavuz Sultan Selim Köprüsü', from: 'Avrupa', to: 'Asya' },
    { id: 'SAHIL', name: 'Sahil Yolu', from: 'Kadıköy', to: 'Bostancı' }
];

// Istanbul districts for parking
const DISTRICTS = [
    'Kadıköy', 'Beşiktaş', 'Şişli', 'Beyoğlu', 'Fatih', 'Üsküdar',
    'Maltepe', 'Ataşehir', 'Bakırköy', 'Sarıyer', 'Beylikdüzü', 'Pendik'
];

/**
 * GET /api/umo/v1/traffic
 * Get real-time traffic data for map visualization
 */
router.get('/v1/traffic', async (req, res) => {
    try {
        const { area, includeHistory } = req.query;

        // Generate realistic Istanbul traffic data
        const trafficSegments = generateTrafficData(area);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            area: area || 'istanbul-all',
            segments: trafficSegments,
            summary: {
                total: trafficSegments.length,
                severe: trafficSegments.filter(s => s.congestionLevel === 'severe').length,
                high: trafficSegments.filter(s => s.congestionLevel === 'high').length,
                medium: trafficSegments.filter(s => s.congestionLevel === 'medium').length,
                low: trafficSegments.filter(s => s.congestionLevel === 'low').length
            }
        });

    } catch (error) {
        console.error('UMO traffic data error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve traffic data'
        });
    }
});

/**
 * GET /api/umo/v1/routes
 * Get available routes between two points
 */
router.get('/v1/routes', async (req, res) => {
    try {
        const { origin, destination, mode } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'origin and destination are required'
            });
        }

        // Generate route alternatives
        const routes = generateRoutes(origin, destination, mode);

        res.json({
            success: true,
            origin,
            destination,
            mode: mode || 'all',
            routes,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('UMO routes error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve routes'
        });
    }
});

/**
 * POST /api/umo/v1/routes/plan
 * Plan optimal route with detailed navigation
 */
router.post('/v1/routes/plan', async (req, res) => {
    try {
        const { origin, destination, mode, preferences } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'origin and destination are required'
            });
        }

        const validModes = ['car', 'transit', 'bike', 'walk'];
        if (mode && !validModes.includes(mode)) {
            return res.status(400).json({
                error: 'Invalid mode',
                message: `Mode must be one of: ${validModes.join(', ')}`
            });
        }

        // Generate optimal route with detailed steps
        const route = generateOptimalRoute(origin, destination, mode || 'car', preferences);

        res.json({
            success: true,
            route,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('UMO route planning error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to plan route'
        });
    }
});

/**
 * GET /api/umo/v1/transit
 * Get public transit status (metro, bus, ferry)
 */
router.get('/v1/transit', async (req, res) => {
    try {
        const { type, line } = req.query;

        const validTypes = ['metro', 'bus', 'ferry', 'tram', 'funicular'];
        if (type && !validTypes.includes(type)) {
            return res.status(400).json({
                error: 'Invalid type',
                message: `Type must be one of: ${validTypes.join(', ')}`
            });
        }

        // Generate transit status data
        const transitData = generateTransitStatus(type, line);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            transit: transitData
        });

    } catch (error) {
        console.error('UMO transit status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve transit status'
        });
    }
});

/**
 * GET /api/umo/v1/parking
 * Get parking availability across Istanbul
 */
router.get('/v1/parking', async (req, res) => {
    try {
        const { district, lat, lon, radius } = req.query;

        if (district && !DISTRICTS.includes(district)) {
            return res.status(400).json({
                error: 'Invalid district',
                message: `District must be one of: ${DISTRICTS.join(', ')}`
            });
        }

        if ((lat || lon) && (!lat || !lon)) {
            return res.status(400).json({
                error: 'Invalid coordinates',
                message: 'Both lat and lon are required for location-based search'
            });
        }

        // Generate parking data
        const parkingData = generateParkingData(district, lat, lon, radius);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            parking: parkingData
        });

    } catch (error) {
        console.error('UMO parking data error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve parking data'
        });
    }
});

/**
 * GET /api/umo/v1/congestion
 * Get congestion heatmap data
 */
router.get('/v1/congestion', async (req, res) => {
    try {
        const { area, resolution } = req.query;

        const validResolutions = ['low', 'medium', 'high'];
        const res_level = resolution || 'medium';

        if (!validResolutions.includes(res_level)) {
            return res.status(400).json({
                error: 'Invalid resolution',
                message: `Resolution must be one of: ${validResolutions.join(', ')}`
            });
        }

        // Generate heatmap data
        const heatmapData = generateCongestionHeatmap(area, res_level);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            area: area || 'istanbul-all',
            resolution: res_level,
            heatmap: heatmapData
        });

    } catch (error) {
        console.error('UMO congestion heatmap error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve congestion data'
        });
    }
});

/**
 * POST /api/umo/v1/incidents
 * Report traffic incident
 */
router.post('/v1/incidents', async (req, res) => {
    try {
        const { type, location, severity, description, reporter } = req.body;

        const validTypes = ['accident', 'construction', 'breakdown', 'closure', 'weather', 'other'];
        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({
                error: 'Invalid type',
                message: `Type must be one of: ${validTypes.join(', ')}`
            });
        }

        if (!location || !location.lat || !location.lon) {
            return res.status(400).json({
                error: 'Invalid location',
                message: 'Location with lat and lon is required'
            });
        }

        const validSeverity = ['low', 'medium', 'high', 'critical'];
        if (severity && !validSeverity.includes(severity)) {
            return res.status(400).json({
                error: 'Invalid severity',
                message: `Severity must be one of: ${validSeverity.join(', ')}`
            });
        }

        // Create incident
        const incidentId = `umo-incident-${incidentCounter++}`;
        const incident = {
            id: incidentId,
            type,
            location,
            severity: severity || 'medium',
            description: description || '',
            reporter: reporter || 'anonymous',
            status: 'active',
            reported: new Date().toISOString(),
            verified: false,
            votes: 0
        };

        incidents.set(incidentId, incident);

        res.status(201).json({
            success: true,
            incident: {
                id: incident.id,
                status: incident.status,
                reported: incident.reported
            }
        });

    } catch (error) {
        console.error('UMO incident report error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to report incident'
        });
    }
});

/**
 * Helper: Generate realistic Istanbul traffic data
 */
function generateTrafficData(area) {
    const segments = [];
    const now = new Date().getHours();
    const isRushHour = (now >= 7 && now <= 10) || (now >= 17 && now <= 20);

    // E5 Highway segments
    segments.push({
        segmentId: 'E5-001',
        from: 'Avcılar',
        to: 'Bakırköy',
        speed: isRushHour ? 25 : 60,
        freeFlowSpeed: 80,
        congestionLevel: isRushHour ? 'severe' : 'medium',
        length: 8.5,
        coordinates: [
            [28.7247, 40.9890],
            [28.8650, 40.9890]
        ]
    });

    segments.push({
        segmentId: 'E5-002',
        from: 'Bakırköy',
        to: 'Zeytinburnu',
        speed: isRushHour ? 20 : 55,
        freeFlowSpeed: 80,
        congestionLevel: isRushHour ? 'severe' : 'medium',
        length: 6.2,
        coordinates: [
            [28.8650, 40.9890],
            [28.9050, 40.9950]
        ]
    });

    // TEM Highway segments
    segments.push({
        segmentId: 'TEM-001',
        from: 'Hadımköy',
        to: 'İkitelli',
        speed: isRushHour ? 45 : 90,
        freeFlowSpeed: 110,
        congestionLevel: isRushHour ? 'high' : 'low',
        length: 12.3,
        coordinates: [
            [28.6500, 41.0800],
            [28.7800, 41.0700]
        ]
    });

    // Bosphorus bridges
    segments.push({
        segmentId: 'BOGAZ-001',
        from: 'Beşiktaş',
        to: 'Üsküdar',
        speed: isRushHour ? 30 : 70,
        freeFlowSpeed: 80,
        congestionLevel: isRushHour ? 'severe' : 'low',
        length: 1.56,
        coordinates: [
            [29.0073, 41.0392],
            [29.0197, 41.0416]
        ]
    });

    segments.push({
        segmentId: 'FSM-001',
        from: 'Kavacık',
        to: 'Hisarüstü',
        speed: isRushHour ? 40 : 85,
        freeFlowSpeed: 90,
        congestionLevel: isRushHour ? 'high' : 'low',
        length: 1.51,
        coordinates: [
            [29.0841, 41.0922],
            [29.0626, 41.1010]
        ]
    });

    return segments;
}

/**
 * Helper: Generate route alternatives
 */
function generateRoutes(origin, destination, mode) {
    const routes = [];

    // Car route via E5
    if (!mode || mode === 'car' || mode === 'all') {
        routes.push({
            id: 'route-car-1',
            origin,
            destination,
            distance: 18.5,
            duration: 35,
            mode: 'car',
            via: 'E5 Highway',
            polyline: [[28.9784, 41.0082], [29.0276, 41.0053], [29.0742, 41.0082]],
            trafficDelay: 8,
            toll: 12.50
        });
    }

    // Transit route via Metro
    if (!mode || mode === 'transit' || mode === 'all') {
        routes.push({
            id: 'route-transit-1',
            origin,
            destination,
            distance: 16.2,
            duration: 42,
            mode: 'transit',
            steps: [
                { type: 'walk', duration: 5, distance: 0.4 },
                { type: 'metro', line: 'M2', duration: 28, stops: 8 },
                { type: 'walk', duration: 9, distance: 0.7 }
            ],
            polyline: [[28.9784, 41.0082], [29.0050, 41.0150], [29.0742, 41.0082]],
            fare: 15.00
        });
    }

    // Bike route
    if (!mode || mode === 'bike' || mode === 'all') {
        routes.push({
            id: 'route-bike-1',
            origin,
            destination,
            distance: 14.8,
            duration: 58,
            mode: 'bike',
            polyline: [[28.9784, 41.0082], [28.9950, 41.0200], [29.0742, 41.0082]],
            elevation: { gain: 120, loss: 95 }
        });
    }

    return routes;
}

/**
 * Helper: Generate optimal route with detailed steps
 */
function generateOptimalRoute(origin, destination, mode, preferences) {
    const route = {
        id: `route-${mode}-optimal`,
        origin,
        destination,
        mode,
        distance: mode === 'car' ? 18.5 : mode === 'transit' ? 16.2 : mode === 'bike' ? 14.8 : 12.3,
        duration: mode === 'car' ? 35 : mode === 'transit' ? 42 : mode === 'bike' ? 58 : 75,
        polyline: [
            [28.9784, 41.0082],
            [29.0050, 41.0150],
            [29.0350, 41.0100],
            [29.0742, 41.0082]
        ],
        steps: [],
        warnings: [],
        timestamp: new Date().toISOString()
    };

    // Add mode-specific details
    if (mode === 'car') {
        route.steps = [
            { instruction: 'Start on Bağdat Caddesi', distance: 1.2, duration: 3 },
            { instruction: 'Turn right onto E5 Highway', distance: 12.5, duration: 22 },
            { instruction: 'Take exit 8 toward Kadıköy', distance: 2.8, duration: 6 },
            { instruction: 'Turn left onto destination street', distance: 2.0, duration: 4 }
        ];
        route.toll = 12.50;
        route.fuelCost = 45.80;
    } else if (mode === 'transit') {
        route.steps = [
            { type: 'walk', instruction: 'Walk to Kadıköy Metro Station', duration: 5, distance: 0.4 },
            { type: 'metro', line: 'M4', instruction: 'Take M4 toward Tavşantepe', duration: 18, stops: 5 },
            { type: 'transfer', instruction: 'Transfer to M2 at Ayrılık Çeşmesi', duration: 3 },
            { type: 'metro', line: 'M2', instruction: 'Take M2 toward Hacıosman', duration: 10, stops: 3 },
            { type: 'walk', instruction: 'Walk to destination', duration: 6, distance: 0.5 }
        ];
        route.fare = 15.00;
    }

    return route;
}

/**
 * Helper: Generate transit status data
 */
function generateTransitStatus(type, line) {
    const transitData = [];

    const linesToShow = line ? [line] : Object.keys(METRO_LINES);

    linesToShow.forEach(lineId => {
        const metroLine = METRO_LINES[lineId];
        if (!metroLine) return;

        const hasDelay = Math.random() > 0.85;
        const delayMinutes = hasDelay ? Math.floor(Math.random() * 8) + 2 : 0;

        transitData.push({
            line: lineId,
            name: metroLine.name,
            type: metroLine.type,
            color: metroLine.color,
            status: hasDelay ? 'delayed' : 'on-time',
            delay: delayMinutes,
            nextArrival: Math.floor(Math.random() * 8) + 2,
            frequency: Math.floor(Math.random() * 5) + 5,
            crowdLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            operational: true
        });
    });

    return transitData;
}

/**
 * Helper: Generate parking data
 */
function generateParkingData(district, lat, lon, radius) {
    const parkingLots = [];
    const baseDistrict = district || DISTRICTS[Math.floor(Math.random() * DISTRICTS.length)];

    for (let i = 0; i < 8; i++) {
        const total = [100, 150, 200, 250, 300, 500][Math.floor(Math.random() * 6)];
        const occupancy = Math.random();
        const available = Math.floor(total * (1 - occupancy));

        parkingLots.push({
            id: `parking-${baseDistrict.toLowerCase()}-${i + 1}`,
            name: `${baseDistrict} Park ${i + 1}`,
            location: {
                district: baseDistrict,
                address: `${baseDistrict} Mahallesi, Park Sokak No:${i + 1}`,
                lat: 41.0082 + (Math.random() - 0.5) * 0.05,
                lon: 28.9784 + (Math.random() - 0.5) * 0.05
            },
            total,
            available,
            occupied: total - available,
            price: {
                hourly: [15, 20, 25, 30][Math.floor(Math.random() * 4)],
                daily: 120,
                monthly: 2500
            },
            type: ['outdoor', 'covered', 'underground'][Math.floor(Math.random() * 3)],
            features: ['security', 'ev-charging', 'disabled-access'].filter(() => Math.random() > 0.5),
            distance: lat && lon ? (Math.random() * 2).toFixed(2) : null
        });
    }

    return parkingLots;
}

/**
 * Helper: Generate congestion heatmap data
 */
function generateCongestionHeatmap(area, resolution) {
    const heatmapPoints = [];
    const gridSize = resolution === 'high' ? 50 : resolution === 'medium' ? 25 : 10;

    const now = new Date().getHours();
    const isRushHour = (now >= 7 && now <= 10) || (now >= 17 && now <= 20);

    // Generate grid of congestion points
    for (let i = 0; i < gridSize; i++) {
        const lat = 40.95 + (Math.random() * 0.15);
        const lon = 28.85 + (Math.random() * 0.35);

        // Higher intensity near major roads during rush hour
        const baseIntensity = isRushHour ? 0.5 : 0.2;
        const intensity = Math.min(1.0, baseIntensity + Math.random() * 0.5);

        heatmapPoints.push({
            lat,
            lon,
            intensity,
            weight: intensity * 100
        });
    }

    return {
        points: heatmapPoints,
        bounds: {
            north: 41.10,
            south: 40.95,
            east: 29.20,
            west: 28.85
        },
        lastUpdated: new Date().toISOString()
    };
}

module.exports = router;
