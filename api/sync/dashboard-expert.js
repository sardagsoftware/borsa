/**
 * MEDICAL LYDIAN - DASHBOARD & EXPERT SYNCHRONIZATION API
 * Real-time data synchronization between Dashboard and Medical Expert
 *
 * Features:
 * - LocalStorage sync
 * - Real-time consultation data
 * - User session management
 * - Activity tracking
 * - Cross-page communication
 *
 * @version 1.0.0
 */

// Shared data store
const { getCorsOrigin } = require('../_middleware/cors');
const { applySanitization } = require('../_middleware/sanitize');
const syncStore = {
    activeConsultations: [],
    userSessions: [],
    recentActivities: [],
    systemStatus: {
        dashboardOnline: false,
        expertOnline: false,
        lastSync: null
    }
};

class SyncService {
    /**
     * Sync Consultation Data
     */
    static syncConsultation(consultationData) {
        const consultation = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...consultationData
        };

        syncStore.activeConsultations.push(consultation);

        // Keep only last 100 consultations
        if (syncStore.activeConsultations.length > 100) {
            syncStore.activeConsultations = syncStore.activeConsultations.slice(-100);
        }

        return consultation;
    }

    /**
     * Get Active Consultations
     */
    static getActiveConsultations() {
        return syncStore.activeConsultations.filter(c =>
            c.status === 'active' || c.status === 'in_progress'
        );
    }

    /**
     * Update System Status
     */
    static updateSystemStatus(source, status) {
        if (source === 'dashboard') {
            syncStore.systemStatus.dashboardOnline = status;
        } else if (source === 'expert') {
            syncStore.systemStatus.expertOnline = status;
        }
        syncStore.systemStatus.lastSync = new Date().toISOString();

        return syncStore.systemStatus;
    }

    /**
     * Get Sync Status
     */
    static getSyncStatus() {
        return {
            ...syncStore.systemStatus,
            activeConsultations: syncStore.activeConsultations.length,
            userSessions: syncStore.userSessions.length,
            recentActivities: syncStore.recentActivities.length
        };
    }

    /**
     * Add Recent Activity
     */
    static addActivity(activity) {
        const activityRecord = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...activity
        };

        syncStore.recentActivities.unshift(activityRecord);

        // Keep only last 50 activities
        if (syncStore.recentActivities.length > 50) {
            syncStore.recentActivities = syncStore.recentActivities.slice(0, 50);
        }

        return activityRecord;
    }

    /**
     * Get Recent Activities
     */
    static getRecentActivities(limit = 10) {
        return syncStore.recentActivities.slice(0, limit);
    }

    /**
     * Sync User Session
     */
    static syncUserSession(sessionData) {
        const session = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...sessionData
        };

        // Remove existing session for same user
        syncStore.userSessions = syncStore.userSessions.filter(
            s => s.userId !== sessionData.userId
        );

        syncStore.userSessions.push(session);

        return session;
    }

    /**
     * Get Active Sessions
     */
    static getActiveSessions() {
        const now = new Date();
        const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);

        return syncStore.userSessions.filter(s =>
            new Date(s.timestamp) > thirtyMinutesAgo
        );
    }

    /**
     * Generate Cross-Page Sync Data
     */
    static generateSyncData() {
        return {
            consultations: this.getActiveConsultations(),
            sessions: this.getActiveSessions(),
            activities: this.getRecentActivities(10),
            status: this.getSyncStatus(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Helper Methods
     */
    static generateId() {
        return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// API Handler
export default async function handler(req, res) {
  applySanitization(req, res);
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        const { action } = req.query;

        // Get Sync Status
        if (action === 'status') {
            const status = SyncService.getSyncStatus();
            return res.status(200).json({
                success: true,
                status
            });
        }

        // Get Active Consultations
        if (action === 'consultations') {
            const consultations = SyncService.getActiveConsultations();
            return res.status(200).json({
                success: true,
                count: consultations.length,
                consultations
            });
        }

        // Get Recent Activities
        if (action === 'activities') {
            const limit = parseInt(req.query.limit) || 10;
            const activities = SyncService.getRecentActivities(limit);
            return res.status(200).json({
                success: true,
                count: activities.length,
                activities
            });
        }

        // Get Active Sessions
        if (action === 'sessions') {
            const sessions = SyncService.getActiveSessions();
            return res.status(200).json({
                success: true,
                count: sessions.length,
                sessions
            });
        }

        // Get Full Sync Data
        if (action === 'sync') {
            const syncData = SyncService.generateSyncData();
            return res.status(200).json({
                success: true,
                data: syncData
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Dashboard-Expert Sync API',
            availableActions: ['status', 'consultations', 'activities', 'sessions', 'sync']
        });
    }

    if (req.method === 'POST') {
        const { action, data } = req.body;

        // Sync Consultation
        if (action === 'sync-consultation') {
            const consultation = SyncService.syncConsultation(data);
            return res.status(201).json({
                success: true,
                consultation
            });
        }

        // Update System Status
        if (action === 'update-status') {
            const status = SyncService.updateSystemStatus(data.source, data.online);
            return res.status(200).json({
                success: true,
                status
            });
        }

        // Add Activity
        if (action === 'add-activity') {
            const activity = SyncService.addActivity(data);
            return res.status(201).json({
                success: true,
                activity
            });
        }

        // Sync User Session
        if (action === 'sync-session') {
            const session = SyncService.syncUserSession(data);
            return res.status(201).json({
                success: true,
                session
            });
        }

        return res.status(400).json({
            success: false,
            error: 'Invalid action'
        });
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
}

// Initialize sample data
function initializeSampleData() {
    // Sample active consultations
    SyncService.syncConsultation({
        patientId: 'P001',
        doctorId: 'D001',
        specialty: 'Cardiology',
        status: 'active',
        startTime: new Date().toISOString(),
        messages: 12
    });

    SyncService.syncConsultation({
        patientId: 'P002',
        doctorId: 'D002',
        specialty: 'Oncology',
        status: 'active',
        startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        messages: 8
    });

    // Sample activities
    SyncService.addActivity({
        type: 'user_login',
        user: 'Dr. Sarah Johnson',
        source: 'dashboard',
        details: 'User logged in to dashboard'
    });

    SyncService.addActivity({
        type: 'consultation_start',
        user: 'Dr. Michael Chen',
        source: 'expert',
        details: 'Started cardiology consultation'
    });

    // Sample user session
    SyncService.syncUserSession({
        userId: 'admin@lydian.medical',
        source: 'dashboard',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
    });
}

// Initialize on first load
if (syncStore.activeConsultations.length === 0) {
    initializeSampleData();
}
