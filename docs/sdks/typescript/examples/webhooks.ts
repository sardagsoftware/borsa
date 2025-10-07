import { verifyHmacSignature } from '@lydian/sdk';
import express from 'express';

const app = express();
app.use(express.raw({ type: 'application/json' }));

const WEBHOOK_SECRET = process.env.LYDIAN_WEBHOOK_SECRET!;

// Webhook endpoint
app.post('/webhooks/lydian', (req, res) => {
  const signature = req.headers['x-lydian-signature'] as string;
  const payload = req.body.toString();

  // Verify webhook signature
  const isValid = verifyHmacSignature(payload, signature, WEBHOOK_SECRET);

  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse webhook payload
  const event = JSON.parse(payload);

  console.log('Webhook event:', event.type);

  // Handle different event types
  switch (event.type) {
    case 'city.created':
      console.log('New city created:', event.data);
      break;

    case 'alert.created':
      console.log('New alert:', event.data);
      // Send notification, trigger automation, etc.
      break;

    case 'signal.processed':
      console.log('Signal processed:', event.data);
      break;

    case 'insight.generated':
      console.log('New insight:', event.data);
      break;

    default:
      console.log('Unknown event type:', event.type);
  }

  res.json({ received: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});

// Example: Manually verify signature
function manualVerification() {
  const payload = '{"type":"city.created","data":{"id":"123"}}';
  const signature = 'abc123...'; // From X-Lydian-Signature header

  const isValid = verifyHmacSignature(payload, signature, WEBHOOK_SECRET);

  if (isValid) {
    console.log('Signature is valid');
  } else {
    console.log('Signature is invalid');
  }
}
