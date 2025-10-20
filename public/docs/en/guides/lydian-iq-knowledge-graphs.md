# Knowledge Graphs - LyDian IQ

## Overview

Knowledge Graphs in LyDian IQ enable semantic modeling of complex relationships between entities. They provide a powerful foundation for reasoning, recommendation systems, search, and intelligent decision-making across domains such as supply chain, healthcare, finance, and smart cities.

**What You'll Learn:**
- Design and create knowledge graph schemas
- Add nodes (entities) and edges (relationships)
- Query graphs with Cypher-like syntax
- Implement graph algorithms
- Build recommendation systems
- Optimize graph performance

## Graph Architecture

### Core Concepts

```typescript
// Graph Schema
interface Graph {
  id: string;
  name: string;
  description: string;

  schema: {
    entities: EntityType[];
    relationships: RelationshipType[];
  };

  statistics: {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
  };

  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Node (Entity)
interface Node {
  id: string;
  graphId: string;
  type: string;
  properties: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Edge (Relationship)
interface Edge {
  id: string;
  graphId: string;
  type: string;
  fromNodeId: string;
  toNodeId: string;
  properties: Record<string, any>;
  weight?: number;
  directed: boolean;
  createdAt: Date;
}
```

## Creating Knowledge Graphs

### E-Commerce Product Graph

```typescript
import { Lydian } from '@lydian/sdk';

const client = new Lydian({ apiKey: process.env.LYDIAN_API_KEY });

// Create graph schema
const productGraph = await client.lydianIQ.createGraph({
  name: 'E-Commerce Product Knowledge Graph',
  description: 'Products, categories, customers, and purchase relationships',
  schema: {
    entities: [
      {
        type: 'product',
        properties: {
          sku: 'string',
          name: 'string',
          price: 'number',
          category: 'string',
          brand: 'string',
          rating: 'number',
          inStock: 'boolean'
        },
        indexes: ['sku', 'category', 'brand']
      },
      {
        type: 'customer',
        properties: {
          email: 'string',
          name: 'string',
          segment: 'string', // VIP, regular, new
          lifetimeValue: 'number',
          location: 'geography'
        },
        indexes: ['email', 'segment']
      },
      {
        type: 'category',
        properties: {
          name: 'string',
          parentCategory: 'string',
          level: 'number'
        }
      }
    ],
    relationships: [
      {
        type: 'purchased',
        from: 'customer',
        to: 'product',
        properties: {
          quantity: 'number',
          totalPrice: 'number',
          purchaseDate: 'datetime',
          rating: 'number'
        },
        directed: true
      },
      {
        type: 'viewed',
        from: 'customer',
        to: 'product',
        properties: {
          viewCount: 'number',
          lastViewed: 'datetime'
        },
        directed: true
      },
      {
        type: 'belongs_to',
        from: 'product',
        to: 'category',
        directed: true
      },
      {
        type: 'similar_to',
        from: 'product',
        to: 'product',
        properties: {
          similarity: 'number' // 0-1
        },
        directed: false
      }
    ]
  }
});

console.log(`Created graph: ${productGraph.id}`);
```

**Python:**
```python
from lydian import Lydian

client = Lydian(api_key=os.environ['LYDIAN_API_KEY'])

product_graph = client.lydian_iq.create_graph(
    name='E-Commerce Product Knowledge Graph',
    description='Products, categories, customers, and purchase relationships',
    schema={
        'entities': [
            {
                'type': 'product',
                'properties': {
                    'sku': 'string',
                    'name': 'string',
                    'price': 'number',
                    'category': 'string',
                    'brand': 'string',
                    'rating': 'number',
                    'in_stock': 'boolean'
                },
                'indexes': ['sku', 'category', 'brand']
            },
            {
                'type': 'customer',
                'properties': {
                    'email': 'string',
                    'name': 'string',
                    'segment': 'string',
                    'lifetime_value': 'number'
                },
                'indexes': ['email', 'segment']
            }
        ],
        'relationships': [
            {
                'type': 'purchased',
                'from': 'customer',
                'to': 'product',
                'properties': {
                    'quantity': 'number',
                    'total_price': 'number',
                    'purchase_date': 'datetime'
                },
                'directed': True
            }
        ]
    }
)
```

### Healthcare Knowledge Graph

