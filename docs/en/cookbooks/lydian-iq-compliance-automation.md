# LyDian IQ Compliance Automation Cookbook

## Introduction

This cookbook provides production-ready recipes for automating compliance checking with LyDian IQ. Each recipe includes complete code examples for real-world compliance scenarios.

## Recipe 1: Continuous GDPR Compliance Monitoring

**Problem**: Monitor ongoing GDPR compliance across all company documents and processes.

**Solution**: Automated continuous monitoring with alerting.

```typescript
import { LyDianIQ } from '@lydian/lydian-iq';

class GDPRComplianceMonitor {
  constructor(private client: LyDianIQ) {}

  async startMonitoring(config: MonitoringConfig): Promise<MonitoringSession> {
    // Create monitoring session
    const session = await this.client.compliance.createMonitor({
      framework: 'GDPR',
      jurisdiction: 'EU',
      targets: config.targets,
      schedule: 'daily', // or 'weekly', 'monthly'
      alerts: {
        channels: ['email', 'webhook'],
        conditions: {
          newViolations: true,
          complianceScoreDrop: 5, // Alert if score drops >5%
          criticalIssues: true
        }
      }
    });

    // Set up webhook handler
    await this.setupWebhookHandler(session.id, config.webhookUrl);

    return session;
  }

  async checkCompliance(documentIds: string[]): Promise<GDPRReport> {
    const results = await Promise.all(
      documentIds.map(id =>
        this.client.compliance.check({
          documentId: id,
          framework: 'GDPR',
          comprehensive: true
        })
      )
    );

    return this.aggregateResults(results);
  }

  private aggregateResults(results: ComplianceResult[]): GDPRReport {
    const violations: Violation[] = [];
    let totalScore = 0;

    for (const result of results) {
      totalScore += result.score;

      // Collect violations
      for (const check of result.checks) {
        if (check.status !== 'compliant') {
          violations.push({
            documentId: result.documentId,
            article: check.requirement.reference,
            severity: check.severity,
            description: check.finding,
            remediation: check.remediation
          });
        }
      }
    }

    return {
      overallScore: totalScore / results.length,
      totalDocuments: results.length,
      compliantDocuments: results.filter(r => r.status === 'compliant').length,
      violations,
      riskLevel: this.assessRiskLevel(violations),
      recommendations: this.generateRecommendations(violations)
    };
  }

  private assessRiskLevel(violations: Violation[]): 'low' | 'medium' | 'high' | 'critical' {
    const critical = violations.filter(v => v.severity === 'critical').length;
    const high = violations.filter(v => v.severity === 'high').length;

    if (critical > 0) return 'critical';
    if (high > 3) return 'high';
    if (high > 0 || violations.length > 10) return 'medium';
    return 'low';
  }

  private generateRecommendations(violations: Violation[]): string[] {
    const recommendations: string[] = [];

    // Group by article
    const byArticle = this.groupBy(violations, v => v.article);

    for (const [article, viols] of Object.entries(byArticle)) {
      if (viols.length > 2) {
        recommendations.push(
          `Address systematic ${article} compliance issues across ${viols.length} documents`
        );
      }
    }

    return recommendations;
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((result, item) => {
      const key = keyFn(item);
      (result[key] = result[key] || []).push(item);
      return result;
    }, {} as Record<string, T[]>);
  }

  private async setupWebhookHandler(
    sessionId: string,
    webhookUrl: string
  ): Promise<void> {
    await this.client.compliance.configureWebhook({
      sessionId,
      url: webhookUrl,
      events: ['violation_detected', 'compliance_score_change', 'monitoring_complete'],
      authentication: {
        type: 'bearer',
        token: process.env.WEBHOOK_SECRET
      }
    });
  }
}

// Usage
const monitor = new GDPRComplianceMonitor(client);

const session = await monitor.startMonitoring({
  targets: ['privacy_policies', 'data_processing_agreements', 'consent_forms'],
  webhookUrl: 'https://your-api.com/webhooks/gdpr-compliance'
});

console.log(`✅ Monitoring started: ${session.id}`);
```

**Related**: [GDPR Compliance Guide](/docs/en/guides/lydian-iq-gdpr-compliance.md)

