/**
 * 💳 PAYMENT SERVICE
 * Extracted from server.js as part of microservices architecture
 *
 * Responsibilities:
 * - Stripe payment processing
 * - Subscription management (create, update, cancel)
 * - One-time payments (products, services)
 * - Refund processing
 * - Customer management
 * - Payment method management
 * - Webhook event handling
 * - Invoice generation
 * - Payment history
 *
 * Dependencies:
 * - Stripe SDK (stripe)
 * - Winston (logging)
 *
 * Endpoints:
 * - POST   /api/payments/create-payment-intent     # Create payment intent
 * - POST   /api/payments/confirm-payment           # Confirm payment
 * - POST   /api/subscriptions/create               # Create subscription
 * - POST   /api/subscriptions/:id/cancel           # Cancel subscription
 * - POST   /api/subscriptions/:id/update           # Update subscription
 * - GET    /api/subscriptions/:id                  # Get subscription details
 * - POST   /api/customers/create                   # Create customer
 * - GET    /api/customers/:id                      # Get customer details
 * - POST   /api/refunds/create                     # Create refund
 * - GET    /api/payments/history                   # Payment history
 * - POST   /api/webhooks/stripe                    # Stripe webhook endpoint
 * - GET    /health                                 # Health check
 */

const express = require('express');
const Stripe = require('stripe');
const logger = require('../lib/logger/production-logger');

