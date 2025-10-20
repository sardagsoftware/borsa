/**
 * LyDian IQ SDK - Knowledge Graph Example
 *
 * This example shows how to build a knowledge graph with entities and relationships
 */

import { createClient } from '@lydian/lydian-iq-sdk';

const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY! }
});

// Create entity nodes
const userNode = await client.createKnowledgeGraphNode({
  nodeType: 'entity',
  entityType: 'user',
  properties: {
    userId: 'user_123',
    name: 'Ahmet Yılmaz',
    segment: 'premium'
  }
});

const productNode = await client.createKnowledgeGraphNode({
  nodeType: 'entity',
  entityType: 'product',
  properties: {
    productId: 'prod_456',
    name: 'Smart Home Sensor',
    category: 'iot'
  }
});

// Create relationship edge
const edge = await client.createKnowledgeGraphEdge({
  sourceNodeId: userNode.nodeId,
  targetNodeId: productNode.nodeId,
  edgeType: 'purchased',
  properties: {
    timestamp: new Date().toISOString(),
    amount: 299.99,
    currency: 'TRY'
  }
});

console.log('Knowledge graph created:', edge.edgeId);