---

## Recipe 2: Custom Compliance Framework Builder

**Problem**: Need to check compliance against internal policies or industry-specific regulations.

**Solution**: Build and deploy custom compliance frameworks.

```typescript
interface CustomFramework {
  id: string;
  name: string;
  requirements: CustomRequirement[];
}

class CustomFrameworkBuilder {
  constructor(private client: LyDianIQ) {}

  async buildFramework(definition: FrameworkDefinition): Promise<CustomFramework> {
    // Convert requirements to structured format
    const requirements = definition.rules.map((rule, index) => ({
      id: `custom-${index + 1}`,
      reference: rule.reference || `§${index + 1}`,
      title: rule.title,
      description: rule.description,
      type: 'mandatory',
      validation: this.createValidator(rule)
    }));

    // Register framework
    const framework = await this.client.compliance.registerFramework({
      name: definition.name,
      version: definition.version,
      requirements,
      metadata: definition.metadata
    });

    return framework;
  }

  private createValidator(rule: ComplianceRule): ValidationFunction {
    return async (document: Document) => {
      switch (rule.type) {
        case 'keyword_presence':
          return this.validateKeywordPresence(document, rule);

        case 'clause_required':
          return this.validateClausePresence(document, rule);

        case 'data_format':
          return this.validateDataFormat(document, rule);

        case 'custom_logic':
          return this.validateCustomLogic(document, rule);

        default:
          throw new Error(`Unknown validation type: ${rule.type}`);
      }
    };
  }

  private async validateKeywordPresence(
    document: Document,
    rule: ComplianceRule
  ): Promise<ValidationResult> {
    const keywords = rule.parameters.keywords as string[];
    const text = document.text.toLowerCase();

    const present = keywords.filter(kw => text.includes(kw.toLowerCase()));
    const missing = keywords.filter(kw => !text.includes(kw.toLowerCase()));

    return {
      compliant: missing.length === 0,
      confidence: present.length / keywords.length,
      details: {
        present,
        missing
      },
      recommendation: missing.length > 0
        ? `Add the following required terms: ${missing.join(', ')}`
        : null
    };
  }

  private async validateClausePresence(
    document: Document,
    rule: ComplianceRule
  ): Promise<ValidationResult> {
    // Use AI to detect if required clause is present
    const detection = await this.client.clauses.detect({
      document: document.id,
      clauseType: rule.parameters.clauseType as string,
      minimumConfidence: 0.7
    });

    return {
      compliant: detection.found,
      confidence: detection.confidence,
      details: {
        clauseType: rule.parameters.clauseType,
        location: detection.location
      },
      recommendation: !detection.found
        ? `Add ${rule.parameters.clauseType} clause`
        : null
    };
  }

  private async validateDataFormat(
    document: Document,
    rule: ComplianceRule
  ): Promise<ValidationResult> {
    const pattern = new RegExp(rule.parameters.pattern as string);
    const fieldName = rule.parameters.fieldName as string;

    const entity = document.entities.find(e => e.type === fieldName);

    if (!entity) {
      return {
        compliant: false,
        confidence: 1,
        details: { missing: fieldName },
        recommendation: `Add required field: ${fieldName}`
      };
    }

    const matches = pattern.test(entity.value);

    return {
      compliant: matches,
      confidence: 1,
      details: {
        value: entity.value,
        expected: rule.parameters.pattern
      },
      recommendation: !matches
        ? `Fix ${fieldName} format to match: ${rule.parameters.pattern}`
        : null
    };
  }

  private async validateCustomLogic(
    document: Document,
    rule: ComplianceRule
  ): Promise<ValidationResult> {
    // Execute custom validation function
    const validationCode = rule.parameters.function as string;
    const validator = eval(`(${validationCode})`);

    return validator(document, this.client);
  }
}

// Usage - Define custom framework
const builder = new CustomFrameworkBuilder(client);

const framework = await builder.buildFramework({
  name: 'Internal Contract Policy',
  version: '2.0',
  rules: [
    {
      reference: 'ICP-1',
      title: 'Liability Cap Required',
      description: 'All contracts must include liability limitation clause',
      type: 'clause_required',
      parameters: {
        clauseType: 'limitation_of_liability'
      }
    },
    {
      reference: 'ICP-2',
      title: 'Insurance Requirements',
      description: 'Vendor contracts must specify minimum insurance coverage',
      type: 'keyword_presence',
      parameters: {
        keywords: ['insurance', 'coverage', 'liability insurance']
      }
    },
    {
      reference: 'ICP-3',
      title: 'Payment Terms Format',
      description: 'Payment terms must be explicitly stated',
      type: 'data_format',
      parameters: {
        fieldName: 'payment_terms',
        pattern: '^(\\d+)\\s+days$'
      }
    }
  ],
  metadata: {
    owner: 'Legal Department',
    lastReviewed: '2025-01-01'
  }
});

// Check compliance against custom framework
const result = await client.compliance.check({
  documentId: 'contract-123',
  framework: framework.id
});

console.log(`Compliance: ${result.status}`);
console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
```

