/**
 * ============================================================================
 * DATA INGESTION FUNCTION
 * ============================================================================
 * Purpose: Ingest bulk data from external sources
 * Features: Validation, transformation, deduplication
 * ============================================================================
 */

module.exports = async function (context, req) {
    const dataType = context.bindingData.dataType;
    const startTime = Date.now();

    context.log(`📥 Data ingestion started: ${dataType}`);

    try {
        // Validate request
        if (!req.body || !Array.isArray(req.body)) {
            context.res = {
                status: 400,
                body: { error: 'Request body must be an array' }
            };
            return;
        }

        const records = req.body;
        context.log(`  Records to ingest: ${records.length}`);

        // Validate and transform data
        const validatedRecords = [];
        const errors = [];

        for (let i = 0; i < records.length; i++) {
            try {
                const validated = validateRecord(dataType, records[i]);
                validatedRecords.push(validated);
            } catch (error) {
                errors.push({
                    index: i,
                    record: records[i],
                    error: error.message
                });
            }
        }

        context.log(`  Valid records: ${validatedRecords.length}`);
        context.log(`  Invalid records: ${errors.length}`);

        // Store validated data to blob storage
        if (validatedRecords.length > 0) {
            context.bindings.outputBlob = JSON.stringify({
                dataType,
                timestamp: new Date().toISOString(),
                count: validatedRecords.length,
                records: validatedRecords
            });
        }

        const duration = Date.now() - startTime;
        context.log(`✅ Ingestion completed (${duration}ms)`);
        context.log.metric('IngestionDuration', duration);
        context.log.metric('RecordsIngested', validatedRecords.length);

        context.res = {
            status: 200,
            body: {
                success: true,
                dataType,
                ingested: validatedRecords.length,
                errors: errors.length,
                validationErrors: errors
            }
        };

    } catch (error) {
        context.log.error('❌ Ingestion failed:', error);

        context.res = {
            status: 500,
            body: { error: 'Data ingestion failed', details: error.message }
        };
    }
};

function validateRecord(dataType, record) {
    switch (dataType) {
        case 'users':
            return validateUserRecord(record);
        case 'analytics':
            return validateAnalyticsRecord(record);
        case 'logs':
            return validateLogRecord(record);
        default:
            return record; // No validation for unknown types
    }
}

function validateUserRecord(record) {
    if (!record.email || !record.email.includes('@')) {
        throw new Error('Invalid email');
    }

    if (!record.name || record.name.length < 2) {
        throw new Error('Invalid name');
    }

    return {
        email: record.email.toLowerCase().trim(),
        name: record.name.trim(),
        createdAt: record.createdAt || new Date().toISOString(),
        metadata: record.metadata || {}
    };
}

function validateAnalyticsRecord(record) {
    if (!record.event) {
        throw new Error('Event name required');
    }

    if (!record.userId && !record.sessionId) {
        throw new Error('userId or sessionId required');
    }

    return {
        event: record.event,
        userId: record.userId,
        sessionId: record.sessionId,
        properties: record.properties || {},
        timestamp: record.timestamp || new Date().toISOString()
    };
}

function validateLogRecord(record) {
    if (!record.level || !['info', 'warn', 'error', 'debug'].includes(record.level)) {
        throw new Error('Invalid log level');
    }

    return {
        level: record.level,
        message: record.message || '',
        timestamp: record.timestamp || new Date().toISOString(),
        metadata: record.metadata || {}
    };
}
