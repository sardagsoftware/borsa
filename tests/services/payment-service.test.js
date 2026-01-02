/**
 * Payment Service Tests
 * Tests for the extracted payment microservice with Stripe integration
 */

const request = require('supertest');
const PaymentService = require('../../services/payment-service');

describe('Payment Service', () => {
  let service;
  let app;

  beforeAll(async () => {
    // Create service with test configuration (no real Stripe)
    service = new PaymentService({
      port: 0, // Random port for testing
      stripeSecretKey: null, // Use test mode
      currency: 'usd',
    });
    app = service.getApp();
  });

  afterAll(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Service Information', () => {
    it('should return service info', async () => {
      const response = await request(app).get('/').expect(200);

      expect(response.body).toHaveProperty('service', 'payment-service');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('payments');
      expect(response.body.endpoints).toHaveProperty('subscriptions');
      expect(response.body.endpoints).toHaveProperty('customers');
      expect(response.body.config.currency).toBe('usd');
    });

    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('stripe');
      expect(response.body.stripe.configured).toBe(false); // Test mode
    });
  });

  describe('Payment Intents', () => {
    it('should create a payment intent', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({
          amount: 99.99,
          currency: 'usd',
          metadata: { orderId: 'test-123' },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.paymentIntent).toHaveProperty('id');
      expect(response.body.paymentIntent).toHaveProperty('clientSecret');
      expect(response.body.paymentIntent.amount).toBe(9999); // Cents
      expect(response.body.paymentIntent.currency).toBe('usd');
      expect(response.body.paymentIntent.status).toBe('requires_payment_method');
    });

    it('should reject invalid amount', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({
          amount: 0,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid amount');
    });

    it('should reject negative amount', async () => {
      const response = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({
          amount: -10,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid amount');
    });

    it('should confirm a payment', async () => {
      // Create payment intent first
      const createResponse = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({ amount: 50.0 });

      const paymentIntentId = createResponse.body.paymentIntent.id;

      // Confirm payment
      const response = await request(app)
        .post('/api/payments/confirm-payment')
        .send({
          paymentIntentId,
          paymentMethodId: 'pm_test_card',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('succeeded');
      expect(response.body.payment.id).toBe(paymentIntentId);
    });

    it('should return 404 for non-existent payment intent', async () => {
      const response = await request(app)
        .post('/api/payments/confirm-payment')
        .send({
          paymentIntentId: 'pi_nonexistent',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment intent not found');
    });

    it('should require payment intent ID', async () => {
      const response = await request(app)
        .post('/api/payments/confirm-payment')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment intent ID required');
    });
  });

  describe('Customers', () => {
    let customerId;

    it('should create a customer', async () => {
      const response = await request(app)
        .post('/api/customers/create')
        .send({
          email: 'test@example.com',
          name: 'Test Customer',
          metadata: { userId: 'user-123' },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.customer).toHaveProperty('id');
      expect(response.body.customer.email).toBe('test@example.com');
      expect(response.body.customer.name).toBe('Test Customer');

      customerId = response.body.customer.id;
    });

    it('should require email', async () => {
      const response = await request(app)
        .post('/api/customers/create')
        .send({
          name: 'Test Customer',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email required');
    });

    it('should get customer details', async () => {
      const response = await request(app).get(`/api/customers/${customerId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.customer).toHaveProperty('id', customerId);
      expect(response.body.customer.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app).get('/api/customers/cus_nonexistent').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });
  });

  describe('Subscriptions', () => {
    let subscriptionId;
    let customerId;

    beforeAll(async () => {
      // Create a test customer
      const customerResponse = await request(app).post('/api/customers/create').send({
        email: 'subscription@example.com',
        name: 'Subscription Test',
      });

      customerId = customerResponse.body.customer.id;
    });

    it('should create a subscription', async () => {
      const response = await request(app)
        .post('/api/subscriptions/create')
        .send({
          customerId,
          priceId: 'price_test_monthly',
          metadata: { plan: 'pro' },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toHaveProperty('id');
      expect(response.body.subscription.customerId).toBe(customerId);
      expect(response.body.subscription.status).toBe('active');
      expect(response.body.subscription).toHaveProperty('currentPeriodStart');
      expect(response.body.subscription).toHaveProperty('currentPeriodEnd');

      subscriptionId = response.body.subscription.id;
    });

    it('should require customer ID and price ID', async () => {
      const response = await request(app)
        .post('/api/subscriptions/create')
        .send({
          customerId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer ID and Price ID required');
    });

    it('should get subscription details', async () => {
      const response = await request(app).get(`/api/subscriptions/${subscriptionId}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toHaveProperty('id', subscriptionId);
      expect(response.body.subscription.status).toBe('active');
    });

    it('should update subscription', async () => {
      const response = await request(app)
        .post(`/api/subscriptions/${subscriptionId}/update`)
        .send({
          priceId: 'price_test_yearly',
          metadata: { plan: 'enterprise' },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.id).toBe(subscriptionId);
      expect(response.body.message).toBe('Subscription updated successfully');
    });

    it('should cancel subscription at period end', async () => {
      const response = await request(app)
        .post(`/api/subscriptions/${subscriptionId}/cancel`)
        .send({
          immediately: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.cancelAtPeriodEnd).toBe(true);
      expect(response.body.message).toBe('Subscription will cancel at period end');
    });

    it('should cancel subscription immediately', async () => {
      // Create a new subscription for immediate cancellation
      const createResponse = await request(app).post('/api/subscriptions/create').send({
        customerId,
        priceId: 'price_test_monthly',
      });

      const newSubId = createResponse.body.subscription.id;

      const response = await request(app)
        .post(`/api/subscriptions/${newSubId}/cancel`)
        .send({
          immediately: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription.status).toBe('canceled');
      expect(response.body.message).toBe('Subscription canceled immediately');
    });

    it('should return 404 for non-existent subscription', async () => {
      const response = await request(app).get('/api/subscriptions/sub_nonexistent').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Subscription not found');
    });
  });

  describe('Refunds', () => {
    let paymentIntentId;

    beforeAll(async () => {
      // Create and confirm a payment
      const createResponse = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({ amount: 100.0 });

      paymentIntentId = createResponse.body.paymentIntent.id;

      await request(app).post('/api/payments/confirm-payment').send({
        paymentIntentId,
        paymentMethodId: 'pm_test_card',
      });
    });

    it('should create a full refund', async () => {
      const response = await request(app)
        .post('/api/refunds/create')
        .send({
          paymentIntentId,
          reason: 'requested_by_customer',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.refund).toHaveProperty('id');
      expect(response.body.refund.status).toBe('succeeded');
      expect(response.body.refund.reason).toBe('requested_by_customer');
      expect(response.body.message).toBe('Refund processed successfully');
    });

    it('should create a partial refund', async () => {
      // Create another payment for partial refund
      const createResponse = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({ amount: 100.0 });

      const newPaymentId = createResponse.body.paymentIntent.id;

      await request(app).post('/api/payments/confirm-payment').send({
        paymentIntentId: newPaymentId,
        paymentMethodId: 'pm_test_card',
      });

      const response = await request(app)
        .post('/api/refunds/create')
        .send({
          paymentIntentId: newPaymentId,
          amount: 50.0,
          reason: 'duplicate',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.refund.amount).toBe(5000); // 50.00 in cents
    });

    it('should require payment intent ID', async () => {
      const response = await request(app).post('/api/refunds/create').send({}).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment intent ID required');
    });

    it('should return 404 for non-existent payment', async () => {
      const response = await request(app)
        .post('/api/refunds/create')
        .send({
          paymentIntentId: 'pi_nonexistent',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment not found');
    });
  });

  describe('Payment History', () => {
    beforeAll(async () => {
      // Create multiple payments for history
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/payments/create-payment-intent')
          .send({ amount: 10 + i });
      }
    });

    it('should get payment history with default limit', async () => {
      const response = await request(app).get('/api/payments/history').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payments).toBeDefined();
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should get payment history with custom limit', async () => {
      const response = await request(app).get('/api/payments/history?limit=3').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.payments.length).toBeLessThanOrEqual(3);
    });

    it('should return payment details in history', async () => {
      const response = await request(app).get('/api/payments/history?limit=1').expect(200);

      expect(response.body.payments[0]).toHaveProperty('id');
      expect(response.body.payments[0]).toHaveProperty('amount');
      expect(response.body.payments[0]).toHaveProperty('currency');
      expect(response.body.payments[0]).toHaveProperty('status');
      expect(response.body.payments[0]).toHaveProperty('createdAt');
    });
  });

  describe('Webhooks', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      const webhookPayload = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 5000,
            currency: 'usd',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send(webhookPayload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });

    it('should handle subscription.created webhook', async () => {
      const webhookPayload = {
        id: 'evt_test_456',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
          },
        },
      };

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .send(webhookPayload)
        .set('Content-Type', 'application/json')
        .expect(200);

      expect(response.body).toHaveProperty('received', true);
    });
  });

  describe('Statistics', () => {
    it('should return payment statistics', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('totalPayments');
      expect(stats).toHaveProperty('successfulPayments');
      expect(stats).toHaveProperty('refundedPayments');
      expect(stats).toHaveProperty('failedPayments');
      expect(stats).toHaveProperty('totalAmount');
      expect(stats).toHaveProperty('totalAmountFormatted');
      expect(stats).toHaveProperty('totalSubscriptions');
      expect(stats).toHaveProperty('totalCustomers');
    });

    it('should calculate stats correctly', () => {
      const stats = service.getStats();

      expect(stats.totalPayments).toBeGreaterThanOrEqual(0);
      expect(stats.successfulPayments).toBeGreaterThanOrEqual(0);
      expect(stats.refundedPayments).toBeGreaterThanOrEqual(0);
      expect(stats.totalSubscriptions).toBeGreaterThanOrEqual(0);
      expect(stats.totalCustomers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoint', async () => {
      const response = await request(app).get('/api/unknown-route').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint not found');
    });
  });

  describe('Service Management', () => {
    it('should start and stop service', async () => {
      const testService = new PaymentService({ port: 0 });
      const server = await testService.start();

      expect(server).toBeDefined();
      expect(server.listening).toBe(true);

      await testService.stop();
    });

    it('should provide access to Express app', () => {
      const expressApp = service.getApp();
      expect(expressApp).toBeDefined();
      expect(typeof expressApp.use).toBe('function');
    });
  });
});

describe('Payment Service with Stripe Configuration', () => {
  it('should initialize with Stripe secret key', () => {
    const service = new PaymentService({
      port: 0,
      stripeSecretKey: 'sk_test_123',
      stripeWebhookSecret: 'whsec_test_123',
    });

    const app = service.getApp();
    expect(app).toBeDefined();
  });

  it('should handle missing Stripe configuration gracefully', () => {
    const service = new PaymentService({
      port: 0,
      stripeSecretKey: null,
    });

    const stats = service.getStats();
    expect(stats).toBeDefined();
  });
});