---

## Recipe 3: Multi-Framework Compliance Matrix

**Problem**: Check document compliance against multiple frameworks simultaneously (GDPR, SOX, ISO 27001, etc.).

**Solution**: Parallel framework checking with unified reporting.

```typescript
class MultiFrameworkChecker {
  constructor(private client: LyDianIQ) {}

  async checkAllFrameworks(
    documentId: string,
    frameworks: string[]
  ): Promise<ComplianceMatrix> {
    // Run checks in parallel
    const results = await Promise.all(
      frameworks.map(fw =>
        this.client.compliance.check({
          documentId,
          framework: fw,
          detailedAnalysis: true
        })
      )
    );

    // Build compliance matrix
    return this.buildMatrix(frameworks, results);
  }

  private buildMatrix(
    frameworks: string[],
    results: ComplianceResult[]
  ): ComplianceMatrix {
    const matrix: ComplianceMatrix = {
      overall: this.calculateOverallStatus(results),
      byFramework: {},
      commonIssues: this.findCommonIssues(results),
      recommendations: []
    };

    // Map results by framework
    frameworks.forEach((fw, i) => {
      matrix.byFramework[fw] = {
        status: results[i].status,
        score: results[i].score,
        violations: results[i].violations,
        gaps: results[i].gaps
      };
    });

    // Generate cross-framework recommendations
    matrix.recommendations = this.generateCrossFrameworkRecommendations(matrix);

    return matrix;
  }

  private calculateOverallStatus(results: ComplianceResult[]): string {
    const allCompliant = results.every(r => r.status === 'compliant');
    if (allCompliant) return 'fully_compliant';

    const anyCompliant = results.some(r => r.status === 'compliant');
    if (anyCompliant) return 'partially_compliant';

    return 'non_compliant';
  }

  private findCommonIssues(results: ComplianceResult[]): CommonIssue[] {
    // Find issues that appear across multiple frameworks
    const issueMap = new Map<string, Set<string>>();

    for (const result of results) {
      for (const violation of result.violations) {
        const key = this.normalizeIssue(violation.description);

        if (!issueMap.has(key)) {
          issueMap.set(key, new Set());
        }

        issueMap.get(key)!.add(result.framework);
      }
    }

    // Filter to issues in 2+ frameworks
    return Array.from(issueMap.entries())
      .filter(([_, frameworks]) => frameworks.size >= 2)
      .map(([issue, frameworks]) => ({
        issue,
        frameworks: Array.from(frameworks),
        priority: 'high' // Common issues are high priority
      }));
  }

  private normalizeIssue(description: string): string {
    // Normalize issue descriptions for matching
    return description
      .toLowerCase()
      .replace(/gdpr|sox|iso\s*27001/gi, '')
      .replace(/article\s+\d+/gi, '')
      .trim();
  }

  private generateCrossFrameworkRecommendations(
    matrix: ComplianceMatrix
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations for common issues
    for (const common of matrix.commonIssues) {
      recommendations.push(
        `Address "${common.issue}" to improve compliance across ${common.frameworks.join(', ')}`
      );
    }

    // Framework-specific priority recommendations
    for (const [fw, result] of Object.entries(matrix.byFramework)) {
      if (result.score < 0.7) {
        recommendations.push(
          `Focus on ${fw} compliance (current score: ${(result.score * 100).toFixed(1)}%)`
        );
      }
    }

    return recommendations;
  }
}

// Usage
const checker = new MultiFrameworkChecker(client);

const matrix = await checker.checkAllFrameworks('policy-doc-123', [
  'GDPR',
  'SOX',
  'ISO-27001',
  'NIST-CSF',
  'PCI-DSS'
]);

console.log(`Overall Status: ${matrix.overall}`);
console.log(`\nCommon Issues (${matrix.commonIssues.length}):`);
for (const issue of matrix.commonIssues) {
  console.log(`  - ${issue.issue}`);
  console.log(`    Affects: ${issue.frameworks.join(', ')}`);
}

console.log(`\nFramework Scores:`);
for (const [fw, result] of Object.entries(matrix.byFramework)) {
  console.log(`  ${fw}: ${(result.score * 100).toFixed(1)}%`);
}
```

