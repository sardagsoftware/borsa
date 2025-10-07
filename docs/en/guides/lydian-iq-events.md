# LyDian IQ Events Guide

Complete guide to event-driven architecture, event processing, and complex event correlation with the LyDian IQ platform.

## Table of Contents

- [Overview](#overview)
- [Event Fundamentals](#event-fundamentals)
- [Publishing Events](#publishing-events)
- [Event Subscriptions](#event-subscriptions)
- [Event Processing](#event-processing)
- [Event Correlation](#event-correlation)
- [Event Sourcing](#event-sourcing)
- [Event Replay](#event-replay)
- [Monitoring & Debugging](#monitoring--debugging)
- [Best Practices](#best-practices)

## Overview

LyDian IQ Events provide a robust event-driven architecture for building reactive, scalable systems. The platform enables real-time event processing, complex event correlation, event sourcing patterns, and reliable message delivery across distributed systems.

### Key Features

- **Pub/Sub Messaging**: Publish-subscribe pattern with topic-based routing
- **Event Correlation**: Connect related events across time and systems
- **Event Sourcing**: Store events as the source of truth
- **Event Replay**: Reprocess historical events
- **Dead Letter Queues**: Handle failed event processing
- **Schema Evolution**: Versioned event schemas with backward compatibility
- **Guaranteed Delivery**: At-least-once, exactly-once semantics
- **Event Filtering**: Server-side filtering with custom expressions

### Use Cases

- **Microservices Communication**: Decouple services with event-driven messaging
- **Real-Time Analytics**: Process events as they occur
- **Audit Logs**: Maintain immutable event logs
- **CQRS Patterns**: Command Query Responsibility Segregation
- **Workflow Orchestration**: Coordinate multi-step business processes
- **IoT Data Streams**: Handle high-volume sensor events

## Event Fundamentals

### Event Structure

Every event in LyDian IQ follows a standard structure:

```typescript
import { LyDianIQClient, Event } from '@lydian/lydian-iq';

const client = new LyDianIQClient({
  apiKey: process.env.LYDIAN_IQ_API_KEY,
  environment: 'production'
});

// Standard event structure
interface Event {
  // Metadata (automatically added)
  id: string;                    // Unique event ID
  type: string;                  // Event type (e.g., 'order.created')
  timestamp: Date;               // When event occurred
  source: string;                // Origin system/service
  specversion: string;           // CloudEvents spec version

  // Data
  data: any;                     // Event payload
  datacontenttype?: string;      // Content type (default: application/json)

  // Optional metadata
  subject?: string;              // What the event is about
  correlationid?: string;        // Correlate related events
  causationid?: string;          // Event that caused this event
  metadata?: Record<string, any>; // Custom metadata
}
```

### Event Types

Define event schemas for type safety:

```typescript
// Define event types
const orderEvents = {
  CREATED: 'order.created',
  UPDATED: 'order.updated',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  CANCELLED: 'order.cancelled'
} as const;

// Event schema
interface OrderCreatedEvent {
  type: typeof orderEvents.CREATED;
  data: {
    orderId: string;
    customerId: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    shippingAddress: {
      street: string;
      city: string;
      country: string;
      postalCode: string;
    };
  };
  metadata: {
    version: '1.0';
    source: 'order-service';
  };
}

// Create event schema registry
await client.events.registerSchema({
  type: orderEvents.CREATED,
  version: '1.0',
  schema: {
    type: 'object',
    properties: {
      orderId: { type: 'string', format: 'uuid' },
      customerId: { type: 'string', format: 'uuid' },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
            price: { type: 'number', minimum: 0 }
          },
          required: ['productId', 'quantity', 'price']
        }
      },
      totalAmount: { type: 'number', minimum: 0 },
      shippingAddress: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          postalCode: { type: 'string' }
        },
        required: ['street', 'city', 'country', 'postalCode']
      }
    },
    required: ['orderId', 'customerId', 'items', 'totalAmount', 'shippingAddress']
  }
});
```

## Publishing Events

### Simple Event Publishing

Publish events to topics:

```typescript
// Publish a single event
await client.events.publish({
  type: 'order.created',
  data: {
    orderId: 'ord_123',
    customerId: 'cust_456',
    items: [
      {
        productId: 'prod_789',
        quantity: 2,
        price: 29.99
      }
    ],
    totalAmount: 59.98,
    shippingAddress: {
      street: '123 Main St',
      city: 'New York',
      country: 'USA',
      postalCode: '10001'
    }
  },
  metadata: {
    source: 'order-service',
    version: '1.0'
  }
});

console.log('Event published successfully');
```

### Batch Publishing

Publish multiple events efficiently:

```typescript
// Batch publish for higher throughput
const events = [
  {
    type: 'inventory.updated',
    data: { productId: 'prod_789', quantity: 98 }
  },
  {
    type: 'notification.sent',
    data: { userId: 'cust_456', channel: 'email', template: 'order_confirmation' }
  },
  {
    type: 'analytics.tracked',
    data: { event: 'purchase', properties: { revenue: 59.98 } }
  }
];

const result = await client.events.publishBatch(events);

console.log('Published:', result.successful);
console.log('Failed:', result.failed);
```

### Transactional Publishing

Ensure atomic event publishing:

```python
from lydian import LyDianIQClient

client = LyDianIQClient(api_key=os.environ['LYDIAN_IQ_API_KEY'])

# Transactional event publishing
async with client.events.transaction() as tx:
    # All events published in this block are committed atomically

    await tx.publish({
        'type': 'order.created',
        'data': order_data
    })

    await tx.publish({
        'type': 'inventory.reserved',
        'data': inventory_data
    })

    await tx.publish({
        'type': 'payment.pending',
        'data': payment_data
    })

    # If any error occurs, all events are rolled back
    # Otherwise, all events are published atomically on commit

print("All events published atomically")
```

### Event Publishing with Guarantees

Control delivery semantics:

```typescript
// At-least-once delivery (default)
await client.events.publish({
  type: 'order.created',
  data: orderData,
  delivery: {
    semantics: 'at-least-once',
    retry: {
      maxAttempts: 3,
      backoff: 'exponential'
    }
  }
});

// Exactly-once delivery (idempotent)
await client.events.publish({
  type: 'payment.processed',
  data: paymentData,
  delivery: {
    semantics: 'exactly-once',
    idempotencyKey: `payment_${paymentId}`,
    retry: {
      maxAttempts: 5,
      backoff: 'exponential',
      maxBackoff: 60000 // 1 minute
    }
  }
});

// Fire-and-forget (best effort)
await client.events.publish({
  type: 'analytics.pageview',
  data: analyticsData,
  delivery: {
    semantics: 'best-effort',
    timeout: 1000 // 1 second
  }
});
```

## Event Subscriptions

### Topic Subscriptions

Subscribe to event topics:

```typescript
// Subscribe to specific event type
const subscription = await client.events.subscribe({
  topic: 'order.created',
  handler: async (event) => {
    console.log('Order created:', event.data.orderId);

    // Process the event
    await processOrder(event.data);
  },
  options: {
    batchSize: 10,
    maxWaitTime: 5000, // 5 seconds
    concurrency: 5
  }
});

console.log('Subscription ID:', subscription.id);
```

### Wildcard Subscriptions

Subscribe to multiple event types:

```typescript
// Subscribe to all order events
await client.events.subscribe({
  topic: 'order.*',  // Matches order.created, order.updated, etc.
  handler: async (event) => {
    console.log('Order event:', event.type);

    switch (event.type) {
      case 'order.created':
        await handleOrderCreated(event);
        break;
      case 'order.shipped':
        await handleOrderShipped(event);
        break;
      case 'order.delivered':
        await handleOrderDelivered(event);
        break;
    }
  }
});

// Subscribe to all events (careful with volume!)
await client.events.subscribe({
  topic: '*',
  handler: async (event) => {
    // Log all events for debugging
    await auditLog.write(event);
  }
});
```

### Filtered Subscriptions

Server-side event filtering:

```go
package main

import (
    "github.com/lydian/lydian-iq-go"
)

func subscribeWithFilters() {
    client := lydianiq.NewClient(os.Getenv("LYDIAN_IQ_API_KEY"))

    // Subscribe with filter expression
    subscription, err := client.Events.Subscribe(&lydianiq.SubscriptionConfig{
        Topic: "order.*",
        Filter: &lydianiq.FilterExpression{
            // SQL-like filter expression
            Expression: "data.totalAmount > 1000 AND data.shippingAddress.country = 'USA'",
        },
        Handler: func(event *lydianiq.Event) error {
            fmt.Printf("High-value US order: %s\n", event.Data["orderId"])
            return processHighValueOrder(event)
        },
        Options: &lydianiq.SubscriptionOptions{
            BatchSize:   20,
            Concurrency: 10,
        },
    })

    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Subscription created: %s\n", subscription.ID)
}
```

### Consumer Groups

Distribute event processing across multiple consumers:

```typescript
// Consumer group for load balancing
await client.events.subscribe({
  topic: 'order.created',
  consumerGroup: 'order-processors',
  handler: async (event) => {
    // Events are distributed across all consumers in the group
    await processOrder(event.data);
  },
  options: {
    // Partition assignment strategy
    assignmentStrategy: 'round-robin', // or 'sticky', 'range'

    // Auto-commit offset after successful processing
    autoCommit: true,
    commitInterval: 5000, // 5 seconds

    // Session timeout
    sessionTimeout: 30000, // 30 seconds

    // Heartbeat interval
    heartbeatInterval: 3000 // 3 seconds
  }
});
```

## Event Processing

### Stream Processing

Process event streams in real-time:

```typescript
// Create event processing pipeline
const pipeline = await client.events.createPipeline({
  name: 'order-processing-pipeline',
  source: {
    topic: 'order.created'
  },
  processors: [
    // Enrich with customer data
    {
      type: 'enrich',
      lookup: {
        service: 'customer-service',
        key: 'data.customerId',
        target: 'customer'
      }
    },

    // Filter high-value orders
    {
      type: 'filter',
      condition: 'data.totalAmount > 500'
    },

    // Transform event
    {
      type: 'transform',
      script: `
        return {
          ...event,
          data: {
            ...event.data,
            priorityShipping: event.data.totalAmount > 1000,
            customerTier: event.customer.tier
          }
        }
      `
    },

    // Branch based on customer tier
    {
      type: 'branch',
      conditions: [
        {
          when: 'customer.tier === "premium"',
          publish: 'order.premium-queue'
        },
        {
          when: 'customer.tier === "standard"',
          publish: 'order.standard-queue'
        }
      ]
    }
  ],
  errorHandling: {
    deadLetterQueue: 'order-processing-dlq',
    maxRetries: 3
  }
});

// Start pipeline
await pipeline.start();
```

### Event Aggregation

Aggregate events over time windows:

```python
# Aggregate events in tumbling windows
aggregation = client.events.create_aggregation(
    name='order-metrics-hourly',
    source_topic='order.created',
    window={
        'type': 'tumbling',
        'size': '1h'
    },
    aggregations=[
        {
            'function': 'count',
            'output': 'order_count'
        },
        {
            'function': 'sum',
            'field': 'data.totalAmount',
            'output': 'total_revenue'
        },
        {
            'function': 'avg',
            'field': 'data.totalAmount',
            'output': 'avg_order_value'
        },
        {
            'function': 'collect_list',
            'field': 'data.customerId',
            'output': 'customer_ids'
        }
    ],
    output_topic='metrics.orders.hourly'
)

# Start aggregation
aggregation.start()
```

### Stateful Processing

Maintain state across events:

```typescript
// Stateful event processor
const processor = await client.events.createStatefulProcessor({
  name: 'shopping-cart-processor',
  topic: 'cart.*',
  stateStore: {
    type: 'key-value',
    backend: 'redis',
    ttl: 86400 // 24 hours
  },
  handler: async (event, state) => {
    const cartId = event.data.cartId;

    // Get current cart state
    let cart = await state.get(cartId) || {
      items: [],
      total: 0
    };

    // Process event based on type
    switch (event.type) {
      case 'cart.item-added':
        cart.items.push(event.data.item);
        cart.total += event.data.item.price * event.data.item.quantity;
        break;

      case 'cart.item-removed':
        cart.items = cart.items.filter(i => i.productId !== event.data.productId);
        cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        break;

      case 'cart.cleared':
        cart = { items: [], total: 0 };
        break;
    }

    // Update state
    await state.set(cartId, cart);

    // Publish updated cart event
    await client.events.publish({
      type: 'cart.updated',
      data: {
        cartId,
        cart,
        timestamp: new Date()
      }
    });
  }
});
```

## Event Correlation

### Correlation IDs

Track related events:

```typescript
// Parent event
const orderId = 'ord_123';
const correlationId = uuidv4();

await client.events.publish({
  type: 'order.created',
  data: orderData,
  correlationid: correlationId,
  metadata: {
    orderId
  }
});

// Related events share the same correlation ID
await client.events.publish({
  type: 'payment.initiated',
  data: paymentData,
  correlationid: correlationId,
  causationid: orderId, // Reference to the event that caused this
  metadata: {
    orderId
  }
});

await client.events.publish({
  type: 'inventory.reserved',
  data: inventoryData,
  correlationid: correlationId,
  causationid: orderId,
  metadata: {
    orderId
  }
});

// Query all correlated events
const relatedEvents = await client.events.query({
  correlationid: correlationId,
  orderBy: 'timestamp',
  limit: 100
});

console.log('Event chain:', relatedEvents);
```

### Complex Event Processing (CEP)

Detect patterns across multiple events:

```typescript
// Define CEP pattern
const fraudDetectionPattern = await client.events.createPattern({
  name: 'potential-fraud-detection',
  pattern: {
    sequence: [
      {
        type: 'user.login',
        condition: 'data.loginAttempts >= 5',
        within: '5m',
        alias: 'suspicious_login'
      },
      {
        type: 'transaction.initiated',
        condition: 'data.amount > 5000',
        within: '10m',
        after: 'suspicious_login',
        where: 'data.userId = suspicious_login.data.userId',
        alias: 'large_transaction'
      },
      {
        type: 'user.location-changed',
        condition: 'distance(data.location, suspicious_login.data.location) > 1000',
        within: '15m',
        after: 'large_transaction',
        alias: 'location_anomaly'
      }
    ]
  },
  action: {
    type: 'publish',
    event: {
      type: 'fraud.potential-detected',
      data: {
        userId: '${suspicious_login.data.userId}',
        severity: 'high',
        triggers: ['multiple_failed_logins', 'large_transaction', 'location_anomaly'],
        events: ['${suspicious_login.id}', '${large_transaction.id}', '${location_anomaly.id}']
      }
    },
    notifications: ['fraud-team@company.com']
  }
});
```

### Event Sagas

Coordinate long-running distributed transactions:

```go
// Define saga
saga, err := client.Events.CreateSaga(&lydianiq.SagaDefinition{
    Name: "order-fulfillment-saga",
    Steps: []lydianiq.SagaStep{
        {
            Name: "reserve-inventory",
            Execute: &lydianiq.EventAction{
                Publish: lydianiq.Event{
                    Type: "inventory.reserve",
                    Data: map[string]interface{}{
                        "orderId": "${order.id}",
                        "items":   "${order.items}",
                    },
                },
                WaitFor: "inventory.reserved",
                Timeout: "30s",
            },
            Compensate: &lydianiq.EventAction{
                Publish: lydianiq.Event{
                    Type: "inventory.release",
                    Data: map[string]interface{}{
                        "orderId": "${order.id}",
                    },
                },
            },
        },
        {
            Name: "charge-payment",
            Execute: &lydianiq.EventAction{
                Publish: lydianiq.Event{
                    Type: "payment.charge",
                    Data: map[string]interface{}{
                        "orderId":     "${order.id}",
                        "amount":      "${order.totalAmount}",
                        "customerId":  "${order.customerId}",
                    },
                },
                WaitFor: "payment.charged",
                Timeout: "60s",
            },
            Compensate: &lydianiq.EventAction{
                Publish: lydianiq.Event{
                    Type: "payment.refund",
                    Data: map[string]interface{}{
                        "orderId": "${order.id}",
                    },
                },
            },
        },
        {
            Name: "create-shipment",
            Execute: &lydianiq.EventAction{
                Publish: lydianiq.Event{
                    Type: "shipment.create",
                    Data: map[string]interface{}{
                        "orderId": "${order.id}",
                        "address": "${order.shippingAddress}",
                    },
                },
                WaitFor: "shipment.created",
                Timeout: "30s",
            },
            Compensate: &lydianiq.EventAction{
                Publish: lydianiq.Event{
                    Type: "shipment.cancel",
                    Data: map[string]interface{}{
                        "orderId": "${order.id}",
                    },
                },
            },
        },
    },
    OnComplete: &lydianiq.EventAction{
        Publish: lydianiq.Event{
            Type: "order.fulfilled",
            Data: map[string]interface{}{
                "orderId": "${order.id}",
            },
        },
    },
    OnFailure: &lydianiq.EventAction{
        Publish: lydianiq.Event{
            Type: "order.failed",
            Data: map[string]interface{}{
                "orderId": "${order.id}",
                "reason":  "${error.message}",
            },
        },
    },
})
```

## Event Sourcing

### Event Store

Store events as the source of truth:

```python
# Create event-sourced aggregate
class OrderAggregate:
    def __init__(self, order_id: str, client: LyDianIQClient):
        self.order_id = order_id
        self.client = client
        self.version = 0
        self.state = {
            'status': 'pending',
            'items': [],
            'total': 0
        }

    async def create_order(self, customer_id: str, items: list):
        """Create new order"""
        event = {
            'type': 'order.created',
            'data': {
                'orderId': self.order_id,
                'customerId': customer_id,
                'items': items,
                'totalAmount': sum(item['price'] * item['quantity'] for item in items)
            },
            'metadata': {
                'aggregateId': self.order_id,
                'aggregateType': 'order',
                'version': self.version + 1
            }
        }

        # Append to event store
        await self.client.events.append(
            stream=f"order-{self.order_id}",
            events=[event],
            expectedVersion=self.version
        )

        # Apply event to update state
        self._apply_event(event)

    async def ship_order(self, tracking_number: str):
        """Ship the order"""
        if self.state['status'] != 'pending':
            raise ValueError(f"Cannot ship order in status: {self.state['status']}")

        event = {
            'type': 'order.shipped',
            'data': {
                'orderId': self.order_id,
                'trackingNumber': tracking_number,
                'shippedAt': datetime.now().isoformat()
            },
            'metadata': {
                'aggregateId': self.order_id,
                'aggregateType': 'order',
                'version': self.version + 1
            }
        }

        await self.client.events.append(
            stream=f"order-{self.order_id}",
            events=[event],
            expectedVersion=self.version
        )

        self._apply_event(event)

    async def load_from_history(self):
        """Rebuild state from event history"""
        events = await self.client.events.read_stream(
            stream=f"order-{self.order_id}",
            direction='forward'
        )

        for event in events:
            self._apply_event(event)

    def _apply_event(self, event):
        """Apply event to update aggregate state"""
        self.version = event['metadata']['version']

        if event['type'] == 'order.created':
            self.state['status'] = 'pending'
            self.state['items'] = event['data']['items']
            self.state['total'] = event['data']['totalAmount']

        elif event['type'] == 'order.shipped':
            self.state['status'] = 'shipped'
            self.state['trackingNumber'] = event['data']['trackingNumber']

        elif event['type'] == 'order.delivered':
            self.state['status'] = 'delivered'

# Usage
order = OrderAggregate('ord_123', client)
await order.create_order('cust_456', items=[...])
await order.ship_order('TRACK123')
```

### Snapshots

Optimize event sourcing with snapshots:

```typescript
// Create snapshot for faster loading
const snapshotStore = client.events.createSnapshotStore({
  stream: 'order-*',
  snapshotEvery: 100, // Create snapshot every 100 events
  retentionPolicy: {
    keepLast: 5 // Keep last 5 snapshots
  }
});

// Load aggregate with snapshot optimization
async function loadOrder(orderId: string) {
  const streamName = `order-${orderId}`;

  // Try to load latest snapshot
  const snapshot = await client.events.getLatestSnapshot(streamName);

  let order;
  let version = 0;

  if (snapshot) {
    // Start from snapshot
    order = snapshot.data;
    version = snapshot.version;
  } else {
    // Start from empty state
    order = {
      status: 'new',
      items: [],
      total: 0
    };
  }

  // Load events since snapshot
  const events = await client.events.readStream({
    stream: streamName,
    fromVersion: version + 1,
    direction: 'forward'
  });

  // Apply events
  for (const event of events) {
    applyEvent(order, event);
  }

  return order;
}
```

## Event Replay

### Replay Events

Reprocess historical events:

```typescript
// Replay events for debugging or migration
const replay = await client.events.createReplay({
  name: 'order-migration-replay',
  source: {
    stream: 'order-*',
    timeRange: {
      start: '2025-01-01T00:00:00Z',
      end: '2025-12-31T23:59:59Z'
    },
    filter: 'type = "order.created"'
  },
  destination: {
    topic: 'order-migration',
    transform: (event) => ({
      ...event,
      data: {
        ...event.data,
        // Add new field for migration
        migrationVersion: '2.0'
      }
    })
  },
  options: {
    speed: 'fast', // or 'realtime', 'custom'
    batchSize: 1000,
    parallelism: 10
  }
});

// Start replay
await replay.start();

// Monitor progress
replay.on('progress', (stats) => {
  console.log('Replayed:', stats.eventsProcessed);
  console.log('Progress:', stats.percentage, '%');
});

replay.on('complete', () => {
  console.log('Replay completed successfully');
});
```

## Monitoring & Debugging

### Event Tracing

Trace event flow through the system:

```typescript
// Enable distributed tracing
await client.events.publish({
  type: 'order.created',
  data: orderData,
  tracing: {
    enabled: true,
    spanContext: {
      traceId: 'trace_123',
      spanId: 'span_456',
      parentSpanId: 'span_parent'
    }
  }
});

// Query event trace
const trace = await client.events.getTrace('trace_123');

console.log('Event flow:');
trace.spans.forEach(span => {
  console.log(`${span.service}: ${span.operation} (${span.duration}ms)`);
});
```

### Dead Letter Queue

Handle failed events:

```python
# Subscribe to dead letter queue
client.events.subscribe(
    topic='order-processing-dlq',
    handler=lambda event: handle_failed_event(event),
    options={
        'consumerGroup': 'dlq-handlers'
    }
)

def handle_failed_event(event):
    """Process events that failed"""
    failure_info = event.metadata.get('failure')

    print(f"Failed event: {event.type}")
    print(f"Failure reason: {failure_info['reason']}")
    print(f"Retry count: {failure_info['retryCount']}")
    print(f"Last error: {failure_info['lastError']}")

    # Decide what to do
    if failure_info['retryCount'] < 5:
        # Retry with backoff
        time.sleep(2 ** failure_info['retryCount'])
        client.events.retry(event)
    else:
        # Move to manual review queue
        client.events.publish({
            'type': 'event.manual-review-required',
            'data': {
                'originalEvent': event,
                'failureInfo': failure_info
            }
        })
```

## Best Practices

### Event Design

**1. Use Domain Events**

```typescript
// ✅ Good: Domain-specific events
{
  type: 'order.placed',
  data: {
    orderId: 'ord_123',
    customerId: 'cust_456',
    totalAmount: 99.99
  }
}

// ❌ Bad: Generic CRUD events
{
  type: 'database.updated',
  data: {
    table: 'orders',
    id: 123
  }
}
```

**2. Include Sufficient Context**

```typescript
// ✅ Good: Self-contained event
{
  type: 'payment.failed',
  data: {
    paymentId: 'pay_123',
    orderId: 'ord_456',
    amount: 99.99,
    currency: 'USD',
    failureReason: 'insufficient_funds',
    customerId: 'cust_789',
    timestamp: '2025-10-07T10:30:00Z'
  }
}

// ❌ Bad: Missing context
{
  type: 'payment.failed',
  data: {
    id: 'pay_123'
  }
}
```

**3. Immutable Events**

```typescript
// ✅ Good: Publish correction event
await client.events.publish({
  type: 'order.amount-corrected',
  data: {
    orderId: 'ord_123',
    previousAmount: 99.99,
    correctedAmount: 89.99,
    reason: 'discount_applied'
  },
  causationid: originalEventId
});

// ❌ Bad: Modify existing event
// DON'T DO THIS - events should be immutable
```

### Performance Optimization

**1. Batch Processing**

```python
# ✅ Good: Batch events
events = []
for order in orders:
    events.append({
        'type': 'order.created',
        'data': order
    })

client.events.publish_batch(events, batch_size=100)

# ❌ Bad: Publish one by one
for order in orders:
    client.events.publish({
        'type': 'order.created',
        'data': order
    })  # Too many network calls
```

**2. Event Compaction**

```typescript
// Configure log compaction for state updates
await client.events.configureTopic({
  topic: 'user-profile-updates',
  compaction: {
    enabled: true,
    keyField: 'data.userId',
    retentionTime: '7d'
  }
});
```

## Related Documentation

- [LyDian IQ Getting Started](./lydian-iq-getting-started.md)
- [LyDian IQ Signals](./lydian-iq-signals.md)
- [LyDian IQ Knowledge Graphs](./lydian-iq-knowledge-graphs.md)
- [Event-Driven Architecture Concepts](/docs/en/concepts/lydian-iq-event-driven.md)
- [LyDian IQ API Reference](/docs/api/lydian-iq/events)

## Support

- **Documentation**: https://docs.lydian.com
- **API Status**: https://status.lydian.com
- **Support Email**: support@lydian.com
- **Community Forum**: https://community.lydian.com
