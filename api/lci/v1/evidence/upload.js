/**
 * LCI - Evidence Upload API
 * www.ailydian.com/api/lci/v1/evidence/upload
 *
 * Vercel Serverless Function for Evidence File Upload
 */

// CORS headers
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
};

/**
 * Main handler
 */
export default async function handler(req, res) {
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
        return res.status(200).json({ ok: true });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method Not Allowed',
            message: 'Only POST method is supported'
        });
    }

    try {
        // Set CORS headers
        Object.entries(CORS_HEADERS).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        const { complaintId, description } = req.body;

        if (!complaintId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'complaintId is required'
            });
        }

        // In production, this would:
        // 1. Parse multipart/form-data (using formidable or busboy)
        // 2. Validate file type and size
        // 3. Upload to cloud storage (S3, Azure Blob, etc.)
        // 4. Return signed URL or file ID
        //
        // For now, we mock the response

        const mockEvidenceId = `evid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const mockFileUrl = `/evidence/${complaintId}/${mockEvidenceId}`;

        const evidence = {
            id: mockEvidenceId,
            complaintId,
            description: description || 'Evidence file',
            fileUrl: mockFileUrl,
            uploadedAt: new Date().toISOString(),
            status: 'UPLOADED'
        };

        console.log(`✅ Evidence uploaded for complaint: ${complaintId}`);

        return res.status(201).json(evidence);

    } catch (error) {
        console.error('Evidence Upload Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
}
