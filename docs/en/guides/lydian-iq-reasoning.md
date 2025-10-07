# LyDian IQ Reasoning Guide

Complete guide to building rule-based reasoning engines, logical inference systems, and decision-making workflows with LyDian IQ.

## Table of Contents

- [Overview](#overview)
- [Rule-Based Reasoning](#rule-based-reasoning)
- [Logical Inference](#logical-inference)
- [Decision Trees](#decision-trees)
- [Constraint Satisfaction](#constraint-satisfaction)
- [Workflow Automation](#workflow-automation)
- [Knowledge Base Integration](#knowledge-base-integration)
- [Explainability](#explainability)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)

## Overview

LyDian IQ Reasoning enables you to build sophisticated decision-making systems using formal logic, rules, and constraints.

### Key Features

- **Rule Engines**: Forward and backward chaining
- **Logical Inference**: First-order logic, propositional logic
- **Decision Trees**: Binary and multi-way decision nodes
- **Constraint Solving**: CSP solvers with backtracking
- **Workflow Orchestration**: State machines, BPMN-style flows
- **Knowledge Integration**: Connect to knowledge graphs
- **Audit Trails**: Complete reasoning path logging
- **Real-Time Execution**: Low-latency rule evaluation

### Use Cases

- Business Process Automation
- Fraud Detection Systems
- Compliance Checking
- Medical Diagnosis Support
- Insurance Underwriting
- Recommendation Engines

## Rule-Based Reasoning

### Creating Rule Sets

```typescript
import { LydianIQClient } from '@lydian/lydian-iq';

const client = new LydianIQClient({
  apiKey: process.env.LYDIAN_IQ_API_KEY
});

// Create rule set for loan approval
const loanRules = await client.reasoning.createRuleSet({
  name: 'loan_approval_rules',
  description: 'Automated loan approval decision engine',
  rules: [
    {
      id: 'rule_1',
      name: 'High Credit Score Auto-Approve',
      condition: 'creditScore >= 750 AND income >= 50000',
      action: {
        type: 'approve',
        reason: 'Excellent credit score and sufficient income'
      },
      priority: 1
    },
    {
      id: 'rule_2',
      name: 'Low Debt-to-Income Ratio',
      condition: 'debtToIncomeRatio < 0.36 AND creditScore >= 650',
      action: {
        type: 'approve',
        reason: 'Low debt burden and acceptable credit'
      },
      priority: 2
    },
    {
      id: 'rule_3',
      name: 'Auto-Reject Low Credit',
      condition: 'creditScore < 580',
      action: {
        type: 'reject',
        reason: 'Credit score below minimum threshold'
      },
      priority: 10
    }
  ]
});

console.log('Rule set created:', loanRules.id);
```

```python
from lydian import LydianIQClient

client = LydianIQClient(api_key=os.environ['LYDIAN_IQ_API_KEY'])

# Create fraud detection rules
fraud_rules = client.reasoning.create_rule_set(
    name='fraud_detection_rules',
    description='Real-time transaction fraud detection',
    rules=[
        {
            'id': 'rule_velocity',
            'name': 'Transaction Velocity Check',
            'condition': 'transactionCount > 5 AND timeWindow < 300',
            'action': {
                'type': 'flag',
                'severity': 'high',
                'reason': 'Unusual transaction velocity'
            },
            'priority': 1
        },
        {
            'id': 'rule_amount',
            'name': 'Large Amount Check',
            'condition': 'amount > averageAmount * 10',
            'action': {
                'type': 'review',
                'severity': 'medium',
                'reason': 'Transaction amount significantly above average'
            },
            'priority': 2
        }
    ]
)

print(f'Fraud rules created: {fraud_rules.id}')
```

### Executing Rules

```typescript
// Evaluate loan application
const application = {
  creditScore: 720,
  income: 75000,
  debtToIncomeRatio: 0.28,
  requestedAmount: 200000
};

const decision = await client.reasoning.evaluate(loanRules.id, {
  context: application
});

console.log('Decision:', decision.action.type);
console.log('Reason:', decision.action.reason);
console.log('Matched rule:', decision.matchedRule.name);
console.log('Confidence:', decision.confidence);
```

### Forward Chaining

```typescript
// Create forward chaining rule set
const diagnosticRules = await client.reasoning.createRuleSet({
  name: 'medical_diagnosis',
  strategy: 'forward_chaining',
  rules: [
    {
      condition: 'fever > 38.5 AND cough = true',
      action: { assert: 'respiratory_infection_suspected' }
    },
    {
      condition: 'respiratory_infection_suspected AND lossOfSmell = true',
      action: { assert: 'covid_suspected' }
    },
    {
      condition: 'covid_suspected',
      action: {
        type: 'recommend',
        value: 'PCR test required'
      }
    }
  ]
});

// Execute forward chaining
const symptoms = {
  fever: 39.2,
  cough: true,
  lossOfSmell: true
};

const diagnosis = await client.reasoning.execute(diagnosticRules.id, {
  facts: symptoms,
  strategy: 'forward_chaining'
});

console.log('Inferred facts:', diagnosis.inferredFacts);
console.log('Recommendations:', diagnosis.recommendations);
```

## Logical Inference

### Propositional Logic

```typescript
// Define logical propositions
const insuranceLogic = await client.reasoning.createLogicSystem({
  name: 'insurance_eligibility',
  type: 'propositional',
  axioms: [
    'IF (age >= 18 AND age <= 65) THEN eligible_age',
    'IF (no_preexisting_conditions OR covered_preexisting) THEN eligible_health',
    'IF eligible_age AND eligible_health THEN eligible',
    'IF eligible AND premium_paid THEN policy_active'
  ]
});

// Evaluate logical inference
const customer = {
  age: 45,
  no_preexisting_conditions: false,
  covered_preexisting: true,
  premium_paid: true
};

const result = await client.reasoning.infer(insuranceLogic.id, {
  facts: customer
});

console.log('Policy active:', result.conclusions.includes('policy_active'));
console.log('Reasoning chain:', result.proofTree);
```

### First-Order Logic

```typescript
// Define first-order logic predicates
const familyLogic = await client.reasoning.createLogicSystem({
  name: 'family_relations',
  type: 'first_order',
  predicates: [
    'parent(X, Y)',  // X is parent of Y
    'male(X)',       // X is male
    'female(X)'      // X is female
  ],
  rules: [
    'father(X, Y) :- parent(X, Y) AND male(X)',
    'mother(X, Y) :- parent(X, Y) AND female(X)',
    'sibling(X, Y) :- parent(Z, X) AND parent(Z, Y) AND X != Y',
    'grandfather(X, Y) :- father(X, Z) AND parent(Z, Y)'
  ]
});

// Query relationships
const query = await client.reasoning.query(familyLogic.id, {
  query: 'grandfather(john, ?X)',
  facts: [
    'parent(john, michael)',
    'parent(michael, sarah)',
    'male(john)',
    'male(michael)',
    'female(sarah)'
  ]
});

console.log('Grandchildren of John:', query.results);
```

## Decision Trees

### Building Decision Trees

```typescript
// Create customer segmentation decision tree
const segmentationTree = await client.reasoning.createDecisionTree({
  name: 'customer_segmentation',
  root: {
    type: 'decision',
    attribute: 'annual_spend',
    operator: '>=',
    threshold: 10000,
    left: {
      type: 'decision',
      attribute: 'frequency',
      operator: '>=',
      threshold: 12,
      left: {
        type: 'leaf',
        label: 'VIP',
        value: { tier: 'platinum', discount: 0.20 }
      },
      right: {
        type: 'leaf',
        label: 'High Value',
        value: { tier: 'gold', discount: 0.15 }
      }
    },
    right: {
      type: 'decision',
      attribute: 'frequency',
      operator: '>=',
      threshold: 6,
      left: {
        type: 'leaf',
        label: 'Regular',
        value: { tier: 'silver', discount: 0.10 }
      },
      right: {
        type: 'leaf',
        label: 'Occasional',
        value: { tier: 'bronze', discount: 0.05 }
      }
    }
  }
});

// Classify customer
const customer = {
  annual_spend: 15000,
  frequency: 18
};

const segment = await client.reasoning.classify(segmentationTree.id, {
  input: customer
});

console.log('Customer tier:', segment.label);
console.log('Discount:', segment.value.discount);
console.log('Decision path:', segment.path);
```

### Multi-Way Trees

```typescript
// Create risk assessment tree
const riskTree = await client.reasoning.createDecisionTree({
  name: 'investment_risk_assessment',
  root: {
    type: 'multi_decision',
    attribute: 'risk_tolerance',
    branches: [
      {
        value: 'conservative',
        node: {
          type: 'leaf',
          label: 'Low Risk Portfolio',
          value: {
            stocks: 0.20,
            bonds: 0.60,
            cash: 0.20
          }
        }
      },
      {
        value: 'moderate',
        node: {
          type: 'decision',
          attribute: 'age',
          operator: '<',
          threshold: 40,
          left: {
            type: 'leaf',
            label: 'Growth Portfolio',
            value: { stocks: 0.70, bonds: 0.25, cash: 0.05 }
          },
          right: {
            type: 'leaf',
            label: 'Balanced Portfolio',
            value: { stocks: 0.50, bonds: 0.40, cash: 0.10 }
          }
        }
      },
      {
        value: 'aggressive',
        node: {
          type: 'leaf',
          label: 'High Risk Portfolio',
          value: {
            stocks: 0.85,
            bonds: 0.10,
            cash: 0.05
          }
        }
      }
    ]
  }
});
```

## Constraint Satisfaction

### Defining Constraints

```typescript
// Create scheduling constraint problem
const scheduleCSP = await client.reasoning.createCSP({
  name: 'meeting_scheduler',
  variables: [
    { name: 'meeting_a', domain: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
    { name: 'meeting_b', domain: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
    { name: 'meeting_c', domain: ['09:00', '10:00', '11:00', '14:00', '15:00'] }
  ],
  constraints: [
    {
      type: 'all_different',
      variables: ['meeting_a', 'meeting_b', 'meeting_c']
    },
    {
      type: 'time_gap',
      variables: ['meeting_a', 'meeting_b'],
      minimum_gap_minutes: 60
    },
    {
      type: 'precedence',
      before: 'meeting_a',
      after: 'meeting_c'
    }
  ]
});

// Solve constraint problem
const solution = await client.reasoning.solveCSP(scheduleCSP.id, {
  algorithm: 'backtracking',
  heuristic: 'minimum_remaining_values'
});

console.log('Schedule:', solution.assignment);
console.log('Conflicts resolved:', solution.conflicts);
```

### Resource Allocation

```typescript
// Server allocation CSP
const allocationCSP = await client.reasoning.createCSP({
  name: 'server_allocation',
  variables: [
    { name: 'service_a', domain: ['server1', 'server2', 'server3'] },
    { name: 'service_b', domain: ['server1', 'server2', 'server3'] },
    { name: 'service_c', domain: ['server1', 'server2', 'server3'] }
  ],
  constraints: [
    {
      type: 'capacity',
      resources: {
        server1: { cpu: 8, memory: 16 },
        server2: { cpu: 16, memory: 32 },
        server3: { cpu: 4, memory: 8 }
      },
      requirements: {
        service_a: { cpu: 4, memory: 8 },
        service_b: { cpu: 8, memory: 16 },
        service_c: { cpu: 2, memory: 4 }
      }
    },
    {
      type: 'anti_affinity',
      services: ['service_a', 'service_b']
    }
  ]
});

const allocation = await client.reasoning.solveCSP(allocationCSP.id);
console.log('Optimal allocation:', allocation.assignment);
```

## Workflow Automation

### State Machine Workflows

```typescript
// Create order fulfillment workflow
const orderWorkflow = await client.reasoning.createWorkflow({
  name: 'order_fulfillment',
  type: 'state_machine',
  states: {
    pending: {
      on: {
        payment_received: 'processing',
        cancelled: 'cancelled'
      }
    },
    processing: {
      on: {
        inventory_confirmed: 'picking',
        out_of_stock: 'backordered'
      }
    },
    picking: {
      on: {
        picked: 'packing',
        pick_failed: 'processing'
      }
    },
    packing: {
      on: {
        packed: 'shipping',
        quality_check_failed: 'picking'
      }
    },
    shipping: {
      on: {
        shipped: 'in_transit',
        shipping_failed: 'packing'
      }
    },
    in_transit: {
      on: {
        delivered: 'completed',
        return_requested: 'returning'
      }
    },
    completed: { type: 'final' },
    cancelled: { type: 'final' },
    backordered: {
      on: {
        stock_replenished: 'processing'
      }
    }
  },
  initialState: 'pending'
});

// Execute workflow
const order = await client.reasoning.executeWorkflow(orderWorkflow.id, {
  orderId: 'ORD-12345',
  initialData: {
    items: [{ sku: 'WIDGET-001', quantity: 2 }],
    customer: 'CUST-789'
  }
});

// Transition state
await client.reasoning.transitionWorkflow(order.executionId, {
  event: 'payment_received',
  data: {
    paymentId: 'PAY-456',
    amount: 99.99
  }
});
```

### BPMN Workflows

```typescript
// Create approval workflow
const approvalWorkflow = await client.reasoning.createWorkflow({
  name: 'expense_approval',
  type: 'bpmn',
  process: {
    startEvent: 'expense_submitted',
    tasks: [
      {
        id: 'task_manager_review',
        type: 'user_task',
        assignee: 'manager',
        formFields: ['approve', 'reject', 'request_info']
      },
      {
        id: 'task_finance_review',
        type: 'user_task',
        assignee: 'finance',
        condition: 'amount > 1000'
      },
      {
        id: 'task_payment',
        type: 'service_task',
        service: 'payment_service',
        method: 'processPayment'
      }
    ],
    gateways: [
      {
        id: 'gateway_amount',
        type: 'exclusive',
        condition: 'amount > 1000',
        truePath: 'task_finance_review',
        falsePath: 'task_payment'
      }
    ],
    endEvent: 'expense_completed'
  }
});
```

## Knowledge Base Integration

### Querying Knowledge Graphs

```typescript
// Connect reasoning to knowledge graph
const productReasoning = await client.reasoning.createRuleSet({
  name: 'product_recommendations',
  knowledgeGraph: 'product_catalog_graph',
  rules: [
    {
      condition: `
        MATCH (customer:Customer {id: $customerId})
        MATCH (customer)-[:PURCHASED]->(p:Product)
        MATCH (p)-[:SIMILAR_TO]->(rec:Product)
        WHERE NOT (customer)-[:PURCHASED]->(rec)
        RETURN rec
      `,
      action: {
        type: 'recommend',
        limit: 5
      }
    }
  ]
});

// Execute with graph query
const recommendations = await client.reasoning.evaluate(productReasoning.id, {
  context: { customerId: 'CUST-123' }
});

console.log('Recommended products:', recommendations.results);
```

## Explainability

### Reasoning Traces

```typescript
// Enable detailed reasoning trace
const decision = await client.reasoning.evaluate(loanRules.id, {
  context: application,
  explainability: {
    enabled: true,
    level: 'detailed',
    includeCounterfactuals: true
  }
});

console.log('Decision:', decision.action.type);
console.log('Explanation:', decision.explanation);

// Reasoning steps
decision.trace.steps.forEach((step, index) => {
  console.log(`Step ${index + 1}:`);
  console.log(`  Rule: ${step.rule.name}`);
  console.log(`  Condition: ${step.condition}`);
  console.log(`  Evaluated: ${step.result}`);
  console.log(`  Variables: ${JSON.stringify(step.variables)}`);
});

// Counterfactual analysis
console.log('What-if scenarios:', decision.counterfactuals);
```

### Audit Logs

```typescript
// Get complete audit trail
const auditLog = await client.reasoning.getAuditLog(loanRules.id, {
  executionId: decision.executionId
});

console.log('Execution timestamp:', auditLog.timestamp);
console.log('Input data:', auditLog.input);
console.log('Output decision:', auditLog.output);
console.log('Rules evaluated:', auditLog.rulesEvaluated);
console.log('Duration:', auditLog.durationMs);
console.log('User:', auditLog.user);
```

## Performance Optimization

### Rule Indexing

```typescript
// Optimize large rule sets with indexing
await client.reasoning.optimizeRuleSet(loanRules.id, {
  strategy: 'index_conditions',
  indexFields: ['creditScore', 'income', 'debtToIncomeRatio']
});

// Compile rules to decision table
await client.reasoning.compileRuleSet(loanRules.id, {
  format: 'decision_table',
  optimize: true
});
```

### Caching

```typescript
// Enable result caching
const cachedEvaluation = await client.reasoning.evaluate(loanRules.id, {
  context: application,
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    key: `loan_${application.customerId}`
  }
});
```

## Best Practices

### 1. Rule Organization

```typescript
// Organize rules by domain and priority
const wellOrganizedRules = await client.reasoning.createRuleSet({
  name: 'insurance_underwriting',
  rules: [
    // Critical rules (priority 1-10)
    { id: 'auto_reject_high_risk', priority: 1, /* ... */ },
    { id: 'auto_approve_low_risk', priority: 2, /* ... */ },

    // Standard rules (priority 11-50)
    { id: 'age_verification', priority: 11, /* ... */ },
    { id: 'coverage_limits', priority: 12, /* ... */ },

    // Default rules (priority 51+)
    { id: 'manual_review', priority: 100, /* ... */ }
  ],
  metadata: {
    domain: 'insurance',
    version: '2.1.0',
    owner: 'underwriting_team'
  }
});
```

### 2. Testing Rules

```typescript
// Unit test individual rules
const testResults = await client.reasoning.testRule(loanRules.id, 'rule_1', {
  testCases: [
    {
      input: { creditScore: 780, income: 60000 },
      expectedAction: 'approve'
    },
    {
      input: { creditScore: 740, income: 45000 },
      expectedAction: null // Should not match
    }
  ]
});

console.log('Test results:', testResults.passed, '/', testResults.total);
```

### 3. Version Control

```typescript
// Version rule sets
await client.reasoning.createVersion(loanRules.id, {
  version: '2.0.0',
  description: 'Added new debt-to-income ratio rules',
  changes: [
    'Added rule_2 for DTI validation',
    'Updated rule_1 income threshold'
  ]
});

// Rollback if needed
await client.reasoning.rollback(loanRules.id, {
  targetVersion: '1.5.0'
});
```

## Related Documentation

- [LyDian IQ Knowledge Graphs](./lydian-iq-knowledge-graphs.md)
- [LyDian IQ Events](./lydian-iq-events.md)
- [Reasoning API Reference](/docs/api/lydian-iq/reasoning)

## Support

- **Documentation**: https://docs.lydian.com
- **Support Email**: support@lydian.com
- **Community Forum**: https://community.lydian.com
