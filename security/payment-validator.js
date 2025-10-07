/**
 * Payment Security Validator
 * Fixes: CRITICAL - Stripe webhook, price manipulation, USDT verification
 */

const crypto = require('crypto');

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️  Stripe API key not configured - payment features will be disabled');
}

// Pricing configuration (server-side source of truth)
const PRICING_PLANS = {
  free: { price: 0, credits: 100 },
  basic: { price: 9.99, credits: 1000 },
  premium: { price: 29.99, credits: 5000 },
  enterprise: { price: 99.99, credits: 25000 }
};

/**
 * Validate Stripe webhook signature
 * Fixes: CRITICAL - Webhook accepts unsigned requests
 */
function validateStripeWebhook(req, endpointSecret) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    throw new Error('Missing Stripe signature');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
    return event;
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Validate payment price (server-side)
 * Fixes: CRITICAL - Price manipulation possible
 */
function validatePaymentPrice(plan, clientPrice) {
  const serverPrice = PRICING_PLANS[plan]?.price;

  if (!serverPrice && serverPrice !== 0) {
    throw new Error('Invalid plan');
  }

  // NEVER trust client-provided price
  // Always use server-side price
  return {
    valid: true,
    price: serverPrice, // Use server price, not client price
    plan: plan
  };
}

/**
 * Verify USDT transaction on blockchain
 * Fixes: CRITICAL - USDT payment verification bypass
 */
async function verifyUSDTTransaction(txHash, expectedAmount, recipientAddress) {
  if (!txHash || !expectedAmount || !recipientAddress) {
    throw new Error('Missing transaction parameters');
  }

  // Verify transaction on blockchain (example using TronGrid API)
  try {
    const response = await fetch(
      `https://api.trongrid.io/v1/transactions/${txHash}`,
      {
        headers: {
          'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY || ''
        }
      }
    );

    if (!response.ok) {
      throw new Error('Transaction not found on blockchain');
    }

    const txData = await response.json();

    // Verify transaction details
    const tx = txData.data?.[0];
    if (!tx) {
      throw new Error('Invalid transaction data');
    }

    // Check transaction success
    if (tx.ret?.[0]?.contractRet !== 'SUCCESS') {
      throw new Error('Transaction failed on blockchain');
    }

    // Verify recipient address
    const toAddress = tx.raw_data?.contract?.[0]?.parameter?.value?.to_address;
    if (toAddress !== recipientAddress) {
      throw new Error('Transaction sent to wrong address');
    }

    // Verify amount (USDT has 6 decimals)
    const amount = tx.raw_data?.contract?.[0]?.parameter?.value?.amount;
    const expectedAmountInUnits = Math.floor(expectedAmount * 1000000); // Convert to smallest unit

    if (amount < expectedAmountInUnits) {
      throw new Error(`Insufficient amount: ${amount / 1000000} USDT (expected: ${expectedAmount} USDT)`);
    }

    // Check transaction age (prevent replay attacks)
    const txTimestamp = tx.block_timestamp;
    const now = Date.now();
    const txAge = now - txTimestamp;
    const MAX_TX_AGE = 3600000; // 1 hour

    if (txAge > MAX_TX_AGE) {
      throw new Error('Transaction too old (possible replay attack)');
    }

    return {
      valid: true,
      txHash,
      amount: amount / 1000000,
      timestamp: txTimestamp,
      blockNumber: tx.blockNumber
    };
  } catch (error) {
    throw new Error(`USDT verification failed: ${error.message}`);
  }
}

/**
 * Generate payment session with server-side pricing
 */
async function createPaymentSession(userId, plan) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  const pricing = validatePaymentPrice(plan, null);

  // Create Stripe session with server-side pricing
  const session = await stripe.checkout.sessions.create({
    customer_email: userId,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        },
        unit_amount: Math.round(pricing.price * 100), // Convert to cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/payment/cancel`,
    metadata: {
      userId,
      plan,
      credits: PRICING_PLANS[plan].credits
    }
  });

  return session;
}

/**
 * Prevent payment replay attacks
 */
const processedTransactions = new Set();

function preventReplayAttack(txId) {
  if (processedTransactions.has(txId)) {
    throw new Error('Transaction already processed (replay attack detected)');
  }

  processedTransactions.add(txId);

  // Clean up old transactions after 24 hours
  setTimeout(() => {
    processedTransactions.delete(txId);
  }, 24 * 60 * 60 * 1000);
}

module.exports = {
  PRICING_PLANS,
  validateStripeWebhook,
  validatePaymentPrice,
  verifyUSDTTransaction,
  createPaymentSession,
  preventReplayAttack
};