```typescript
const healthcareGraph = await client.lydianIQ.createGraph({
  name: 'Healthcare Knowledge Graph',
  description: 'Patients, conditions, treatments, medications',
  schema: {
    entities: [
      {
        type: 'patient',
        properties: {
          patientId: 'string',
          age: 'number',
          gender: 'string',
          bloodType: 'string'
        },
        indexes: ['patientId']
      },
      {
        type: 'condition',
        properties: {
          icdCode: 'string',
          name: 'string',
          severity: 'string'
        },
        indexes: ['icdCode']
      },
      {
        type: 'medication',
        properties: {
          drugName: 'string',
          dosage: 'string',
          sideEffects: 'string[]'
        }
      },
      {
        type: 'treatment',
        properties: {
          name: 'string',
          type: 'string', // surgery, therapy, medication
          cost: 'number'
        }
      }
    ],
    relationships: [
      {
        type: 'diagnosed_with',
        from: 'patient',
        to: 'condition',
        properties: {
          diagnosedDate: 'datetime',
          confidence: 'number'
        }
      },
      {
        type: 'prescribed',
        from: 'patient',
        to: 'medication',
        properties: {
          startDate: 'datetime',
          endDate: 'datetime',
          frequency: 'string'
        }
      },
      {
        type: 'treats',
        from: 'treatment',
        to: 'condition',
        properties: {
          effectiveness: 'number' // 0-1
        }
      },
      {
        type: 'contraindication',
        from: 'medication',
        to: 'condition',
        properties: {
          severity: 'string'
        }
      }
    ]
  }
});
```

## Adding Nodes and Edges

### Bulk Node Creation

```typescript
// Add products
const products = [
  {
    type: 'product',
    properties: {
      sku: 'LAPTOP-001',
      name: 'Pro Laptop 15"',
      price: 1299.99,
      category: 'Electronics',
      brand: 'TechBrand',
      rating: 4.7,
      inStock: true
    }
  },
  {
    type: 'product',
    properties: {
      sku: 'PHONE-002',
      name: 'Smartphone X',
      price: 799.99,
      category: 'Electronics',
      brand: 'PhoneCo',
      rating: 4.5,
      inStock: true
    }
  },
  {
    type: 'product',
    properties: {
      sku: 'HEADPHONE-003',
      name: 'Wireless Headphones',
      price: 249.99,
      category: 'Electronics',
      brand: 'AudioPro',
      rating: 4.8,
      inStock: false
    }
  }
];

const createdNodes = await client.lydianIQ.createNodes({
  graphId: productGraph.id,
  nodes: products
});

console.log(`Created ${createdNodes.length} product nodes`);
```

### Adding Customers

```typescript
const customers = [
  {
    type: 'customer',
    properties: {
      email: 'john@example.com',
      name: 'John Doe',
      segment: 'VIP',
      lifetimeValue: 5432.10,
      location: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749] // San Francisco
      }
    }
  },
  {
    type: 'customer',
    properties: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      segment: 'regular',
      lifetimeValue: 892.45,
      location: {
        type: 'Point',
        coordinates: [-73.9352, 40.7306] // Brooklyn
      }
    }
  }
];

const customerNodes = await client.lydianIQ.createNodes({
  graphId: productGraph.id,
  nodes: customers
});
```

### Creating Relationships

```typescript
// Customer purchased product
const purchases = await client.lydianIQ.createEdges({
  graphId: productGraph.id,
  edges: [
    {
      type: 'purchased',
      fromNodeId: customerNodes[0].id, // John
      toNodeId: createdNodes[0].id, // Laptop
      properties: {
        quantity: 1,
        totalPrice: 1299.99,
        purchaseDate: '2024-01-15T10:30:00Z',
        rating: 5
      }
    },
    {
      type: 'purchased',
      fromNodeId: customerNodes[1].id, // Jane
      toNodeId: createdNodes[1].id, // Phone
      properties: {
        quantity: 1,
        totalPrice: 799.99,
        purchaseDate: '2024-01-20T14:22:00Z',
        rating: 4
      }
    }
  ]
});

// Customer viewed products
await client.lydianIQ.createEdges({
  graphId: productGraph.id,
  edges: [
    {
      type: 'viewed',
      fromNodeId: customerNodes[0].id,
      toNodeId: createdNodes[2].id, // John viewed headphones
      properties: {
        viewCount: 5,
        lastViewed: '2024-01-22T09:15:00Z'
      }
    }
  ]
});

// Product similarity
await client.lydianIQ.createEdge({
  graphId: productGraph.id,
  type: 'similar_to',
  fromNodeId: createdNodes[0].id, // Laptop
  toNodeId: createdNodes[1].id, // Phone
  properties: {
    similarity: 0.72
  }
});
```

