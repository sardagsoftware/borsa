# Lydian-IQ Trust Layer

**Explainable AI and cryptographically signed operations for trust, transparency, and compliance**

## Overview

The Trust Layer provides two critical capabilities:

1. **Explainability** - SHAP-style feature importance for all AI decisions
2. **Signed Operations** - Ed25519 cryptographic signatures for critical operations
3. **Evidence Packs** - Verifiable audit trails with Merkle proofs

## Compliance

- **EU AI Act**: Explainability requirements for high-risk AI systems
- **GDPR Article 22**: Right to explanation for automated decisions
- **SOC 2**: Audit trail requirements
- **Non-repudiation**: Cryptographic proof of operations

## Features

### Explainability Engine

- SHAP-style feature importance
- Natural language summaries (Turkish/English)
- Confidence scoring
- Support for all decision types:
  - Pricing decisions
  - Promotions
  - Routing optimization
  - Fraud detection
  - Recommendations
  - Economy optimization

### Operation Signer

- Ed25519 digital signatures
- Replay attack prevention (timestamp + nonce)
- Key pair generation
- Signature verification
- Operation tracking

### Evidence Pack Generator

- Merkle tree proofs
- Attestation log integration
- JSON/ZIP export formats
- Integrity hash verification
- Human-readable summaries

## Installation

```bash
npm install @lydian-iq/trust-layer
```

## Usage

### 1. Explain an AI Decision

```typescript
import { ExplainabilityEngine } from '@lydian-iq/trust-layer';

const explainer = new ExplainabilityEngine({
  top_k_features: 5,
  min_importance_threshold: 0.01,
  language: 'tr',
});

const explanation = explainer.explain({
  decisionType: 'pricing',
  modelName: 'price-optimizer-v2',
  modelVersion: '2.1.0',
  prediction: 149.99,
  confidence: 0.87,
  features: {
    current_price: 129.99,
    demand_forecast: 450,
    competitor_price: 159.99,
    stock_level: 120,
    seasonality_score: 0.75,
  },
});

console.log('Natural Language Summary:', explanation.natural_language_summary);
console.log('Top Features:', explanation.feature_importances);
```

**Output**:
```
Natural Language Summary: Bu fiyatlandırma kararı (149.99 TL) %87 güvenle önerilmiştir.
En önemli etken "competitor_price" (etki: +35.2% (yüksek)).
İkinci önemli faktör "demand_forecast" (etki: +28.7% (yüksek)).

Top Features: [
  { feature_name: 'competitor_price', importance: 0.352, contribution_direction: 'positive' },
  { feature_name: 'demand_forecast', importance: 0.287, contribution_direction: 'positive' },
  ...
]
```

### 2. Sign a Critical Operation

```typescript
import { OperationSigner } from '@lydian-iq/trust-layer';

const signer = new OperationSigner();

// Generate key pair (do this once, store securely)
const keyPair = OperationSigner.generateKeyPair();

// Sign a price update
const signedOperation = signer.signPriceUpdate({
  sku: 'PROD-12345',
  old_price: 129.99,
  new_price: 149.99,
  actor: 'user-789',
  privateKey: keyPair.privateKey,
});

console.log('Operation ID:', signedOperation.operation_id);
console.log('Signature:', signedOperation.signature);

// Verify signature
const verification = signer.verifyOperation(signedOperation);
console.log('Valid:', verification.valid);
```

### 3. Generate Evidence Pack

```typescript
import { EvidencePackGenerator } from '@lydian-iq/trust-layer';

const generator = new EvidencePackGenerator();

const pack = await generator.generatePack({
  decision_id: 'decision-abc-123',
  explanation,
  signed_operation: signedOperation,
  attestation_logs: [
    {
      action_hash: 'hash-xyz',
      timestamp: new Date().toISOString(),
      actor: 'user-789',
      metadata: { action: 'price_update' },
    },
  ],
  format: 'json',
});

console.log('Evidence Pack:', pack);
console.log('Integrity Hash:', pack.integrity_hash);

// Verify integrity
const isValid = await generator.verifyIntegrity(pack);
console.log('Pack Integrity Valid:', isValid);

// Export as JSON
const jsonExport = await generator.exportJSON(pack);
console.log('JSON Export:', jsonExport);
```