class PaymentService {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.PAYMENT_PORT || 3106,
      stripeSecretKey: config.stripeSecretKey || process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
      currency: config.currency || 'usd',
      ...config,
    };

    this.app = express();
    this.stripe = null;
    this.payments = new Map(); // In-memory storage for demo (use DB in production)
    this.subscriptions = new Map();
    this.customers = new Map();

    this.init();
  }

  async init() {
    logger.info('💳 Initializing Payment Service...');

    // Initialize Stripe
    if (this.config.stripeSecretKey) {
      try {
        this.stripe = new Stripe(this.config.stripeSecretKey, {
          apiVersion: '2024-12-18.acacia',
        });
        logger.info('✅ Stripe initialized');
      } catch (error) {
        logger.error('❌ Failed to initialize Stripe', { error });
      }
    } else {
      logger.warn('⚠️  Stripe not configured - using test mode');
    }

    // Webhook endpoint needs raw body
    this.app.post(
      '/api/webhooks/stripe',
      express.raw({ type: 'application/json' }),
      this.handleWebhook.bind(this)
    );

    // JSON middleware for other endpoints
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.request(req, { duration_ms: duration, statusCode: res.statusCode });
      });
      next();
    });

    // Setup routes
    this.setupRoutes();

    // Error handlers
    this.setupErrorHandlers();

    logger.info('✅ Payment Service initialized');
  }

  setupRoutes() {
    // Service info
    this.app.get('/', (req, res) => {
      res.json({
        service: 'payment-service',
        version: '1.0.0',
        description: 'Payment processing service with Stripe integration',
        endpoints: {
          payments: {
            createIntent: 'POST /api/payments/create-payment-intent',
            confirmPayment: 'POST /api/payments/confirm-payment',
            history: 'GET /api/payments/history',
          },
          subscriptions: {
            create: 'POST /api/subscriptions/create',
            cancel: 'POST /api/subscriptions/:id/cancel',
            update: 'POST /api/subscriptions/:id/update',
            get: 'GET /api/subscriptions/:id',
          },
          customers: {
            create: 'POST /api/customers/create',
            get: 'GET /api/customers/:id',
          },
          refunds: {
            create: 'POST /api/refunds/create',
          },
          webhooks: {
            stripe: 'POST /api/webhooks/stripe',
          },
        },
        config: {
          stripe: !!this.config.stripeSecretKey,
          currency: this.config.currency,
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    // Health check
    this.app.get('/health', async (req, res) => {
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        stripe: {
          configured: !!this.stripe,
          connected: false,
        },
      };

      // Test Stripe connection
      if (this.stripe) {
        try {
          await this.stripe.balance.retrieve();
          health.stripe.connected = true;
          health.stripe.status = 'healthy';
        } catch (error) {
          health.stripe.status = 'unhealthy';
          health.stripe.error = error.message;
          health.status = 'DEGRADED';
        }
      }

      res.json(health);
    });

    // Create payment intent
    this.app.post('/api/payments/create-payment-intent', async (req, res) => {
      try {
        const { amount, currency = this.config.currency, metadata = {} } = req.body;

        if (!amount || amount <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid amount',
          });
        }

        let paymentIntent;
        if (this.stripe) {
          paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata,
          });
        } else {
          // Test mode
          paymentIntent = {
            id: `pi_test_${Date.now()}`,
            amount: Math.round(amount * 100),
            currency,
            status: 'requires_payment_method',
            client_secret: `test_secret_${Date.now()}`,
            metadata,
          };
        }

        // Store payment
        this.payments.set(paymentIntent.id, {
          ...paymentIntent,
          createdAt: new Date().toISOString(),
        });

        res.json({
          success: true,
          paymentIntent: {
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
          },
        });
      } catch (error) {
        logger.error('Create payment intent failed', { error });
        res.status(500).json({
          success: false,
          error: 'Payment intent creation failed',
          details: error.message,
        });
      }
    });

    // Confirm payment
    this.app.post('/api/payments/confirm-payment', async (req, res) => {
      try {
        const { paymentIntentId, paymentMethodId } = req.body;

        if (!paymentIntentId) {
          return res.status(400).json({
            success: false,
            error: 'Payment intent ID required',
          });
        }

        let paymentIntent;
        if (this.stripe && paymentMethodId) {
          paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
            payment_method: paymentMethodId,
          });
        } else {
          // Test mode
          const existing = this.payments.get(paymentIntentId);
          if (!existing) {
            return res.status(404).json({
              success: false,
              error: 'Payment intent not found',
            });
          }

          paymentIntent = {
            ...existing,
            status: 'succeeded',
            confirmedAt: new Date().toISOString(),
          };
          this.payments.set(paymentIntentId, paymentIntent);
        }

        res.json({
          success: true,
          payment: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
          },
        });
      } catch (error) {
        logger.error('Confirm payment failed', { error });
        res.status(500).json({
          success: false,
          error: 'Payment confirmation failed',
          details: error.message,
        });
      }
    });

    // Create subscription
    this.app.post('/api/subscriptions/create', async (req, res) => {
      try {
        const { customerId, priceId, metadata = {} } = req.body;

        if (!customerId || !priceId) {
          return res.status(400).json({
            success: false,
            error: 'Customer ID and Price ID required',
          });
        }

        let subscription;
        if (this.stripe) {
          subscription = await this.stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            metadata,
          });
        } else {
          // Test mode
          subscription = {
            id: `sub_test_${Date.now()}`,
            customer: customerId,
            items: {
              data: [{ price: { id: priceId } }],
            },
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
            metadata,
          };
        }

        this.subscriptions.set(subscription.id, {
          ...subscription,
          createdAt: new Date().toISOString(),
        });

        res.json({
          success: true,
          subscription: {
            id: subscription.id,
            customerId: subscription.customer,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
          },
        });
      } catch (error) {
        logger.error('Create subscription failed', { error });
        res.status(500).json({
          success: false,
          error: 'Subscription creation failed',
          details: error.message,
        });
      }
    });

    // Get subscription
    this.app.get('/api/subscriptions/:id', async (req, res) => {
      try {
        const { id } = req.params;

        let subscription;
        if (this.stripe) {
          subscription = await this.stripe.subscriptions.retrieve(id);
        } else {
          subscription = this.subscriptions.get(id);
          if (!subscription) {
            return res.status(404).json({
              success: false,
              error: 'Subscription not found',
            });
          }
        }

        res.json({
          success: true,
          subscription,
        });
      } catch (error) {
        logger.error('Get subscription failed', { error });
        res.status(500).json({
          success: false,
          error: 'Get subscription failed',
          details: error.message,
        });
      }
    });

    // Cancel subscription
    this.app.post('/api/subscriptions/:id/cancel', async (req, res) => {
      try {
        const { id } = req.params;
        const { immediately = false } = req.body;

        let subscription;
        if (this.stripe) {
          subscription = await this.stripe.subscriptions.update(id, {
            cancel_at_period_end: !immediately,
          });

          if (immediately) {
            subscription = await this.stripe.subscriptions.cancel(id);
          }
        } else {
          subscription = this.subscriptions.get(id);
          if (!subscription) {
            return res.status(404).json({
              success: false,
              error: 'Subscription not found',
            });
          }

          subscription.status = immediately ? 'canceled' : 'canceling';
          subscription.cancel_at_period_end = !immediately;
          subscription.canceledAt = new Date().toISOString();
          this.subscriptions.set(id, subscription);
        }

        res.json({
          success: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          message: immediately
            ? 'Subscription canceled immediately'
            : 'Subscription will cancel at period end',
        });
      } catch (error) {
        logger.error('Cancel subscription failed', { error });
        res.status(500).json({
          success: false,
          error: 'Subscription cancellation failed',
          details: error.message,
        });
      }
    });

    // Update subscription
    this.app.post('/api/subscriptions/:id/update', async (req, res) => {
      try {
        const { id } = req.params;
        const { priceId, metadata } = req.body;

        let subscription;
        if (this.stripe) {
          const updateData = {};
          if (priceId) {
            const currentSubscription = await this.stripe.subscriptions.retrieve(id);
            updateData.items = [
              {
                id: currentSubscription.items.data[0].id,
                price: priceId,
              },
            ];
          }
          if (metadata) {
            updateData.metadata = metadata;
          }

          subscription = await this.stripe.subscriptions.update(id, updateData);
        } else {
          subscription = this.subscriptions.get(id);
          if (!subscription) {
            return res.status(404).json({
              success: false,
              error: 'Subscription not found',
            });
          }

          if (priceId) {
            subscription.items.data[0].price.id = priceId;
          }
          if (metadata) {
            subscription.metadata = { ...subscription.metadata, ...metadata };
          }
          subscription.updatedAt = new Date().toISOString();
          this.subscriptions.set(id, subscription);
        }

        res.json({
          success: true,
          subscription: {
            id: subscription.id,
            status: subscription.status,
          },
          message: 'Subscription updated successfully',
        });
      } catch (error) {
        logger.error('Update subscription failed', { error });
        res.status(500).json({
          success: false,
          error: 'Subscription update failed',
          details: error.message,
        });
      }
    });

    // Create customer
    this.app.post('/api/customers/create', async (req, res) => {
      try {
        const { email, name, metadata = {} } = req.body;

        if (!email) {
          return res.status(400).json({
            success: false,
            error: 'Email required',
          });
        }

        let customer;
        if (this.stripe) {
          customer = await this.stripe.customers.create({
            email,
            name,
            metadata,
          });
        } else {
          customer = {
            id: `cus_test_${Date.now()}`,
            email,
            name,
            metadata,
            created: Math.floor(Date.now() / 1000),
          };
        }

        this.customers.set(customer.id, {
          ...customer,
          createdAt: new Date().toISOString(),
        });

        res.json({
          success: true,
          customer: {
            id: customer.id,
            email: customer.email,
            name: customer.name,
          },
        });
      } catch (error) {
        logger.error('Create customer failed', { error });
        res.status(500).json({
          success: false,
          error: 'Customer creation failed',
          details: error.message,
        });
      }
    });

    // Get customer
    this.app.get('/api/customers/:id', async (req, res) => {
      try {
        const { id } = req.params;

        let customer;
        if (this.stripe) {
          customer = await this.stripe.customers.retrieve(id);
        } else {
          customer = this.customers.get(id);
          if (!customer) {
            return res.status(404).json({
              success: false,
              error: 'Customer not found',
            });
          }
        }

        res.json({
          success: true,
          customer,
        });
      } catch (error) {
        logger.error('Get customer failed', { error });
        res.status(500).json({
          success: false,
          error: 'Get customer failed',
          details: error.message,
        });
      }
    });

    // Create refund
    this.app.post('/api/refunds/create', async (req, res) => {
      try {
        const { paymentIntentId, amount, reason = 'requested_by_customer' } = req.body;

        if (!paymentIntentId) {
          return res.status(400).json({
            success: false,
            error: 'Payment intent ID required',
          });
        }

        let refund;
        if (this.stripe) {
          const refundData = {
            payment_intent: paymentIntentId,
            reason,
          };
          if (amount) {
            refundData.amount = Math.round(amount * 100);
          }

          refund = await this.stripe.refunds.create(refundData);
        } else {
          const payment = this.payments.get(paymentIntentId);
          if (!payment) {
            return res.status(404).json({
              success: false,
              error: 'Payment not found',
            });
          }

          refund = {
            id: `re_test_${Date.now()}`,
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : payment.amount,
            status: 'succeeded',
            reason,
            created: Math.floor(Date.now() / 1000),
          };

          payment.refunded = true;
          payment.refundedAt = new Date().toISOString();
          this.payments.set(paymentIntentId, payment);
        }

        res.json({
          success: true,
          refund: {
            id: refund.id,
            amount: refund.amount,
            status: refund.status,
            reason: refund.reason,
          },
          message: 'Refund processed successfully',
        });
      } catch (error) {
        logger.error('Create refund failed', { error });
        res.status(500).json({
          success: false,
          error: 'Refund creation failed',
          details: error.message,
        });
      }
    });

    // Payment history
    this.app.get('/api/payments/history', async (req, res) => {
      try {
        const { customerId, limit = 10 } = req.query;

        let payments;
        if (this.stripe && customerId) {
          const paymentIntents = await this.stripe.paymentIntents.list({
            customer: customerId,
            limit: parseInt(limit),
          });
          payments = paymentIntents.data;
        } else {
          payments = Array.from(this.payments.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, parseInt(limit));
        }

        res.json({
          success: true,
          payments: payments.map(p => ({
            id: p.id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            createdAt: p.createdAt || new Date(p.created * 1000).toISOString(),
            refunded: p.refunded || false,
          })),
          count: payments.length,
        });
      } catch (error) {
        logger.error('Get payment history failed', { error });
        res.status(500).json({
          success: false,
          error: 'Get payment history failed',
          details: error.message,
        });
      }
    });
  }

  async handleWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      let event;

      if (this.stripe && this.config.stripeWebhookSecret) {
        event = this.stripe.webhooks.constructEvent(req.body, sig, this.config.stripeWebhookSecret);
      } else {
        // Test mode - accept any webhook
        event = JSON.parse(req.body.toString());
      }

      logger.info('Stripe webhook received', {
        type: event.type,
        id: event.id,
      });

      // Handle specific event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          logger.info('Payment succeeded', { paymentIntent: event.data.object.id });
          break;
        case 'payment_intent.payment_failed':
          logger.warn('Payment failed', { paymentIntent: event.data.object.id });
          break;
        case 'customer.subscription.created':
          logger.info('Subscription created', { subscription: event.data.object.id });
          break;
        case 'customer.subscription.updated':
          logger.info('Subscription updated', { subscription: event.data.object.id });
          break;
        case 'customer.subscription.deleted':
          logger.info('Subscription deleted', { subscription: event.data.object.id });
          break;
        default:
          logger.debug('Unhandled webhook event', { type: event.type });
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook handling failed', { error });
      res.status(400).json({
        success: false,
        error: 'Webhook handling failed',
        details: error.message,
      });
    }
  }

  setupErrorHandlers() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        service: 'payment-service',
      });
    });

    // General error handler
    this.app.use((err, req, res, _next) => {
      logger.error('Unhandled error in payment service', {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        request: {
          method: req.method,
          path: req.path,
        },
      });

      res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        service: 'payment-service',
      });
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          logger.info(`💳 Payment Service started on port ${this.config.port}`);
          logger.info(`💰 Payments: http://localhost:${this.config.port}/api/payments/*`);
          logger.info(`📋 Subscriptions: http://localhost:${this.config.port}/api/subscriptions/*`);
          resolve(this.server);
        });

        this.server.on('error', error => {
          logger.error('Failed to start payment service', { error });
          reject(error);
        });
      } catch (error) {
        logger.error('Error starting payment service', { error });
        reject(error);
      }
    });
  }

  async stop() {
    logger.info('🛑 Stopping payment service...');

    if (this.server) {
      return new Promise(resolve => {
        this.server.close(() => {
          logger.info('✅ Payment service stopped');
          resolve();
        });
      });
    }
  }

  // Expose Express app for integration
  getApp() {
    return this.app;
  }

  // Get payment statistics
  getStats() {
    const payments = Array.from(this.payments.values());
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const successfulPayments = payments.filter(p => p.status === 'succeeded').length;
    const refundedPayments = payments.filter(p => p.refunded).length;

    return {
      totalPayments: payments.length,
      successfulPayments,
      refundedPayments,
      failedPayments: payments.length - successfulPayments - refundedPayments,
      totalAmount: totalAmount / 100, // Convert from cents
      totalAmountFormatted: `$${(totalAmount / 100).toFixed(2)}`,
      totalSubscriptions: this.subscriptions.size,
      totalCustomers: this.customers.size,
    };
  }
}

// Export for both standalone and integrated use
module.exports = PaymentService;

// Standalone mode - start service if run directly
if (require.main === module) {
  const service = new PaymentService();
  service.start().catch(error => {
    logger.error('Failed to start payment service', { error });
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await service.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await service.stop();
    process.exit(0);
  });
}