## Querying Knowledge Graphs

### Basic Queries

**Find all products in a category:**
```typescript
const electronics = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    MATCH (p:product {category: 'Electronics'})
    RETURN p.sku, p.name, p.price, p.rating
    ORDER BY p.rating DESC
  `
});

console.log('Electronics Products:');
electronics.forEach(row => {
  console.log(`${row['p.name']} - $${row['p.price']} (${row['p.rating']}★)`);
});
```

**Find customer purchase history:**
```typescript
const purchaseHistory = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    MATCH (c:customer {email: 'john@example.com'})-[r:purchased]->(p:product)
    RETURN p.name, r.totalPrice, r.purchaseDate, r.rating
    ORDER BY r.purchaseDate DESC
  `
});

console.log("John's Purchase History:");
purchaseHistory.forEach(row => {
  console.log(`${row['p.name']} - $${row['r.totalPrice']} on ${row['r.purchaseDate']}`);
});
```

### Advanced Pattern Matching

**Find customers who viewed but didn't purchase:**
```typescript
const viewedNotPurchased = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    MATCH (c:customer)-[:viewed]->(p:product)
    WHERE NOT (c)-[:purchased]->(p)
    RETURN c.name, c.email, p.name AS product, p.price
    ORDER BY p.price DESC
  `
});

console.log('Abandoned Cart Candidates:');
viewedNotPurchased.forEach(row => {
  console.log(`${row['c.name']} viewed ${row.product} ($${row['p.price']})`);
});
```

**Product recommendations (collaborative filtering):**
```typescript
const recommendations = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    MATCH (c1:customer {email: 'john@example.com'})-[:purchased]->(p1:product)
    MATCH (c2:customer)-[:purchased]->(p1)
    MATCH (c2)-[:purchased]->(p2:product)
    WHERE NOT (c1)-[:purchased]->(p2)
    RETURN p2.name, p2.price, COUNT(c2) AS purchasedBy
    ORDER BY purchasedBy DESC
    LIMIT 5
  `
});

console.log('Recommended Products for John:');
recommendations.forEach(row => {
  console.log(`${row['p2.name']} - Purchased by ${row.purchasedBy} similar customers`);
});
```

**Python Example:**
```python
# Find VIP customers with high lifetime value
vip_customers = client.lydian_iq.query(
    graph_id=product_graph.id,
    query="""
        MATCH (c:customer {segment: 'VIP'})
        WHERE c.lifetimeValue > 1000
        RETURN c.name, c.email, c.lifetimeValue
        ORDER BY c.lifetimeValue DESC
    """
)

for customer in vip_customers:
    print(f"{customer['c.name']}: ${customer['c.lifetimeValue']}")
```

### Path Finding

**Shortest path between entities:**
```typescript
const path = await client.lydianIQ.findPath({
  graphId: productGraph.id,
  startNodeId: customerNodes[0].id,
  endNodeId: createdNodes[2].id, // Headphones
  algorithm: 'dijkstra',
  maxDepth: 5
});

console.log('Path:', path.nodes.map(n => n.type).join(' -> '));
// Output: customer -> viewed -> product
```

**All paths:**
```typescript
const allPaths = await client.lydianIQ.findAllPaths({
  graphId: productGraph.id,
  startNodeId: customerNodes[0].id,
  endNodeId: createdNodes[2].id,
  maxDepth: 3,
  limit: 10
});

allPaths.forEach((path, i) => {
  console.log(`Path ${i + 1}: ${path.length} hops`);
  path.nodes.forEach(node => {
    console.log(`  - ${node.type}: ${node.properties.name || node.properties.email}`);
  });
});
```

## Graph Algorithms

### PageRank (Node Importance)

```typescript
const pageRank = await client.lydianIQ.runAlgorithm({
  graphId: productGraph.id,
  algorithm: 'pagerank',
  config: {
    dampingFactor: 0.85,
    maxIterations: 20,
    tolerance: 0.0001
  },
  writeProperty: 'pagerank'
});

// Query top products by PageRank
const topProducts = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    MATCH (p:product)
    RETURN p.name, p.pagerank
    ORDER BY p.pagerank DESC
    LIMIT 10
  `
});

