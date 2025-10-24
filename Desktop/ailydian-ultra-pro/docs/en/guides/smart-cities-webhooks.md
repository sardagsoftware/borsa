# Smart Cities Webhooks Guide

Complete guide to configuring, managing, and securing webhooks for real-time event notifications in Smart Cities platform.

## Table of Contents

- [Overview](#overview)
- [Creating Webhooks](#creating-webhooks)
- [Event Types](#event-types)
- [Webhook Payload](#webhook-payload)
- [Security](#security)
- [Retry Logic](#retry-logic)
- [Filtering Events](#filtering-events)
- [Testing Webhooks](#testing-webhooks)
- [Monitoring and Debugging](#monitoring-and-debugging)
- [Best Practices](#best-practices)

## Overview

Webhooks enable your application to receive real-time notifications when events occur in the Smart Cities platform.

### Key Features

- **Real-Time Notifications**: Instant event delivery
- **HMAC Signature Verification**: Secure payload authentication
- **Automatic Retries**: Exponential backoff for failed deliveries
- **Event Filtering**: Subscribe to specific event types
- **Delivery Logs**: Track webhook delivery status
- **Custom Headers**: Add authentication tokens
- **Batch Events**: Receive multiple events in single request

### Use Cases

- Alert notifications (threshold breaches, anomalies)
- Asset status changes (online/offline, maintenance)
- Data ingestion confirmations
- System health monitoring
- Audit logging and compliance

## Creating Webhooks

### Basic Webhook

```typescript
import { SmartCitiesClient } from '@lydian/smart-cities';

const client = new SmartCitiesClient({
  apiKey: process.env.SMART_CITIES_API_KEY
});

const webhook = await client.webhooks.create({
  url: 'https://api.example.com/webhooks/smart-cities',
  events: ['alert.triggered', 'asset.offline'],
  description: 'Production webhook for critical alerts'
});

console.log('Webhook created:', webhook.id);
console.log('Secret:', webhook.secret); // Store securely!
```

```python
from lydian import SmartCitiesClient

client = SmartCitiesClient(api_key=os.environ['SMART_CITIES_API_KEY'])

webhook = client.webhooks.create(
    url='https://api.example.com/webhooks/smart-cities',
    events=['alert.triggered', 'asset.offline'],
    description='Production webhook for critical alerts'
)

print(f'Webhook created: {webhook.id}')
print(f'Secret: {webhook.secret}')  # Store securely!
```

## Related Documentation

- [Smart Cities Alerts & Events](./smart-cities-alerts-events.md)
- [Smart Cities Data Ingestion](./smart-cities-data-ingestion.md)
- [Webhooks API Reference](/docs/api/smart-cities/webhooks)

## Support

- **Documentation**: https://docs.lydian.com
- **Support Email**: support@lydian.com
