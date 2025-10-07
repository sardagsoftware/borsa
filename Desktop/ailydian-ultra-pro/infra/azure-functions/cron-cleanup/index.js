/**
 * ============================================================================
 * CRON CLEANUP FUNCTION
 * ============================================================================
 * Scheduled: Daily at 2:00 AM UTC
 * Purpose: Clean up expired sessions, old logs, temporary files
 * ============================================================================
 */

const { DefaultAzureCredential } = require('@azure/identity');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, timer) {
    const startTime = Date.now();
    context.log('🧹 Starting cleanup job at:', new Date().toISOString());

    const results = {
        expiredSessions: 0,
        oldLogs: 0,
        tempFiles: 0,
        errors: []
    };

    try {
        // 1. Clean up expired sessions (older than 30 days)
        await cleanupExpiredSessions(context, results);

        // 2. Clean up old logs (older than 90 days)
        await cleanupOldLogs(context, results);

        // 3. Clean up temporary files (older than 7 days)
        await cleanupTempFiles(context, results);

        const duration = Date.now() - startTime;
        context.log('✅ Cleanup completed successfully');
        context.log(`   Duration: ${duration}ms`);
        context.log(`   Expired sessions: ${results.expiredSessions}`);
        context.log(`   Old logs: ${results.oldLogs}`);
        context.log(`   Temp files: ${results.tempFiles}`);

        // Send metrics to Application Insights
        context.log.metric('CleanupDuration', duration);
        context.log.metric('ExpiredSessionsCleaned', results.expiredSessions);

    } catch (error) {
        context.log.error('❌ Cleanup job failed:', error);
        throw error;
    }
};

async function cleanupExpiredSessions(context, results) {
    // Implement session cleanup logic
    // This would connect to your database and delete old sessions
    context.log('  Cleaning expired sessions...');

    // Placeholder - implement actual cleanup
    results.expiredSessions = 0;
}

async function cleanupOldLogs(context, results) {
    context.log('  Cleaning old logs...');

    try {
        const blobServiceClient = new BlobServiceClient(
            process.env.AzureWebJobsStorage
        );

        const containerClient = blobServiceClient.getContainerClient('logs');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

        let deletedCount = 0;

        for await (const blob of containerClient.listBlobsFlat()) {
            if (blob.properties.createdOn < cutoffDate) {
                await containerClient.deleteBlob(blob.name);
                deletedCount++;
            }
        }

        results.oldLogs = deletedCount;
        context.log(`  ✓ Deleted ${deletedCount} old log files`);

    } catch (error) {
        context.log.error('  ✗ Error cleaning logs:', error);
        results.errors.push({ type: 'logs', error: error.message });
    }
}

async function cleanupTempFiles(context, results) {
    context.log('  Cleaning temporary files...');

    try {
        const blobServiceClient = new BlobServiceClient(
            process.env.AzureWebJobsStorage
        );

        const containerClient = blobServiceClient.getContainerClient('temp');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days ago

        let deletedCount = 0;

        for await (const blob of containerClient.listBlobsFlat()) {
            if (blob.properties.createdOn < cutoffDate) {
                await containerClient.deleteBlob(blob.name);
                deletedCount++;
            }
        }

        results.tempFiles = deletedCount;
        context.log(`  ✓ Deleted ${deletedCount} temporary files`);

    } catch (error) {
        context.log.error('  ✗ Error cleaning temp files:', error);
        results.errors.push({ type: 'temp', error: error.message });
    }
}