console.log('Most Important Products:');
topProducts.forEach(row => {
  console.log(`${row['p.name']}: ${row['p.pagerank'].toFixed(4)}`);
});
```

### Community Detection (Clustering)

```typescript
const communities = await client.lydianIQ.runAlgorithm({
  graphId: productGraph.id,
  algorithm: 'louvain',
  config: {
    maxIterations: 10
  },
  writeProperty: 'community'
});

console.log(`Found ${communities.communityCount} communities`);

// Get products in each community
for (let i = 0; i < communities.communityCount; i++) {
  const communityProducts = await client.lydianIQ.query({
    graphId: productGraph.id,
    query: `
      MATCH (p:product {community: ${i}})
      RETURN p.name, p.category
    `
  });

  console.log(`\nCommunity ${i}: ${communityProducts.length} products`);
  communityProducts.forEach(p => console.log(`  - ${p['p.name']}`));
}
```

### Node Similarity

```typescript
const similar = await client.lydianIQ.findSimilarNodes({
  graphId: productGraph.id,
  nodeId: createdNodes[0].id, // Laptop
  algorithm: 'cosine', // or 'jaccard', 'euclidean'
  limit: 5
});

console.log('Products similar to Laptop:');
similar.forEach(node => {
  console.log(`${node.properties.name} (similarity: ${node.similarity.toFixed(2)})`);
});
```

### Centrality Measures

```typescript
// Betweenness Centrality (bridge nodes)
const betweenness = await client.lydianIQ.runAlgorithm({
  graphId: productGraph.id,
  algorithm: 'betweenness_centrality',
  writeProperty: 'betweenness'
});

// Degree Centrality (most connected)
const degree = await client.lydianIQ.runAlgorithm({
  graphId: productGraph.id,
  algorithm: 'degree_centrality',
  writeProperty: 'degree'
});

const centralNodes = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    MATCH (n)
    RETURN n.type, COUNT(n) AS count, AVG(n.betweenness) AS avgBetweenness, AVG(n.degree) AS avgDegree
    GROUP BY n.type
  `
});

console.log('Centrality by Node Type:');
centralNodes.forEach(row => {
  console.log(`${row['n.type']}: Betweenness=${row.avgBetweenness.toFixed(2)}, Degree=${row.avgDegree.toFixed(2)}`);
});
```

## Building Recommendation Systems

### Collaborative Filtering

```typescript
async function getRecommendations(customerEmail: string, limit: number = 10) {
  // Find products purchased by similar customers
  const recommendations = await client.lydianIQ.query({
    graphId: productGraph.id,
    query: `
      // Find products this customer purchased
      MATCH (c1:customer {email: $email})-[r1:purchased]->(p1:product)

      // Find other customers who purchased the same products
      MATCH (c2:customer)-[r2:purchased]->(p1)
      WHERE c1 <> c2

      // Find products those customers also purchased
      MATCH (c2)-[r3:purchased]->(p2:product)
      WHERE NOT (c1)-[:purchased]->(p2)

      // Calculate recommendation score
      WITH p2,
           COUNT(DISTINCT c2) AS customerCount,
           AVG(r3.rating) AS avgRating,
           AVG(p2.rating) AS productRating

      RETURN p2.sku, p2.name, p2.price, p2.category,
             customerCount,
             avgRating,
             productRating,
             (customerCount * 0.4 + avgRating * 0.3 + productRating * 0.3) AS score
      ORDER BY score DESC
      LIMIT $limit
    `,
    parameters: { email: customerEmail, limit }
  });

  return recommendations.map(r => ({
    sku: r['p2.sku'],
    name: r['p2.name'],
    price: r['p2.price'],
    category: r['p2.category'],
    score: r.score,
    reason: `${r.customerCount} similar customers bought this (${r.avgRating.toFixed(1)}★)`
  }));
}

// Get recommendations
const recs = await getRecommendations('john@example.com', 5);
console.log('Recommendations for John:');
recs.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.name} - $${rec.price}`);
  console.log(`   Score: ${rec.score.toFixed(2)} - ${rec.reason}`);
});
```

### Content-Based Filtering

```typescript
async function getSimilarProducts(productSku: string, limit: number = 5) {
  const similar = await client.lydianIQ.query({
    graphId: productGraph.id,
    query: `
      MATCH (p1:product {sku: $sku})
      MATCH (p2:product)
      WHERE p1 <> p2 AND p1.category = p2.category

      WITH p1, p2,
           ABS(p1.price - p2.price) AS priceDiff,
           ABS(p1.rating - p2.rating) AS ratingDiff

      RETURN p2.sku, p2.name, p2.price, p2.rating,
             (1 / (1 + priceDiff/100)) * 0.3 +
             (1 / (1 + ratingDiff)) * 0.7 AS similarity
      ORDER BY similarity DESC
      LIMIT $limit
    `,
    parameters: { sku: productSku, limit }
  });

  return similar;
}

