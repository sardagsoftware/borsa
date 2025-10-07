/**
 * ============================================================================
 * WEBHOOK HANDLER FUNCTION
 * ============================================================================
 * Purpose: Handle incoming webhooks from external providers
 * Providers: Stripe, SendGrid, GitHub, etc.
 * ============================================================================
 */

const crypto = require('crypto');

module.exports = async function (context, req) {
    const provider = context.bindingData.provider;
    const startTime = Date.now();

    context.log(`📨 Webhook received from: ${provider}`);

    try {
        // Verify webhook signature
        const isValid = await verifyWebhookSignature(context, req, provider);

        if (!isValid) {
            context.res = {
                status: 401,
                body: { error: 'Invalid webhook signature' }
            };
            return;
        }

        // Process webhook based on provider
        const result = await processWebhook(context, req, provider);

        // Queue for async processing if needed
        if (result.queueForProcessing) {
            context.bindings.outputQueue = {
                provider,
                event: result.event,
                data: result.data,
                timestamp: new Date().toISOString()
            };
        }

        const duration = Date.now() - startTime;
        context.log(`✅ Webhook processed (${duration}ms)`);
        context.log.metric('WebhookProcessingTime', duration);

        context.res = {
            status: 200,
            body: { success: true, event: result.event }
        };

    } catch (error) {
        context.log.error('❌ Webhook processing failed:', error);

        context.res = {
            status: 500,
            body: { error: 'Webhook processing failed' }
        };
    }
};

async function verifyWebhookSignature(context, req, provider) {
    const signature = req.headers['x-webhook-signature'] || req.headers['stripe-signature'];

    if (!signature) {
        context.log.warn('⚠️  No signature provided');
        return false;
    }

    // Implement signature verification based on provider
    switch (provider) {
        case 'stripe':
            return verifyStripeSignature(req, signature);
        case 'sendgrid':
            return verifySendGridSignature(req, signature);
        case 'github':
            return verifyGitHubSignature(req, signature);
        default:
            return true; // Or implement generic verification
    }
}

function verifyStripeSignature(req, signature) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return false;

    try {
        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return signature === expectedSignature;
    } catch {
        return false;
    }
}

function verifySendGridSignature(req, signature) {
    // Implement SendGrid signature verification
    return true; // Placeholder
}

function verifyGitHubSignature(req, signature) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) return false;

    try {
        const payload = JSON.stringify(req.body);
        const expectedSignature = 'sha256=' + crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return signature === expectedSignature;
    } catch {
        return false;
    }
}

async function processWebhook(context, req, provider) {
    const body = req.body;

    switch (provider) {
        case 'stripe':
            return processStripeWebhook(context, body);
        case 'sendgrid':
            return processSendGridWebhook(context, body);
        case 'github':
            return processGitHubWebhook(context, body);
        default:
            return { event: 'unknown', queueForProcessing: false };
    }
}

function processStripeWebhook(context, body) {
    const eventType = body.type;
    context.log(`  Stripe event: ${eventType}`);

    // Handle specific Stripe events
    switch (eventType) {
        case 'payment_intent.succeeded':
            return {
                event: 'payment_success',
                data: body.data.object,
                queueForProcessing: true
            };
        case 'customer.subscription.created':
            return {
                event: 'subscription_created',
                data: body.data.object,
                queueForProcessing: true
            };
        default:
            return { event: eventType, queueForProcessing: false };
    }
}

function processSendGridWebhook(context, body) {
    context.log(`  SendGrid events: ${body.length}`);

    return {
        event: 'email_events',
        data: body,
        queueForProcessing: true
    };
}

function processGitHubWebhook(context, body) {
    const eventType = context.req.headers['x-github-event'];
    context.log(`  GitHub event: ${eventType}`);

    return {
        event: eventType,
        data: body,
        queueForProcessing: true
    };
}
