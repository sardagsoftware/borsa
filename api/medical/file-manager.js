/**
 * MEDICAL LYDIAN - FILE MANAGER WITH REAL DATABASE INTEGRATION
 * Complete file upload tracking and management system
 *
 * Features:
 * - Real database storage for all uploads
 * - User-specific file tracking
 * - Medical file metadata extraction
 * - Analysis session tracking
 * - Device detection integration
 * - Activity feed generation
 * - Upload statistics
 *
 * @version 2.0.0
 */

const { Client } = require('pg');
const formidable = require('formidable');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { optionalAuthenticate } = require('../auth/jwt-middleware');

class MedicalFileManager {
    constructor() {
        this.dbClient = null;
        this.uploadDir = process.env.UPLOAD_DIR || '/tmp/medical-uploads';
    }

    /**
     * Initialize database connection
     */
    async initDatabase() {
        if (!this.dbClient) {
            this.dbClient = new Client({
                connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });

            try {
                await this.dbClient.connect();
                console.log('✅ File Manager: Database connected');
            } catch (error) {
                console.error('❌ File Manager: Database connection failed:', error);
                throw error;
            }
        }
        return this.dbClient;
    }

    /**
     * Save uploaded file to database
     */
    async saveFileToDatabase(fileData, userId) {
        const db = await this.initDatabase();

        try {
            const result = await db.query(`
                INSERT INTO user_files (
                    id, user_id, filename, original_filename, file_path,
                    file_size, file_type, mime_type, is_medical, medical_type,
                    storage_provider, storage_path, status, upload_ip, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `, [
                fileData.id || uuidv4(),
                userId,
                fileData.filename,
                fileData.originalFilename,
                fileData.filepath,
                fileData.size,
                fileData.fileType,
                fileData.mimetype,
                fileData.isMedical || false,
                fileData.medicalType || null,
                'local',
                fileData.filepath,
                'uploaded',
                fileData.uploadIp || null,
                JSON.stringify(fileData.metadata || {})
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('Error saving file to database:', error);
            throw error;
        }
    }

    /**
     * Create analysis session record
     */
    async createAnalysisSession(fileId, userId, analysisType, modelUsed) {
        const db = await this.initDatabase();

        try {
            const sessionId = uuidv4();
            const result = await db.query(`
                INSERT INTO medical_analysis_sessions (
                    id, file_id, user_id, session_type, model_used,
                    analysis_type, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING *
            `, [
                sessionId,
                fileId,
                userId,
                analysisType,
                modelUsed,
                analysisType,
                'pending'
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('Error creating analysis session:', error);
            throw error;
        }
    }

    /**
     * Update analysis session with results
     */
    async updateAnalysisSession(sessionId, results) {
        const db = await this.initDatabase();

        try {
            await db.query(`
                UPDATE medical_analysis_sessions
                SET status = $1,
                    analysis_result = $2,
                    confidence_score = $3,
                    processing_time_ms = $4,
                    prompt_tokens = $5,
                    completion_tokens = $6,
                    total_tokens = $7,
                    completed_at = NOW()
                WHERE id = $8
            `, [
                results.status || 'completed',
                JSON.stringify(results.result || {}),
                results.confidence || null,
                results.processingTime || null,
                results.promptTokens || null,
                results.completionTokens || null,
                results.totalTokens || null,
                sessionId
            ]);

            // Update user stats
            const session = await db.query('SELECT user_id FROM medical_analysis_sessions WHERE id = $1', [sessionId]);
            if (session.rows.length > 0) {
                await this.updateUserStats(session.rows[0].user_id, {
                    aiAnalysesRun: 1,
                    successfulAnalyses: results.status === 'completed' ? 1 : 0,
                    failedAnalyses: results.status === 'failed' ? 1 : 0,
                    totalTokensUsed: results.totalTokens || 0
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating analysis session:', error);
            throw error;
        }
    }

    /**
     * Save device detection results
     */
    async saveDeviceDetection(fileId, deviceData, analysisSessionId = null) {
        const db = await this.initDatabase();

        try {
            const result = await db.query(`
                INSERT INTO medical_device_detections (
                    id, file_id, analysis_session_id, detected,
                    manufacturer, manufacturer_full_name, device_model,
                    device_type, device_serial, modality, modality_full,
                    study_description, station_name, institution_name,
                    software_versions, confidence, detection_method,
                    dicom_tags, raw_metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
                RETURNING *
            `, [
                uuidv4(),
                fileId,
                analysisSessionId,
                deviceData.detected || false,
                deviceData.manufacturer || null,
                deviceData.manufacturerFullName || null,
                deviceData.deviceModel || null,
                deviceData.deviceType || null,
                deviceData.deviceSerial || null,
                deviceData.modality || null,
                deviceData.modalityFull || null,
                deviceData.studyDescription || null,
                deviceData.stationName || null,
                deviceData.institutionName || null,
                deviceData.softwareVersions || null,
                deviceData.confidence || null,
                deviceData.detectionMethod || 'dicom_tags',
                JSON.stringify(deviceData.dicomTags || {}),
                JSON.stringify(deviceData.metadata || {})
            ]);

            // Update file with device info
            await db.query(`
                UPDATE user_files
                SET detected_device = $1, dicom_metadata = $2
                WHERE id = $3
            `, [
                JSON.stringify(deviceData),
                JSON.stringify(deviceData.dicomTags || {}),
                fileId
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('Error saving device detection:', error);
            throw error;
        }
    }

    /**
     * Get user files with pagination
     */
    async getUserFiles(userId, options = {}) {
        const db = await this.initDatabase();

        try {
            const limit = options.limit || 50;
            const offset = options.offset || 0;
            const medicalOnly = options.medicalOnly || false;

            let query = `
                SELECT
                    uf.*,
                    json_agg(
                        json_build_object(
                            'type', mas.session_type,
                            'status', mas.status,
                            'model', mas.model_used,
                            'created_at', mas.created_at
                        )
                    ) FILTER (WHERE mas.id IS NOT NULL) as analyses,
                    mdd.manufacturer,
                    mdd.device_model,
                    mdd.modality
                FROM user_files uf
                LEFT JOIN medical_analysis_sessions mas ON uf.id = mas.file_id
                LEFT JOIN medical_device_detections mdd ON uf.id = mdd.file_id
                WHERE uf.user_id = $1 AND uf.deleted_at IS NULL
            `;

            const params = [userId];

            if (medicalOnly) {
                query += ' AND uf.is_medical = TRUE';
            }

            query += `
                GROUP BY uf.id, mdd.manufacturer, mdd.device_model, mdd.modality
                ORDER BY uf.created_at DESC
                LIMIT $2 OFFSET $3
            `;

            params.push(limit, offset);

            const result = await db.query(query, params);

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM user_files
                WHERE user_id = $1 AND deleted_at IS NULL
                ${medicalOnly ? 'AND is_medical = TRUE' : ''}
            `;
            const countResult = await db.query(countQuery, [userId]);

            return {
                files: result.rows,
                total: parseInt(countResult.rows[0].total),
                limit,
                offset,
                hasMore: offset + result.rows.length < parseInt(countResult.rows[0].total)
            };
        } catch (error) {
            console.error('Error getting user files:', error);
            throw error;
        }
    }

    /**
     * Get file by ID
     */
    async getFileById(fileId, userId) {
        const db = await this.initDatabase();

        try {
            const result = await db.query(`
                SELECT
                    uf.*,
                    mdd.manufacturer,
                    mdd.device_model,
                    mdd.modality,
                    mdd.confidence as device_confidence
                FROM user_files uf
                LEFT JOIN medical_device_detections mdd ON uf.id = mdd.file_id
                WHERE uf.id = $1 AND uf.user_id = $2 AND uf.deleted_at IS NULL
            `, [fileId, userId]);

            if (result.rows.length === 0) {
                return null;
            }

            // Get analysis sessions
            const analyses = await db.query(`
                SELECT * FROM medical_analysis_sessions
                WHERE file_id = $1
                ORDER BY created_at DESC
            `, [fileId]);

            return {
                ...result.rows[0],
                analyses: analyses.rows
            };
        } catch (error) {
            console.error('Error getting file by ID:', error);
            throw error;
        }
    }

    /**
     * Get user dashboard statistics
     */
    async getUserDashboardStats(userId) {
        const db = await this.initDatabase();

        try {
            // Get overview stats
            const overviewResult = await db.query(`
                SELECT * FROM user_dashboard_stats WHERE user_id = $1
            `, [userId]);

            // Get recent upload stats (last 30 days)
            const statsResult = await db.query(`
                SELECT
                    date,
                    total_uploads,
                    medical_uploads,
                    ai_analyses_run,
                    storage_used_mb
                FROM user_upload_stats
                WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY date DESC
            `, [userId]);

            // Get recent activity
            const activityResult = await db.query(`
                SELECT * FROM recent_user_activity
                WHERE user_id = $1
                LIMIT 20
            `, [userId]);

            // Get file type distribution
            const fileTypesResult = await db.query(`
                SELECT
                    file_type,
                    COUNT(*) as count,
                    SUM(file_size) as total_size
                FROM user_files
                WHERE user_id = $1 AND deleted_at IS NULL
                GROUP BY file_type
                ORDER BY count DESC
            `, [userId]);

            return {
                overview: overviewResult.rows[0] || {
                    total_files: 0,
                    medical_files: 0,
                    total_analyses: 0,
                    total_consultations: 0,
                    total_storage_bytes: 0
                },
                uploadStats: statsResult.rows,
                recentActivity: activityResult.rows,
                fileTypes: fileTypesResult.rows
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }

    /**
     * Update user upload statistics
     */
    async updateUserStats(userId, updates) {
        const db = await this.initDatabase();

        try {
            // Ensure today's record exists
            await db.query(`
                INSERT INTO user_upload_stats (user_id, date)
                VALUES ($1, CURRENT_DATE)
                ON CONFLICT (user_id, date) DO NOTHING
            `, [userId]);

            // Build update query dynamically
            const fields = [];
            const values = [];
            let paramIndex = 1;

            if (updates.aiAnalysesRun) {
                fields.push(`ai_analyses_run = ai_analyses_run + $${paramIndex++}`);
                values.push(updates.aiAnalysesRun);
            }

            if (updates.deviceDetections) {
                fields.push(`device_detections = device_detections + $${paramIndex++}`);
                values.push(updates.deviceDetections);
            }

            if (updates.successfulAnalyses) {
                fields.push(`successful_analyses = successful_analyses + $${paramIndex++}`);
                values.push(updates.successfulAnalyses);
            }

            if (updates.failedAnalyses) {
                fields.push(`failed_analyses = failed_analyses + $${paramIndex++}`);
                values.push(updates.failedAnalyses);
            }

            if (updates.totalTokensUsed) {
                fields.push(`total_tokens_used = total_tokens_used + $${paramIndex++}`);
                values.push(updates.totalTokensUsed);
            }

            if (fields.length > 0) {
                fields.push(`updated_at = NOW()`);
                values.push(userId);

                const query = `
                    UPDATE user_upload_stats
                    SET ${fields.join(', ')}
                    WHERE user_id = $${paramIndex} AND date = CURRENT_DATE
                `;

                await db.query(query, values);
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating user stats:', error);
            throw error;
        }
    }

    /**
     * Log file access
     */
    async logFileAccess(fileId, userId, action, metadata = {}) {
        const db = await this.initDatabase();

        try {
            await db.query(`
                INSERT INTO file_access_logs (
                    id, file_id, user_id, action, success,
                    ip_address, user_agent, metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [
                uuidv4(),
                fileId,
                userId,
                action,
                true,
                metadata.ipAddress || null,
                metadata.userAgent || null,
                JSON.stringify(metadata)
            ]);

            return { success: true };
        } catch (error) {
            console.error('Error logging file access:', error);
            // Don't throw - logging failures shouldn't break the main operation
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete file (soft delete)
     */
    async deleteFile(fileId, userId) {
        const db = await this.initDatabase();

        try {
            const result = await db.query(`
                UPDATE user_files
                SET deleted_at = NOW(), status = 'deleted'
                WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
                RETURNING *
            `, [fileId, userId]);

            if (result.rows.length === 0) {
                throw new Error('File not found or already deleted');
            }

            // Log the deletion
            await this.logFileAccess(fileId, userId, 'delete');

            // Create activity feed entry
            await db.query(`
                INSERT INTO user_activity_feed (
                    id, user_id, activity_type, activity_category,
                    title, description, icon, color, metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            `, [
                uuidv4(),
                userId,
                'file_deleted',
                'files',
                'File Deleted',
                `Deleted ${result.rows[0].original_filename}`,
                'trash',
                '#EF4444',
                JSON.stringify({ file_id: fileId })
            ]);

            return { success: true, file: result.rows[0] };
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    /**
     * Get medical files summary
     */
    async getMedicalFilesSummary(userId) {
        const db = await this.initDatabase();

        try {
            const result = await db.query(`
                SELECT * FROM medical_files_summary
                WHERE user_id = $1
                ORDER BY created_at DESC
            `, [userId]);

            return result.rows;
        } catch (error) {
            console.error('Error getting medical files summary:', error);
            throw error;
        }
    }
}

// Singleton instance
const fileManager = new MedicalFileManager();

// Export handler
module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apply JWT authentication (optional)
    await new Promise((resolve) => {
        optionalAuthenticate(req, res, resolve);
    });

    // Get userId from authenticated user or fallback
    const userId = req.user?.userId;

    try {
        if (req.method === 'GET') {
            const { action, fileId } = req.query;

            if (action === 'list') {
                const files = await fileManager.getUserFiles(userId, {
                    limit: parseInt(req.query.limit) || 50,
                    offset: parseInt(req.query.offset) || 0,
                    medicalOnly: req.query.medicalOnly === 'true'
                });
                return res.status(200).json({ success: true, ...files });
            }

            if (action === 'get' && fileId) {
                const file = await fileManager.getFileById(fileId, userId);
                if (!file) {
                    return res.status(404).json({ success: false, error: 'File not found' });
                }
                return res.status(200).json({ success: true, file });
            }

            if (action === 'dashboard') {
                const stats = await fileManager.getUserDashboardStats(userId);
                return res.status(200).json({ success: true, ...stats });
            }

            if (action === 'medical-summary') {
                const summary = await fileManager.getMedicalFilesSummary(userId);
                return res.status(200).json({ success: true, files: summary });
            }

            return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        if (req.method === 'DELETE') {
            const { fileId } = req.query;
            if (!fileId) {
                return res.status(400).json({ success: false, error: 'File ID required' });
            }

            const result = await fileManager.deleteFile(fileId, userId);
            return res.status(200).json(result);
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });

    } catch (error) {
        console.error('File Manager Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
};

// Export class for use in other modules
module.exports.MedicalFileManager = MedicalFileManager;
module.exports.fileManager = fileManager;