const similarToLaptop = await getSimilarProducts('LAPTOP-001');
console.log('Similar to Pro Laptop:');
similarToLaptop.forEach(p => {
  console.log(`${p['p2.name']} - $${p['p2.price']} (similarity: ${p.similarity.toFixed(2)})`);
});
```

## Performance Optimization

### Indexing

```typescript
// Create indexes for frequently queried properties
await client.lydianIQ.createIndex({
  graphId: productGraph.id,
  entityType: 'product',
  property: 'sku',
  type: 'unique'
});

await client.lydianIQ.createIndex({
  graphId: productGraph.id,
  entityType: 'customer',
  property: 'email',
  type: 'unique'
});

await client.lydianIQ.createIndex({
  graphId: productGraph.id,
  entityType: 'product',
  properties: ['category', 'brand'], // Composite index
  type: 'composite'
});

// Full-text search index
await client.lydianIQ.createIndex({
  graphId: productGraph.id,
  entityType: 'product',
  property: 'name',
  type: 'fulltext'
});
```

### Query Optimization

```typescript
// ✅ Good: Use indexes
const result = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    MATCH (p:product {sku: 'LAPTOP-001'})
    RETURN p
  `
});

// ❌ Bad: Full scan
const result = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    MATCH (p:product)
    WHERE p.name CONTAINS 'Laptop'
    RETURN p
  `
});

// ✅ Better: Use full-text index
const result = await client.lydianIQ.query({
  graphId: productGraph.id,
  query: `
    CALL search.fulltext('product', 'name', 'Laptop')
    YIELD node
    RETURN node
  `
});
```

### Caching

```typescript
// Enable query result caching
const cache = new Map();

async function cachedQuery(query: string, ttl: number = 60000) {
  const cacheKey = query;

  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < ttl) {
      return data;
    }
  }

  const result = await client.lydianIQ.query({
    graphId: productGraph.id,
    query
  });

  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

// Usage
const products = await cachedQuery(`
  MATCH (p:product {category: 'Electronics'})
  RETURN p
`, 300000); // Cache for 5 minutes
```

## Graph Visualization

```typescript
// Export graph for visualization
const graphData = await client.lydianIQ.exportGraph({
  graphId: productGraph.id,
  format: 'd3', // or 'cytoscape', 'graphml'
  filters: {
    nodeTypes: ['product', 'customer'],
    edgeTypes: ['purchased'],
    limit: 100
  }
});

// graphData structure for D3.js
console.log(JSON.stringify(graphData, null, 2));
```

## Best Practices

### 1. Design Normalized Schemas

```typescript
// ✅ Good: Normalized
entities: [
  { type: 'product', properties: { sku, name, price } },
  { type: 'category', properties: { name } }
]
relationships: [
  { type: 'belongs_to', from: 'product', to: 'category' }
]

// ❌ Bad: Denormalized (category as property)
entities: [
  { type: 'product', properties: { sku, name, price, categoryName } }
]
```

### 2. Use Appropriate Relationship Directions

```typescript
// ✅ Good: Natural direction
{ type: 'purchased', from: 'customer', to: 'product' }

// ❌ Bad: Reverse direction (harder to query)
{ type: 'bought_by', from: 'product', to: 'customer' }
```

### 3. Limit Query Depth

```typescript
// ✅ Good: Limited depth
MATCH path = (c:customer)-[*1..3]->(p:product)

// ❌ Bad: Unbounded traversal (slow!)
MATCH path = (c:customer)-[*]->(p:product)
```

### 4. Batch Operations

```typescript
// ✅ Good: Batch create
await client.lydianIQ.createNodes({
  graphId: productGraph.id,
  nodes: [...1000 nodes]
});

// ❌ Bad: Individual creates
for (const node of nodes) {
  await client.lydianIQ.createNode({ ... }); // Slow!
}
```

## Related Documentation

- [Getting Started with LyDian IQ](./lydian-iq-getting-started.md)
- [Signal Processing](./lydian-iq-signals.md)
- [Event Correlation](./lydian-iq-events.md)
- [LyDian IQ API Reference](../api/lydian-iq-api.md)
