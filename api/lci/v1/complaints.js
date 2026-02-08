/**
 * LCI - Complaints API
 * www.ailydian.com/api/lci/v1/complaints
 *
 * Vercel Serverless Function for Complaint Management
 */

// Mock complaint database (in production, use real database)
const { getCorsOrigin } = require('../../_middleware/cors');
const COMPLAINTS = [];

// CORS headers
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
};

/**
 * Generate unique complaint ID
 */
function generateComplaintId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LCI-${timestamp}-${random}`;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    const { method, query } = req;

    try {
        // Set CORS headers
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        switch (method) {
            case 'GET':
                return await handleGet(req, res, query);
            case 'POST':
                return await handlePost(req, res);
            case 'PUT':
                return await handlePut(req, res);
            case 'DELETE':
                return await handleDelete(req, res);
            default:
                return res.status(405).json({
                    error: 'Method Not Allowed',
                    message: `Method ${method} not supported`
                });
        }
    } catch (error) {
        console.error('Complaints API Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}

/**
 * GET /api/lci/v1/complaints
 * Query params:
 * - brandId: string (filter by brand)
 * - userId: string (filter by user)
 * - severity: LOW|MEDIUM|HIGH|CRITICAL
 * - status: PENDING|APPROVED|REJECTED|RESOLVED
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
async function handleGet(req, res, query) {
    const {
        brandId,
        userId,
        severity,
        status,
        limit = '20',
        offset = '0'
    } = query;

    let filteredComplaints = [...COMPLAINTS];

    // Filter by brandId
    if (brandId) {
        filteredComplaints = filteredComplaints.filter(c => c.brandId === brandId);
    }

    // Filter by userId
    if (userId) {
        filteredComplaints = filteredComplaints.filter(c => c.userId === userId);
    }

    // Filter by severity
    if (severity) {
        filteredComplaints = filteredComplaints.filter(c => c.severity === severity);
    }

    // Filter by status
    if (status) {
        filteredComplaints = filteredComplaints.filter(c => c.status === status);
    }

    // Sort by creation date (newest first)
    filteredComplaints.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Pagination
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const total = filteredComplaints.length;
    const paginatedComplaints = filteredComplaints.slice(offsetNum, offsetNum + limitNum);

    return res.status(200).json({
        data: paginatedComplaints,
        pagination: {
            total,
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < total
        }
    });
}

/**
 * POST /api/lci/v1/complaints
 * Create new complaint
 */
async function handlePost(req, res) {
    const {
        brandId,
        userId,
        title,
        description,
        product,
        severity = 'LOW'
    } = req.body;

    // Validation
    if (!brandId || !userId || !title || !description) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'brandId, userId, title, and description are required'
        });
    }

    if (description.length < 50) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Description must be at least 50 characters'
        });
    }

    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid severity level'
        });
    }

    // PII Detection (basic check)
    const piiRegex = /(\d{11})|(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    if (piiRegex.test(description) || piiRegex.test(title)) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Complaint contains personal information (phone, email, ID). Please remove PII.'
        });
    }

    const newComplaint = {
        id: generateComplaintId(),
        brandId,
        userId,
        title,
        description,
        product: product || null,
        severity,
        status: 'PENDING',
        moderationStatus: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidence: [],
        responses: []
    };

    COMPLAINTS.push(newComplaint);

    console.log(`✅ New complaint created: ${newComplaint.id}`);

    return res.status(201).json(newComplaint);
}

/**
 * PUT /api/lci/v1/complaints/:id
 * Update complaint
 */
async function handlePut(req, res) {
    const { id } = req.query;
    const { status, moderationStatus, response } = req.body;

    const complaintIndex = COMPLAINTS.findIndex(c => c.id === id);
    if (complaintIndex === -1) {
        return res.status(404).json({
            error: 'Not Found',
            message: 'Complaint not found'
        });
    }

    const updatedComplaint = {
        ...COMPLAINTS[complaintIndex],
        ...(status && { status }),
        ...(moderationStatus && { moderationStatus }),
        updatedAt: new Date().toISOString()
    };

    // Add brand response if provided
    if (response) {
        updatedComplaint.responses = updatedComplaint.responses || [];
        updatedComplaint.responses.push({
            id: `resp-${Date.now()}`,
            text: response,
            createdAt: new Date().toISOString()
        });
    }

    COMPLAINTS[complaintIndex] = updatedComplaint;

    return res.status(200).json(updatedComplaint);
}

/**
 * DELETE /api/lci/v1/complaints/:id
 * Delete complaint
 */
async function handleDelete(req, res) {
    const { id } = req.query;

    const complaintIndex = COMPLAINTS.findIndex(c => c.id === id);
    if (complaintIndex === -1) {
        return res.status(404).json({
            error: 'Not Found',
            message: 'Complaint not found'
        });
    }

    // Remove complaint
    const deletedComplaint = COMPLAINTS.splice(complaintIndex, 1)[0];

    return res.status(200).json({
        message: 'Complaint deleted successfully',
        complaint: deletedComplaint
    });
}
