/**
 * Billing API with Stripe Integration
 * Handles subscriptions, payments, and invoices
 */

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const User = require('../../backend/models/User');
const { authenticateToken } = require('../../backend/middleware/auth');
const { getDatabase } = require('../../database/init-db');
const { sendSubscriptionEmail } = require('../../backend/email-service');

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Subscription Plans
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    credits: 100,
    features: ['Basic AI Chat', '10 images/month', 'Community Support']
  },
  basic: {
    name: 'Basic',
    price: 999, // $9.99 in cents
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    credits: 500,
    features: ['All AI Models', '100 images/month', 'Email Support', 'Priority Processing']
  },
  pro: {
    name: 'Pro',
    price: 2999, // $29.99 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    credits: 2000,
    features: ['Unlimited AI', '500 images/month', 'Priority Support', 'Advanced Analytics', 'API Access']
  },
  enterprise: {
    name: 'Enterprise',
    price: 9999, // $99.99 in cents
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    credits: 10000,
    features: ['Everything in Pro', 'Dedicated Support', 'Custom Integration', 'SLA Guarantee', 'Training']
  }
};

/**
 * GET /api/billing/plans
 * Get available subscription plans
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: PLANS
  });
});

/**
 * GET /api/billing/subscription
 * Get current subscription
 */
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    try {
      const subscription = db.prepare(`
        SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1
      `).get(req.user.id);

      const user = User.findById(req.user.id);

      res.json({
        success: true,
        subscription: subscription || {
          plan: 'free',
          status: 'active'
        },
        currentPlan: PLANS[user.subscription],
        credits: user.credits
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription'
    });
  }
});

/**
 * POST /api/billing/create-checkout-session
 * Create Stripe checkout session
 */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Stripe not configured'
      });
    }

    const { plan } = req.body;

    if (!plan || !PLANS[plan] || plan === 'free') {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan'
      });
    }

    const planConfig = PLANS[plan];

    if (!planConfig.priceId) {
      return res.status(503).json({
        success: false,
        error: 'Plan not configured in Stripe'
      });
    }

    // Create or get Stripe customer
    const db = getDatabase();
    let stripeCustomerId;

    try {
      const existingSub = db.prepare(`
        SELECT stripeCustomerId FROM subscriptions WHERE userId = ? AND stripeCustomerId IS NOT NULL LIMIT 1
      `).get(req.user.id);

      if (existingSub && existingSub.stripeCustomerId) {
        stripeCustomerId = existingSub.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: {
            userId: req.user.id.toString()
          }
        });
        stripeCustomerId = customer.id;
      }

    } finally {
      db.close();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'http://localhost:3100'}/billing.html?success=true`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3100'}/billing.html?canceled=true`,
      metadata: {
        userId: req.user.id.toString(),
        plan: plan
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    });
  }
});

/**
 * POST /api/billing/webhook
 * Stripe webhook handler
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).send('Stripe not configured');
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const db = getDatabase();

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = parseInt(session.metadata.userId);
          const plan = session.metadata.plan;

          // Update user subscription
          db.prepare('UPDATE users SET subscription = ?, credits = credits + ? WHERE id = ?')
            .run(plan, PLANS[plan].credits, userId);

          // Create subscription record
          db.prepare(`
            INSERT INTO subscriptions (userId, plan, stripeCustomerId, stripeSubscriptionId, status, currentPeriodStart, currentPeriodEnd)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            userId,
            plan,
            session.customer,
            session.subscription,
            'active',
            new Date().toISOString(),
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          );

          // Log activity
          User.logActivity({
            userId,
            action: 'subscription_activated',
            description: `Subscribed to ${plan} plan`
          });

          // Send confirmation email
          try {
            const user = User.findById(userId);
            await sendSubscriptionEmail(user, plan, PLANS[plan].price);
          } catch (emailError) {
            console.error('Failed to send subscription email:', emailError);
          }

          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const userId = parseInt(subscription.metadata?.userId);

          if (userId) {
            db.prepare(`
              UPDATE subscriptions
              SET status = ?, currentPeriodEnd = ?, cancelAtPeriodEnd = ?
              WHERE stripeSubscriptionId = ?
            `).run(
              subscription.status,
              new Date(subscription.current_period_end * 1000).toISOString(),
              subscription.cancel_at_period_end ? 1 : 0,
              subscription.id
            );
          }

          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const userId = parseInt(subscription.metadata?.userId);

          if (userId) {
            // Downgrade to free plan
            db.prepare('UPDATE users SET subscription = ?, credits = 100 WHERE id = ?')
              .run('free', userId);

            db.prepare(`
              UPDATE subscriptions SET status = 'canceled' WHERE stripeSubscriptionId = ?
            `).run(subscription.id);

            User.logActivity({
              userId,
              action: 'subscription_canceled',
              description: 'Subscription canceled, downgraded to free plan'
            });
          }

          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          const userId = parseInt(invoice.subscription_details?.metadata?.userId);

          if (userId) {
            // Add invoice to database
            db.prepare(`
              INSERT INTO invoices (userId, stripeInvoiceId, amount, currency, status, paidAt)
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              userId,
              invoice.id,
              invoice.amount_paid,
              invoice.currency,
              'paid',
              new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            );

            // Add credits for renewal
            const sub = db.prepare('SELECT plan FROM subscriptions WHERE userId = ? AND status = "active" LIMIT 1').get(userId);
            if (sub && PLANS[sub.plan]) {
              db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?')
                .run(PLANS[sub.plan].credits, userId);
            }
          }

          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

    } finally {
      db.close();
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook handler failed');
  }
});

/**
 * GET /api/billing/invoices
 * Get user's invoices
 */
router.get('/invoices', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    try {
      const invoices = db.prepare(`
        SELECT * FROM invoices WHERE userId = ? ORDER BY createdAt DESC LIMIT 50
      `).all(req.user.id);

      res.json({
        success: true,
        invoices
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get invoices'
    });
  }
});

/**
 * POST /api/billing/cancel-subscription
 * Cancel subscription
 */
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        error: 'Stripe not configured'
      });
    }

    const db = getDatabase();
    try {
      const subscription = db.prepare(`
        SELECT * FROM subscriptions WHERE userId = ? AND status = 'active' ORDER BY createdAt DESC LIMIT 1
      `).get(req.user.id);

      if (!subscription || !subscription.stripeSubscriptionId) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found'
        });
      }

      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      db.prepare('UPDATE subscriptions SET cancelAtPeriodEnd = 1 WHERE id = ?')
        .run(subscription.id);

      User.logActivity({
        userId: req.user.id,
        action: 'subscription_cancel_scheduled',
        description: 'Subscription will cancel at period end'
      });

      res.json({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
        periodEnd: subscription.currentPeriodEnd
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

module.exports = router;
