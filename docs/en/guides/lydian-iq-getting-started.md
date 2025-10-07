# Getting Started with LyDian IQ API

## Overview

LyDian IQ is an advanced reasoning engine and knowledge graph platform that powers intelligent decision-making, signal processing, event correlation, and semantic knowledge management. It serves as the "brain" of the LyDian ecosystem, connecting insights across Smart Cities and İnsan IQ modules.

**What You'll Learn:**
- Authenticate with the LyDian IQ API
- Create and query knowledge graphs
- Ingest and process signals
- Set up event correlation rules
- Execute reasoning workflows
- Build intelligent recommendation systems

**Time to Complete:** 30-45 minutes

## Prerequisites

- LyDian API account ([Sign up](https://lydian.com/signup))
- API key or OAuth2 credentials
- Node.js 18+ or Python 3.8+
- Basic understanding of graph databases and event-driven systems

## What is LyDian IQ?

LyDian IQ provides:

- **Knowledge Graph**: Semantic data modeling with entities, relationships, and attributes
- **Signal Processing**: Real-time ingestion and analysis of data streams
- **Event Correlation**: Pattern matching and complex event processing
- **Reasoning Engine**: Rule-based and ML-powered inference
- **Metrics & Analytics**: Advanced analytics and KPI tracking

## Quick Start

### Step 1: Install SDK

**TypeScript/JavaScript:**
```bash
npm install @lydian/sdk
```

**Python:**
```bash
pip install lydian-sdk
```

**Go:**
```bash
go get github.com/lydian/go-sdk
```

### Step 2: Initialize Client

**TypeScript:**
```typescript
import { Lydian } from '@lydian/sdk';

const client = new Lydian({
  apiKey: process.env.LYDIAN_API_KEY,
  // Or use OAuth2
  oauth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  }
});
```

**Python:**
```python
from lydian import Lydian

client = Lydian(
    api_key=os.environ['LYDIAN_API_KEY']
)
```

**Go:**
```go
import "github.com/lydian/go-sdk"

client := lydian.NewClient(
    lydian.WithAPIKey(os.Getenv("LYDIAN_API_KEY")),
)
```

### Step 3: Create a Knowledge Graph

Knowledge graphs represent entities and their relationships.

**TypeScript:**
```typescript
// Create a knowledge graph for a supply chain
const graph = await client.lydianIQ.createGraph({
  name: 'Supply Chain Network',
  description: 'Manufacturing and logistics knowledge graph',
  schema: {
    entities: [
      {
        type: 'supplier',
        properties: {
          name: 'string',
          location: 'geography',
          certifications: 'string[]',
          rating: 'number'
        }
      },
      {
        type: 'product',
        properties: {
          sku: 'string',
          name: 'string',
          category: 'string',
          price: 'number'
        }
      },
      {
        type: 'warehouse',
        properties: {
          name: 'string',
          location: 'geography',
          capacity: 'number'
        }
      }
    ],
    relationships: [
      {
        type: 'supplies',
        from: 'supplier',
        to: 'product',
        properties: {
          leadTime: 'number',
          minOrderQty: 'number'
        }
      },
      {
        type: 'stores',
        from: 'warehouse',
        to: 'product',
        properties: {
          quantity: 'number',
          reorderPoint: 'number'
        }
      }
    ]
  }
});

console.log(`Created graph: ${graph.id}`);
console.log(`Schema version: ${graph.schemaVersion}`);
```

**Python:**
```python
graph = client.lydian_iq.create_graph(
    name='Supply Chain Network',
    description='Manufacturing and logistics knowledge graph',
    schema={
        'entities': [
            {
                'type': 'supplier',
                'properties': {
                    'name': 'string',
                    'location': 'geography',
                    'certifications': 'string[]',
                    'rating': 'number'
                }
            },
            {
                'type': 'product',
                'properties': {
                    'sku': 'string',
                    'name': 'string',
                    'category': 'string',
                    'price': 'number'
                }
            }
        ],
        'relationships': [
            {
                'type': 'supplies',
                'from': 'supplier',
                'to': 'product',
                'properties': {
                    'lead_time': 'number',
                    'min_order_qty': 'number'
                }
            }
        ]
    }
)

print(f"Graph created: {graph.id}")
```

### Step 4: Add Nodes (Entities) to Graph

**TypeScript:**
```typescript
// Add supplier nodes
const supplier1 = await client.lydianIQ.createNode({
  graphId: graph.id,
  type: 'supplier',
  properties: {
    name: 'TechParts Inc',
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749] // San Francisco
    },
    certifications: ['ISO9001', 'ISO14001'],
    rating: 4.7
  }
});

const supplier2 = await client.lydianIQ.createNode({
  graphId: graph.id,
  type: 'supplier',
  properties: {
    name: 'Global Components Ltd',
    location: {
      type: 'Point',
      coordinates: [139.6917, 35.6895] // Tokyo
    },
    certifications: ['ISO9001', 'RoHS'],
    rating: 4.5
  }
});

// Add product nodes
const product = await client.lydianIQ.createNode({
  graphId: graph.id,
  type: 'product',
  properties: {
    sku: 'CHIP-001',
    name: 'Microprocessor X1',
    category: 'Electronics',
    price: 45.99
  }
});

console.log(`Created nodes: ${supplier1.id}, ${supplier2.id}, ${product.id}`);
```

### Step 5: Create Relationships (Edges)

**TypeScript:**
```typescript
// Link suppliers to products
const edge1 = await client.lydianIQ.createEdge({
  graphId: graph.id,
  type: 'supplies',
  fromNodeId: supplier1.id,
  toNodeId: product.id,
  properties: {
    leadTime: 7, // days
    minOrderQty: 1000
  }
});

const edge2 = await client.lydianIQ.createEdge({
  graphId: graph.id,
  type: 'supplies',
  fromNodeId: supplier2.id,
  toNodeId: product.id,
  properties: {
    leadTime: 14,
    minOrderQty: 5000
  }
});

console.log('Relationships created');
```

### Step 6: Query the Knowledge Graph

**Cypher-like Query Syntax:**

```typescript
// Find all suppliers of a specific product
const results = await client.lydianIQ.query({
  graphId: graph.id,
  query: `
    MATCH (s:supplier)-[r:supplies]->(p:product {sku: 'CHIP-001'})
    RETURN s.name, s.rating, r.leadTime, r.minOrderQty
    ORDER BY s.rating DESC
  `
});

console.log('Suppliers:');
results.forEach(row => {
  console.log(`  ${row['s.name']}: Rating ${row['s.rating']}, Lead time ${row['r.leadTime']} days`);
});
```

**Response:**
```json
[
  {
    "s.name": "TechParts Inc",
    "s.rating": 4.7,
    "r.leadTime": 7,
    "r.minOrderQty": 1000
  },
  {
    "s.name": "Global Components Ltd",
    "s.rating": 4.5,
    "r.leadTime": 14,
    "r.minOrderQty": 5000
  }
]
```

**Path Finding:**

```typescript
// Find shortest path between two entities
const path = await client.lydianIQ.findPath({
  graphId: graph.id,
  startNodeId: supplier1.id,
  endNodeId: warehouse.id,
  maxDepth: 5,
  relationshipTypes: ['supplies', 'stores', 'ships_to']
});

console.log('Path found:', path.nodes.length, 'nodes');
path.nodes.forEach((node, i) => {
  console.log(`  ${i + 1}. ${node.type}: ${node.properties.name}`);
});
```

### Step 7: Ingest Real-Time Signals

Signals are time-series data points that trigger reasoning workflows.

**TypeScript:**
```typescript
// Create a signal channel
const channel = await client.lydianIQ.createSignalChannel({
  name: 'inventory_levels',
  description: 'Real-time inventory level signals',
  schema: {
    productId: 'string',
    warehouseId: 'string',
    quantity: 'number',
    timestamp: 'datetime'
  },
  retention: '90d' // Keep signals for 90 days
});

// Ingest signals
await client.lydianIQ.ingestSignals({
  channelId: channel.id,
  signals: [
    {
      productId: 'CHIP-001',
      warehouseId: 'WH-SF',
      quantity: 450,
      timestamp: new Date().toISOString()
    },
    {
      productId: 'CHIP-002',
      warehouseId: 'WH-SF',
      quantity: 1200,
      timestamp: new Date().toISOString()
    }
  ]
});

console.log('Signals ingested');
```

**Python:**
```python
channel = client.lydian_iq.create_signal_channel(
    name='inventory_levels',
    description='Real-time inventory level signals',
    schema={
        'product_id': 'string',
        'warehouse_id': 'string',
        'quantity': 'number',
        'timestamp': 'datetime'
    },
    retention='90d'
)

client.lydian_iq.ingest_signals(
    channel_id=channel.id,
    signals=[
        {
            'product_id': 'CHIP-001',
            'warehouse_id': 'WH-SF',
            'quantity': 450,
            'timestamp': datetime.now().isoformat()
        }
    ]
)
```

### Step 8: Set Up Event Correlation Rules

Event correlation detects patterns across multiple signals.

**TypeScript:**
```typescript
const rule = await client.lydianIQ.createCorrelationRule({
  name: 'Low Inventory Alert',
  description: 'Trigger when inventory drops below reorder point',
  conditions: [
    {
      channel: 'inventory_levels',
      filter: 'quantity < node.reorderPoint',
      window: '5m'
    }
  ],
  actions: [
    {
      type: 'create_event',
      eventType: 'inventory.low',
      severity: 'high',
      payload: {
        productId: '{{signal.productId}}',
        warehouseId: '{{signal.warehouseId}}',
        currentQty: '{{signal.quantity}}',
        reorderPoint: '{{node.reorderPoint}}'
      }
    },
    {
      type: 'webhook',
      url: 'https://yourapp.com/webhooks/inventory-alerts',
      method: 'POST'
    }
  ],
  enabled: true
});

console.log(`Created correlation rule: ${rule.id}`);
```

**Complex Pattern Matching:**

```typescript
// Detect supply chain disruption (multiple suppliers delayed)
const disruption = await client.lydianIQ.createCorrelationRule({
  name: 'Supply Chain Disruption',
  description: 'Detect when 3+ suppliers report delays within 1 hour',
  conditions: [
    {
      channel: 'supplier_updates',
      filter: 'status == "delayed"',
      window: '1h',
      aggregation: 'count',
      threshold: 3
    }
  ],
  actions: [
    {
      type: 'create_event',
      eventType: 'supply_chain.disruption',
      severity: 'critical'
    },
    {
      type: 'execute_reasoning',
      workflowId: 'find_alternative_suppliers'
    }
  ]
});
```

### Step 9: Execute Reasoning Workflows

Reasoning workflows are multi-step decision processes.

**TypeScript:**
```typescript
const workflow = await client.lydianIQ.createReasoningWorkflow({
  name: 'Optimize Supplier Selection',
  description: 'Find best supplier based on price, lead time, and rating',
  steps: [
    {
      id: 'query_suppliers',
      type: 'graph_query',
      query: `
        MATCH (s:supplier)-[r:supplies]->(p:product {id: $productId})
        RETURN s, r
      `,
      output: 'suppliers'
    },
    {
      id: 'score_suppliers',
      type: 'calculation',
      formula: `
        score = (s.rating / 5) * 0.4 +
                (30 - r.leadTime) / 30 * 0.3 +
                (1 - p.price / maxPrice) * 0.3
      `,
      output: 'scored_suppliers'
    },
    {
      id: 'select_best',
      type: 'filter',
      condition: 'score == MAX(score)',
      output: 'best_supplier'
    },
    {
      id: 'create_recommendation',
      type: 'output',
      template: {
        supplierId: '{{best_supplier.id}}',
        supplierName: '{{best_supplier.name}}',
        score: '{{best_supplier.score}}',
        reasoning: 'Selected based on rating ({{s.rating}}), lead time ({{r.leadTime}} days), and competitive pricing'
      }
    }
  ]
});

// Execute workflow
const result = await client.lydianIQ.executeWorkflow({
  workflowId: workflow.id,
  inputs: {
    productId: 'CHIP-001'
  }
});

console.log('Best Supplier:', result.supplierName);
console.log('Score:', result.score);
console.log('Reasoning:', result.reasoning);
```

**Python:**
```python
workflow = client.lydian_iq.create_reasoning_workflow(
    name='Optimize Supplier Selection',
    steps=[
        {
            'id': 'query_suppliers',
            'type': 'graph_query',
            'query': '''
                MATCH (s:supplier)-[r:supplies]->(p:product {id: $productId})
                RETURN s, r
            ''',
            'output': 'suppliers'
        },
        {
            'id': 'score_suppliers',
            'type': 'calculation',
            'formula': '''
                score = (s.rating / 5) * 0.4 +
                        (30 - r.leadTime) / 30 * 0.3 +
                        (1 - p.price / maxPrice) * 0.3
            ''',
            'output': 'scored_suppliers'
        }
    ]
)

result = client.lydian_iq.execute_workflow(
    workflow_id=workflow.id,
    inputs={'product_id': 'CHIP-001'}
)
```

### Step 10: Track Metrics and KPIs

**TypeScript:**
```typescript
// Define KPI
const kpi = await client.lydianIQ.createMetric({
  name: 'supplier_performance',
  description: 'Supplier on-time delivery performance',
  type: 'percentage',
  calculation: {
    numerator: 'COUNT(deliveries WHERE onTime == true)',
    denominator: 'COUNT(deliveries)',
    window: '30d'
  },
  targets: {
    critical: 90,
    warning: 95,
    optimal: 98
  }
});

// Query metric value
const performance = await client.lydianIQ.getMetricValue({
  metricId: kpi.id,
  supplierId: supplier1.id,
  timeRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  }
});

console.log(`Supplier Performance: ${performance.value}%`);
console.log(`Status: ${performance.status}`); // critical, warning, optimal
```

## Advanced Features

### Semantic Search

Find entities by meaning, not just keywords.

```typescript
const results = await client.lydianIQ.semanticSearch({
  graphId: graph.id,
  query: 'reliable electronics suppliers in Asia',
  limit: 10
});

results.forEach(result => {
  console.log(`${result.name} (relevance: ${result.score})`);
});
```

### Graph Embeddings

Generate vector embeddings for machine learning.

```typescript
const embedding = await client.lydianIQ.getNodeEmbedding({
  graphId: graph.id,
  nodeId: supplier1.id,
  model: 'node2vec' // or 'graphsage', 'gcn'
});

console.log('Embedding:', embedding.vector); // [0.23, -0.45, 0.67, ...]
```

### Anomaly Detection

Detect unusual patterns in signal streams.

```typescript
const anomalies = await client.lydianIQ.detectAnomalies({
  channelId: 'inventory_levels',
  timeRange: {
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  },
  algorithm: 'isolation_forest',
  sensitivity: 0.85
});

console.log(`Found ${anomalies.length} anomalies`);
anomalies.forEach(a => {
  console.log(`  ${a.timestamp}: ${a.description} (score: ${a.anomalyScore})`);
});
```

## Authentication

### API Key
```typescript
const client = new Lydian({
  apiKey: 'sk_live_abc123def456'
});
```

### OAuth2
```typescript
const authUrl = client.oauth.getAuthorizationUrl({
  redirectUri: 'https://yourapp.com/callback',
  scope: ['lydian_iq:read', 'lydian_iq:write']
});

// After user authorizes
const tokens = await client.oauth.exchangeCodeForTokens({
  code: req.query.code
});

const authenticatedClient = new Lydian({
  accessToken: tokens.accessToken
});
```

## Rate Limits

| Plan | Requests/Hour | Graph Queries/Min | Signal Ingestion/Sec |
|------|---------------|-------------------|----------------------|
| Free | 100 | 10 | 10 |
| Pro | 10,000 | 100 | 1,000 |
| Enterprise | Unlimited | Unlimited | 100,000 |

## Error Handling

```typescript
try {
  const graph = await client.lydianIQ.createGraph({ ... });
} catch (error) {
  if (error.type === 'validation_error') {
    console.error('Invalid schema:', error.details);
  } else if (error.type === 'quota_exceeded') {
    console.error('Graph limit reached. Upgrade plan.');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Best Practices

### 1. Batch Signal Ingestion
```typescript
// Good: Batch signals
await client.lydianIQ.ingestSignals({
  channelId: channel.id,
  signals: batchOf100Signals
});

// Bad: Individual calls
for (const signal of signals) {
  await client.lydianIQ.ingestSignal({ ... }); // Slow!
}
```

### 2. Use Graph Indexes
```typescript
// Create index for frequent queries
await client.lydianIQ.createIndex({
  graphId: graph.id,
  entityType: 'product',
  property: 'sku'
});
```

### 3. Cache Query Results
```typescript
const cache = new Map();

async function findSuppliers(productId: string) {
  const cacheKey = `suppliers:${productId}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const result = await client.lydianIQ.query({ ... });
  cache.set(cacheKey, result);

  return result;
}
```

## Use Cases

### Supply Chain Optimization
- Track inventory, suppliers, warehouses in knowledge graph
- Detect disruptions via signal correlation
- Optimize decisions with reasoning workflows

### Fraud Detection
- Model transaction networks as graphs
- Detect anomalous patterns in real-time signals
- Execute fraud scoring workflows

### Smart City Intelligence
- Connect IoT sensors, infrastructure, and services
- Correlate events across domains (traffic, energy, safety)
- Generate actionable insights with reasoning engine

### Healthcare Decision Support
- Model patient journeys, treatments, outcomes
- Detect adverse events from clinical signals
- Recommend treatment plans via reasoning workflows

## Next Steps

**Learn More:**
- [Knowledge Graph Deep Dive](./lydian-iq-knowledge-graphs.md)
- [Signal Processing Guide](./lydian-iq-signals.md)
- [Event Correlation Patterns](./lydian-iq-events.md)
- [Reasoning Workflows](./lydian-iq-reasoning.md)

**Integrate with Other Modules:**
- [Smart Cities Integration](../guides/smart-cities-getting-started.md)
- [İnsan IQ Integration](../guides/insan-iq-getting-started.md)

**API Reference:**
- [LyDian IQ API Reference](../api/lydian-iq-api.md)

## Support

- **Documentation**: [https://docs.lydian.com](https://docs.lydian.com)
- **API Status**: [https://status.lydian.com](https://status.lydian.com)
- **Community**: [https://community.lydian.com](https://community.lydian.com)
- **Support Email**: support@lydian.com