---

## Recipe 4: Automated Compliance Remediation

**Problem**: Automatically generate fixes for compliance violations.

**Solution**: AI-powered remediation suggestions with document patching.

```typescript
class ComplianceRemediator {
  constructor(private client: LyDianIQ) {}

  async generateRemediationPlan(
    complianceResult: ComplianceResult
  ): Promise<RemediationPlan> {
    const actions: RemediationAction[] = [];

    for (const violation of complianceResult.violations) {
      const action = await this.createRemediationAction(violation);
      actions.push(action);
    }

    // Prioritize actions
    const prioritized = this.prioritizeActions(actions);

    // Estimate effort
    const totalEffort = this.estimateEffort(prioritized);

    return {
      actions: prioritized,
      totalEffort,
      estimatedCost: this.estimateCost(totalEffort),
      timeline: this.createTimeline(prioritized)
    };
  }

  private async createRemediationAction(
    violation: Violation
  ): Promise<RemediationAction> {
    // Get AI-powered fix suggestions
    const suggestions = await this.client.compliance.suggestFix({
      violation,
      includeExamples: true,
      includeDraft: true
    });

    return {
      violationId: violation.id,
      type: this.determineActionType(violation),
      description: violation.description,
      suggestedFix: suggestions.primaryFix,
      alternatives: suggestions.alternatives,
      draft: suggestions.draft, // AI-generated compliant text
      effort: suggestions.estimatedEffort,
      priority: this.calculatePriority(violation)
    };
  }

  private determineActionType(violation: Violation): ActionType {
    const keywords = violation.description.toLowerCase();

    if (keywords.includes('missing')) return 'add_clause';
    if (keywords.includes('remove') || keywords.includes('delete')) return 'remove_content';
    if (keywords.includes('update') || keywords.includes('modify')) return 'modify_content';
    if (keywords.includes('clarify')) return 'clarify_language';

    return 'review_manual';
  }

  async applyAutomatedFixes(
    documentId: string,
    plan: RemediationPlan
  ): Promise<RemediationResult> {
    const applied: RemediationAction[] = [];
    const failed: { action: RemediationAction; error: string }[] = [];

    for (const action of plan.actions) {
      if (action.type === 'review_manual') {
        continue; // Skip manual review items
      }

      try {
        await this.applyFix(documentId, action);
        applied.push(action);
      } catch (error) {
        failed.push({
          action,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      appliedCount: applied.length,
      failedCount: failed.length,
      applied,
      failed,
      needsManualReview: plan.actions.filter(a => a.type === 'review_manual').length
    };
  }

  private async applyFix(
    documentId: string,
    action: RemediationAction
  ): Promise<void> {
    switch (action.type) {
      case 'add_clause':
        await this.client.documents.addClause({
          documentId,
          clause: action.draft!,
          position: 'appropriate' // AI determines best position
        });
        break;

      case 'modify_content':
        await this.client.documents.modifySection({
          documentId,
          sectionId: action.sectionId!,
          newContent: action.draft!
        });
        break;

      case 'remove_content':
        await this.client.documents.removeSection({
          documentId,
          sectionId: action.sectionId!
        });
        break;

      case 'clarify_language':
        await this.client.documents.clarifyLanguage({
          documentId,
          location: action.location!,
          clarification: action.draft!
        });
        break;
    }
  }

  private prioritizeActions(actions: RemediationAction[]): RemediationAction[] {
    return actions.sort((a, b) => {
      // Sort by priority first
      if (a.priority !== b.priority) {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      // Then by effort (easier first)
      return a.effort - b.effort;
    });
  }

  private estimateEffort(actions: RemediationAction[]): number {
    return actions.reduce((sum, action) => sum + action.effort, 0);
  }

  private estimateCost(effortHours: number): number {
    const hourlyRate = 200; // Average legal professional rate
    return effortHours * hourlyRate;
  }

  private createTimeline(actions: RemediationAction[]): Timeline {
    const phases: TimelinePhase[] = [];
    let cumulativeHours = 0;

    for (const action of actions) {
      phases.push({
        action: action.description,
        startHour: cumulativeHours,
        durationHours: action.effort,
        dependencies: []
      });

      cumulativeHours += action.effort;
    }

    return {
      totalHours: cumulativeHours,
      estimatedDays: Math.ceil(cumulativeHours / 8),
      phases
    };
  }

  private calculatePriority(violation: Violation): Priority {
    if (violation.severity === 'critical') return 'critical';
    if (violation.severity === 'high') return 'high';
    if (violation.severity === 'medium') return 'medium';
    return 'low';
  }
}

// Usage
const remediator = new ComplianceRemediator(client);

// Check compliance
const complianceResult = await client.compliance.check({
  documentId: 'policy-123',
  framework: 'GDPR'
});

// Generate remediation plan
const plan = await remediator.generateRemediationPlan(complianceResult);

console.log(`Remediation Plan:`);
console.log(`  Total Actions: ${plan.actions.length}`);
console.log(`  Estimated Effort: ${plan.totalEffort} hours`);
console.log(`  Estimated Cost: $${plan.estimatedCost}`);
console.log(`  Timeline: ${plan.timeline.estimatedDays} days\n`);

// Apply automated fixes
const result = await remediator.applyAutomatedFixes('policy-123', plan);

console.log(`Remediation Result:`);
console.log(`  ✅ Applied: ${result.appliedCount}`);
console.log(`  ❌ Failed: ${result.failedCount}`);
console.log(`  👀 Needs Manual Review: ${result.needsManualReview}`);
```