## API Endpoints

### POST /api/trust/explain

Generate explanation for an AI decision.

**Request**:
```json
{
  "decisionType": "pricing",
  "modelName": "price-optimizer-v2",
  "modelVersion": "2.1.0",
  "prediction": 149.99,
  "confidence": 0.87,
  "features": {
    "current_price": 129.99,
    "demand_forecast": 450,
    "competitor_price": 159.99
  },
  "language": "tr"
}
```

**Response**:
```json
{
  "success": true,
  "explanation": {
    "decision_id": "uuid",
    "decision_type": "pricing",
    "prediction": 149.99,
    "confidence": 0.87,
    "feature_importances": [...],
    "natural_language_summary": "Bu fiyatlandırma kararı...",
    "timestamp": "2025-10-09T..."
  }
}
```

### POST /api/trust/sign-operation

Sign a critical operation.

**Request**:
```json
{
  "operation_type": "price_update",
  "payload": {
    "sku": "PROD-12345",
    "old_price": 129.99,
    "new_price": 149.99
  },
  "actor": "user-789",
  "privateKey": "base64-encoded-private-key"
}
```

**Response**:
```json
{
  "success": true,
  "signed_operation": {
    "operation_id": "uuid",
    "signature": "base64-signature",
    "public_key": "base64-public-key",
    "timestamp": "2025-10-09T..."
  }
}
```

### GET /api/trust/sign-operation?operation_id=uuid

Verify a signed operation.

**Response**:
```json
{
  "success": true,
  "operation": {...},
  "verification": {
    "valid": true,
    "verified_at": "2025-10-09T...",
    "public_key": "..."
  }
}
```

### POST /api/trust/evidence-pack

Generate evidence pack.

**Request**:
```json
{
  "decision_id": "decision-123",
  "explanation": {...},
  "signed_operation": {...},
  "attestation_logs": [...],
  "format": "json"
}
```

**Response**:
```json
{
  "success": true,
  "evidence_pack": {
    "pack_id": "uuid",
    "integrity_hash": "sha256-hash",
    "includes": {...}
  },
  "summary": "=== EVIDENCE PACK SUMMARY ===\n..."
}
```

## Decision Types

- `pricing` - Price optimization decisions
- `promotion` - Promotion activation
- `routing` - Logistics routing
- `fraud_detection` - Fraud risk assessment
- `recommendation` - Product recommendations
- `economy_optimization` - Economic optimization

## Operation Types

- `price_update` - Price changes
- `promotion_activation` - Promotion launches
- `refund_approval` - Refund decisions
- `data_export` - Data export operations
- `model_deployment` - ML model deployments

## Merkle Proofs

Evidence packs include Merkle proofs for attestation logs:

1. Build Merkle tree from log entries
2. Generate proof path for target log
3. Include proof in evidence pack
4. Verify proof independently

**Verification**:
```typescript
import { MerkleTreeBuilder } from '@lydian-iq/trust-layer';

const builder = new MerkleTreeBuilder();
const isValid = builder.verifyProof(proof, leafData);
```

## Security Best Practices

1. **Key Management**:
   - Store private keys in HSM or key vault (AWS KMS, Azure Key Vault)
   - Never log or expose private keys
   - Rotate keys periodically

2. **Replay Attack Prevention**:
   - All operations include timestamp and nonce
   - Signatures expire after 30 minutes
   - Track used nonces

3. **Audit Trail**:
   - Use append-only database for attestation logs
   - Generate Merkle proofs for immutability
   - Export evidence packs for compliance

4. **Explainability**:
   - Always explain high-risk decisions
   - Include confidence scores
   - Provide natural language summaries

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Run tests
npm test
```

## License

UNLICENSED - Internal use only

## Support

For questions: trust-layer@ailydian.com