---

## Recipes 5-10 Summary

**Recipe 5: Compliance Audit Trail Generation**
- Generates comprehensive audit logs
- Tracks all compliance checks and changes
- Exports audit reports for regulators

**Recipe 6: Real-Time Compliance Validation**
- Validates documents during editing
- Provides instant feedback to users
- Prevents non-compliant content creation

**Recipe 7: Compliance Scorecard Dashboard**
- Tracks compliance metrics over time
- Visualizes trends and improvements
- Generates executive summaries

**Recipe 8: Policy Template Compliance Checking**
- Validates templates against regulations
- Ensures all templates are compliant
- Updates templates automatically

**Recipe 9: Cross-Border Compliance Management**
- Handles multi-jurisdiction compliance
- Maps requirements across regions
- Identifies conflicts between jurisdictions

**Recipe 10: Compliance Certificate Generation**
- Generates compliance certificates
- Creates attestation documents
- Produces regulatory submissions

## Best Practices

1. **Run compliance checks regularly** (daily/weekly) not just once
2. **Prioritize critical violations** for immediate remediation
3. **Document all compliance decisions** for audit trails
4. **Use webhooks for real-time alerts** on compliance issues
5. **Keep frameworks updated** as regulations change

## Related Documentation

- [Compliance Checking Concepts](/docs/en/concepts/lydian-iq-compliance-checking.md)
- [GDPR Compliance Guide](/docs/en/guides/lydian-iq-gdpr-compliance.md)
- [API Reference](/docs/en/api-reference/lydian-iq.md)

## Support

For questions about compliance automation:
- Email: legal-ai@lydian.com
- Documentation: https://docs.lydian.com/lydian-iq/compliance
- Community: https://community.lydian.com/lydian-iq
