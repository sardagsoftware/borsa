# Contract Review Automation with LyDian IQ

## Introduction

This tutorial demonstrates how to build an automated contract review system using LyDian IQ. You'll learn how to analyze contracts, identify issues, compare against templates, and generate review reports.

**Time to complete**: 60-90 minutes

**Prerequisites**:
- Completed [LyDian IQ Quickstart](/docs/en/tutorials/lydian-iq-quickstart.md)
- Node.js 18+ or Python 3.9+
- Sample contracts for testing

## Use Case

You're building a legal tech application that helps lawyers review contracts efficiently. The system should:
1. Extract key terms and clauses
2. Identify unusual or risky provisions
3. Check for missing standard clauses
4. Compare against approved templates
5. Generate detailed review reports

## Architecture Overview

```typescript
// High-level system architecture
interface ContractReviewSystem {
  ingestion: DocumentIngestion;
  analysis: ClauseAnalyzer;
  riskDetection: RiskEngine;
  templateComparison: TemplateComparator;
  reporting: ReportGenerator;
}
```

## Step 1: Document Ingestion Pipeline

Create a robust ingestion system that handles various file formats.

```typescript
import { LyDianIQ } from '@lydian/lydian-iq';
import * as fs from 'fs';
import * as path from 'path';

class ContractIngestion {
  constructor(private client: LyDianIQ) {}

  async ingestContract(filePath: string): Promise<IngestedContract> {
    // Read file
    const buffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    const extension = path.extname(filePath).toLowerCase();

    // Validate file type
    const supportedTypes = ['.pdf', '.docx', '.doc', '.txt'];
    if (!supportedTypes.includes(extension)) {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    console.log(`📄 Ingesting: ${filename}`);

    // Upload and process
    const result = await this.client.documents.upload({
      file: buffer,
      filename,
      metadata: {
        source: 'contract_review_system',
        uploadedAt: new Date().toISOString()
      }
    });

    console.log(`✅ Document uploaded: ${result.id}`);

    // Start initial analysis
    const analysis = await this.client.documents.analyze({
      documentId: result.id,
      type: 'contract',
      options: {
        extractStructure: true,
        extractEntities: true,
        classifyClauses: true,
        detectLanguage: true
      }
    });

    return {
      documentId: result.id,
      filename,
      analysis,
      ingestedAt: new Date()
    };
  }

  async ingestBatch(directory: string): Promise<IngestedContract[]> {
    const files = fs.readdirSync(directory)
      .filter(f => ['.pdf', '.docx', '.doc'].some(ext => f.endsWith(ext)))
      .map(f => path.join(directory, f));

    console.log(`📦 Ingesting ${files.length} contracts...\n`);

    const results = await Promise.all(
      files.map(file => this.ingestContract(file))
    );

    console.log(`\n✅ Batch ingestion complete: ${results.length} contracts`);
    return results;
  }
}
```

## Step 2: Clause Analysis Engine

Build a system that identifies and analyzes contract clauses.

```typescript
interface ClauseAnalysis {
  clause: Clause;
  category: ClauseCategory;
  standardness: number; // 0-1 score
  risks: Risk[];
  recommendations: string[];
}

class ClauseAnalyzer {
  constructor(private client: LyDianIQ) {}

  async analyzeAllClauses(documentId: string): Promise<ClauseAnalysis[]> {
    // Get document structure with clauses
    const structure = await this.client.documents.getStructure(documentId);

    console.log(`🔍 Analyzing ${structure.clauses.length} clauses...\n`);

    const analyses = await Promise.all(
      structure.clauses.map(clause => this.analyzeClause(clause, documentId))
    );

    // Group by category
    const byCategory = this.groupByCategory(analyses);

    console.log('Clause Breakdown:');
    for (const [category, clauses] of Object.entries(byCategory)) {
      console.log(`  ${category}: ${clauses.length} clauses`);
    }

    return analyses;
  }

  private async analyzeClause(
    clause: Clause,
    documentId: string
  ): Promise<ClauseAnalysis> {
    // Classify clause
    const classification = await this.client.clauses.classify({
      text: clause.text,
      context: { documentId, section: clause.section }
    });

    // Assess standardness (compared to typical clauses)
    const standardness = await this.assessStandardness(clause, classification);

    // Identify risks
    const risks = await this.identifyClauseRisks(clause, classification);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      clause,
      classification,
      risks
    );

    return {
      clause,
      category: classification.category,
      standardness: standardness.score,
      risks,
      recommendations
    };
  }

  private async assessStandardness(
    clause: Clause,
    classification: ClauseClassification
  ): Promise<StandardnessAssessment> {
    // Compare against standard clause database
    const comparison = await this.client.clauses.compareToStandard({
      text: clause.text,
      category: classification.category,
      jurisdiction: 'TR'
    });

    return {
      score: comparison.similarityScore,
      deviations: comparison.deviations,
      explanation: comparison.explanation
    };
  }

  private async identifyClauseRisks(
    clause: Clause,
    classification: ClauseClassification
  ): Promise<Risk[]> {
    const risks: Risk[] = [];

    // Use AI to identify potential risks
    const riskAnalysis = await this.client.clauses.analyzeRisks({
      text: clause.text,
      category: classification.category,
      context: { contractType: 'commercial' }
    });

    risks.push(...riskAnalysis.risks);

    // Apply rule-based checks
    const ruleBasedRisks = this.applyRiskRules(clause, classification);
    risks.push(...ruleBasedRisks);

    return risks;
  }

  private applyRiskRules(
    clause: Clause,
    classification: ClauseClassification
  ): Risk[] {
    const risks: Risk[] = [];

    // Example: Check for overly broad indemnification
    if (classification.category === 'indemnification') {
      if (clause.text.toLowerCase().includes('all claims') ||
          clause.text.toLowerCase().includes('any damages')) {
        risks.push({
          type: 'overly_broad_indemnification',
          severity: 'high',
          description: 'Indemnification clause may be overly broad',
          recommendation: 'Consider limiting scope of indemnification'
        });
      }
    }

    // Example: Check for unlimited liability
    if (classification.category === 'liability') {
      if (!clause.text.toLowerCase().includes('limited to') &&
          !clause.text.toLowerCase().includes('cap')) {
        risks.push({
          type: 'unlimited_liability',
          severity: 'high',
          description: 'No liability cap specified',
          recommendation: 'Add monetary limitation on liability'
        });
      }
    }

    // Example: Check for auto-renewal
    if (classification.category === 'term_termination') {
      if (clause.text.toLowerCase().includes('automatically renew')) {
        const hasOptOut = clause.text.toLowerCase().includes('notice') ||
                          clause.text.toLowerCase().includes('terminate');
        if (!hasOptOut) {
          risks.push({
            type: 'auto_renewal_no_opt_out',
            severity: 'medium',
            description: 'Auto-renewal without clear opt-out mechanism',
            recommendation: 'Specify notice period for non-renewal'
          });
        }
      }
    }

    return risks;
  }

  private async generateRecommendations(
    clause: Clause,
    classification: ClauseClassification,
    risks: Risk[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // High-severity risks should always have recommendations
    for (const risk of risks.filter(r => r.severity === 'high')) {
      recommendations.push(risk.recommendation);
    }

    // Use AI to suggest improvements
    const suggestions = await this.client.clauses.suggestImprovements({
      text: clause.text,
      category: classification.category,
      risks
    });

    recommendations.push(...suggestions.improvements);

    return recommendations;
  }

  private groupByCategory(analyses: ClauseAnalysis[]): Record<string, ClauseAnalysis[]> {
    const grouped: Record<string, ClauseAnalysis[]> = {};

    for (const analysis of analyses) {
      const category = analysis.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(analysis);
    }

    return grouped;
  }
}
```

## Step 3: Risk Detection Engine

Create a comprehensive risk detection system.

```typescript
class RiskEngine {
  constructor(private client: LyDianIQ) {}

  async detectAllRisks(
    documentId: string,
    clauseAnalyses: ClauseAnalysis[]
  ): Promise<RiskReport> {
    console.log('⚠️  Running comprehensive risk analysis...\n');

    // 1. Clause-level risks (already have from clause analysis)
    const clauseRisks = this.aggregateClauseRisks(clauseAnalyses);

    // 2. Missing clause risks
    const missingClauseRisks = await this.detectMissingClauses(
      documentId,
      clauseAnalyses
    );

    // 3. Conflicting clauses
    const conflictRisks = await this.detectConflicts(clauseAnalyses);

    // 4. Jurisdiction-specific risks
    const jurisdictionRisks = await this.detectJurisdictionIssues(documentId);

    // 5. Ambiguity and vagueness
    const ambiguityRisks = await this.detectAmbiguities(documentId);

    // Combine all risks
    const allRisks = [
      ...clauseRisks,
      ...missingClauseRisks,
      ...conflictRisks,
      ...jurisdictionRisks,
      ...ambiguityRisks
    ];

    // Prioritize risks
    const prioritized = this.prioritizeRisks(allRisks);

    return {
      totalRisks: allRisks.length,
      highSeverity: allRisks.filter(r => r.severity === 'high').length,
      mediumSeverity: allRisks.filter(r => r.severity === 'medium').length,
      lowSeverity: allRisks.filter(r => r.severity === 'low').length,
      risks: prioritized,
      summary: this.generateRiskSummary(prioritized)
    };
  }

  private aggregateClauseRisks(analyses: ClauseAnalysis[]): Risk[] {
    const risks: Risk[] = [];

    for (const analysis of analyses) {
      for (const risk of analysis.risks) {
        risks.push({
          ...risk,
          location: analysis.clause.reference,
          clauseCategory: analysis.category
        });
      }
    }

    return risks;
  }

  private async detectMissingClauses(
    documentId: string,
    analyses: ClauseAnalysis[]
  ): Promise<Risk[]> {
    // Standard clauses that should be present
    const standardClauses = [
      'governing_law',
      'dispute_resolution',
      'limitation_of_liability',
      'confidentiality',
      'term_termination',
      'force_majeure',
      'entire_agreement',
      'amendments'
    ];

    const presentCategories = new Set(
      analyses.map(a => a.category)
    );

    const missing = standardClauses.filter(
      clause => !presentCategories.has(clause)
    );

    return missing.map(clauseType => ({
      type: 'missing_clause',
      severity: this.getMissingClauseSeverity(clauseType),
      description: `Missing ${clauseType.replace(/_/g, ' ')} clause`,
      recommendation: `Add ${clauseType.replace(/_/g, ' ')} clause`,
      clauseType
    }));
  }

  private getMissingClauseSeverity(clauseType: string): 'high' | 'medium' | 'low' {
    const critical = ['governing_law', 'limitation_of_liability'];
    const important = ['dispute_resolution', 'term_termination', 'confidentiality'];

    if (critical.includes(clauseType)) return 'high';
    if (important.includes(clauseType)) return 'medium';
    return 'low';
  }

  private async detectConflicts(
    analyses: ClauseAnalysis[]
  ): Promise<Risk[]> {
    const conflicts: Risk[] = [];

    // Use AI to detect semantic conflicts between clauses
    for (let i = 0; i < analyses.length; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const clause1 = analyses[i];
        const clause2 = analyses[j];

        // Only check clauses in related categories
        if (this.areRelatedCategories(clause1.category, clause2.category)) {
          const conflict = await this.client.clauses.detectConflict({
            clause1: clause1.clause.text,
            clause2: clause2.clause.text
          });

          if (conflict.hasConflict) {
            conflicts.push({
              type: 'conflicting_clauses',
              severity: 'high',
              description: conflict.description,
              recommendation: conflict.resolution,
              locations: [clause1.clause.reference, clause2.clause.reference]
            });
          }
        }
      }
    }

    return conflicts;
  }

  private areRelatedCategories(cat1: string, cat2: string): boolean {
    const relatedGroups = [
      ['payment', 'price', 'fees'],
      ['term_termination', 'renewal', 'notice'],
      ['warranty', 'liability', 'indemnification'],
      ['confidentiality', 'intellectual_property', 'non_disclosure']
    ];

    return relatedGroups.some(group =>
      group.includes(cat1) && group.includes(cat2)
    );
  }

  private async detectJurisdictionIssues(documentId: string): Promise<Risk[]> {
    const analysis = await this.client.documents.getAnalysis(documentId);

    // Check for jurisdiction-specific issues
    if (analysis.jurisdiction === 'TR') {
      return this.detectTurkishLawIssues(analysis);
    }

    return [];
  }

  private detectTurkishLawIssues(analysis: DocumentAnalysis): Risk[] {
    const risks: Risk[] = [];

    // Example: Check for KVKK (Turkish GDPR) compliance in contracts
    const hasDataProcessing = analysis.entities.some(e =>
      e.type === 'data_processing' || e.text.toLowerCase().includes('personal data')
    );

    if (hasDataProcessing) {
      const hasKVKKClause = analysis.clauses.some(c =>
        c.text.toLowerCase().includes('kvkk') ||
        c.text.toLowerCase().includes('kişisel verilerin korunması')
      );

      if (!hasKVKKClause) {
        risks.push({
          type: 'kvkk_compliance',
          severity: 'high',
          description: 'Contract involves personal data but lacks KVKK compliance clause',
          recommendation: 'Add clause addressing KVKK compliance and data processing obligations'
        });
      }
    }

    return risks;
  }

  private async detectAmbiguities(documentId: string): Promise<Risk[]> {
    const ambiguityCheck = await this.client.documents.detectAmbiguities({
      documentId,
      includeVagueTerms: true,
      includeAmbiguousReferences: true
    });

    return ambiguityCheck.ambiguities.map(amb => ({
      type: 'ambiguity',
      severity: amb.severity,
      description: amb.description,
      recommendation: amb.suggestion,
      location: amb.location
    }));
  }

  private prioritizeRisks(risks: Risk[]): Risk[] {
    const severityOrder = { high: 0, medium: 1, low: 2 };

    return risks.sort((a, b) => {
      // Sort by severity first
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }

      // Then by type (missing clauses and conflicts are more important)
      const typeOrder = {
        missing_clause: 0,
        conflicting_clauses: 1,
        kvkk_compliance: 2
      };

      const aOrder = typeOrder[a.type] ?? 999;
      const bOrder = typeOrder[b.type] ?? 999;

      return aOrder - bOrder;
    });
  }

  private generateRiskSummary(risks: Risk[]): string {
    const high = risks.filter(r => r.severity === 'high').length;
    const medium = risks.filter(r => r.severity === 'medium').length;
    const low = risks.filter(r => r.severity === 'low').length;

    let summary = `Found ${risks.length} total risks: `;
    if (high > 0) summary += `${high} high priority, `;
    if (medium > 0) summary += `${medium} medium priority, `;
    if (low > 0) summary += `${low} low priority`;

    return summary;
  }
}
```

## Step 4: Template Comparison

Compare contracts against approved templates.

```typescript
class TemplateComparator {
  constructor(private client: LyDianIQ) {}

  async compareToTemplate(
    documentId: string,
    templateId: string
  ): Promise<ComparisonResult> {
    console.log('📊 Comparing to template...\n');

    const comparison = await this.client.documents.compare({
      document1: documentId,
      document2: templateId,
      options: {
        semanticComparison: true,
        highlightDeviations: true,
        assessRisks: true
      }
    });

    const deviations = this.categorizeDeviations(comparison.differences);

    return {
      overallSimilarity: comparison.similarityScore,
      deviations,
      addedClauses: comparison.additions,
      removedClauses: comparison.deletions,
      modifiedClauses: comparison.modifications,
      riskAssessment: this.assessDeviationRisks(deviations)
    };
  }

  private categorizeDeviations(
    differences: Difference[]
  ): CategorizedDeviations {
    return {
      critical: differences.filter(d => d.severity === 'critical'),
      major: differences.filter(d => d.severity === 'major'),
      minor: differences.filter(d => d.severity === 'minor'),
      cosmetic: differences.filter(d => d.severity === 'cosmetic')
    };
  }

  private assessDeviationRisks(deviations: CategorizedDeviations): Risk[] {
    const risks: Risk[] = [];

    // Critical deviations are always risks
    for (const dev of deviations.critical) {
      risks.push({
        type: 'template_deviation',
        severity: 'high',
        description: `Critical deviation from template: ${dev.description}`,
        recommendation: 'Review with legal counsel before proceeding',
        location: dev.location
      });
    }

    // Major deviations are medium risks
    for (const dev of deviations.major) {
      risks.push({
        type: 'template_deviation',
        severity: 'medium',
        description: `Major deviation from template: ${dev.description}`,
        recommendation: dev.recommendation || 'Review this deviation',
        location: dev.location
      });
    }

    return risks;
  }
}
```

## Step 5: Report Generation

Generate comprehensive review reports.

```typescript
class ReportGenerator {
  constructor(private client: LyDianIQ) {}

  async generateReviewReport(
    contract: IngestedContract,
    clauseAnalyses: ClauseAnalysis[],
    riskReport: RiskReport,
    templateComparison?: ComparisonResult
  ): Promise<ReviewReport> {
    console.log('📝 Generating review report...\n');

    const report: ReviewReport = {
      metadata: this.generateMetadata(contract),
      executiveSummary: this.generateExecutiveSummary(
        clauseAnalyses,
        riskReport,
        templateComparison
      ),
      clauseAnalysis: this.formatClauseAnalysis(clauseAnalyses),
      riskAssessment: this.formatRiskAssessment(riskReport),
      recommendations: this.generateRecommendations(riskReport, clauseAnalyses),
      conclusion: this.generateConclusion(riskReport)
    };

    if (templateComparison) {
      report.templateComparison = this.formatTemplateComparison(templateComparison);
    }

    // Export to PDF
    const pdf = await this.client.reports.generate({
      report,
      format: 'pdf',
      options: {
        includeTableOfContents: true,
        includeExecutiveSummary: true,
        highlightRisks: true
      }
    });

    return { report, pdf };
  }

  private generateExecutiveSummary(
    analyses: ClauseAnalysis[],
    risks: RiskReport,
    comparison?: ComparisonResult
  ): string {
    const lines: string[] = [];

    lines.push(`This contract contains ${analyses.length} clauses across multiple categories.`);
    lines.push(`\nRisk Assessment: ${risks.summary}`);

    if (risks.highSeverity > 0) {
      lines.push(`\n⚠️  ${risks.highSeverity} HIGH PRIORITY issues require immediate attention.`);
    }

    if (comparison) {
      lines.push(`\nTemplate Comparison: ${(comparison.overallSimilarity * 100).toFixed(1)}% similarity to approved template.`);

      if (comparison.deviations.critical.length > 0) {
        lines.push(`${comparison.deviations.critical.length} critical deviations identified.`);
      }
    }

    return lines.join(' ');
  }

  private formatClauseAnalysis(analyses: ClauseAnalysis[]): FormattedClauseAnalysis {
    const unusual = analyses.filter(a => a.standardness < 0.6);
    const standard = analyses.filter(a => a.standardness >= 0.6);

    return {
      total: analyses.length,
      standard: standard.length,
      unusual: unusual.length,
      details: analyses.map(a => ({
        reference: a.clause.reference,
        category: a.category,
        standardness: a.standardness,
        riskCount: a.risks.length
      }))
    };
  }

  private formatRiskAssessment(risks: RiskReport): FormattedRiskAssessment {
    return {
      summary: risks.summary,
      breakdown: {
        high: risks.highSeverity,
        medium: risks.mediumSeverity,
        low: risks.lowSeverity
      },
      topRisks: risks.risks.slice(0, 10).map(r => ({
        type: r.type,
        severity: r.severity,
        description: r.description,
        location: r.location
      }))
    };
  }

  private generateRecommendations(
    risks: RiskReport,
    analyses: ClauseAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    // High priority risks should have recommendations
    const highRisks = risks.risks.filter(r => r.severity === 'high');
    for (const risk of highRisks.slice(0, 5)) {
      recommendations.push(risk.recommendation);
    }

    // Unusual clauses should be reviewed
    const unusual = analyses.filter(a => a.standardness < 0.5);
    if (unusual.length > 0) {
      recommendations.push(
        `Review ${unusual.length} non-standard clauses with legal counsel`
      );
    }

    return recommendations;
  }

  private generateConclusion(risks: RiskReport): string {
    if (risks.highSeverity === 0 && risks.mediumSeverity <= 2) {
      return 'This contract is generally well-drafted with minimal issues. Recommend proceeding after addressing minor points.';
    } else if (risks.highSeverity > 0) {
      return 'This contract has significant issues that require immediate attention before execution. Legal review strongly recommended.';
    } else {
      return 'This contract has some issues that should be addressed. Recommend negotiating changes before execution.';
    }
  }

  private generateMetadata(contract: IngestedContract): ReportMetadata {
    return {
      documentId: contract.documentId,
      filename: contract.filename,
      reviewedAt: new Date().toISOString(),
      reviewerVersion: 'LyDian IQ v2.1.0'
    };
  }

  private formatTemplateComparison(comparison: ComparisonResult): FormattedTemplateComparison {
    return {
      similarityScore: comparison.overallSimilarity,
      deviations: {
        critical: comparison.deviations.critical.length,
        major: comparison.deviations.major.length,
        minor: comparison.deviations.minor.length
      },
      addedClauses: comparison.addedClauses.length,
      removedClauses: comparison.removedClauses.length,
      modifiedClauses: comparison.modifiedClauses.length
    };
  }
}
```

## Step 6: Complete Review System

Put it all together into a complete system.

```typescript
class ContractReviewSystem {
  private ingestion: ContractIngestion;
  private clauseAnalyzer: ClauseAnalyzer;
  private riskEngine: RiskEngine;
  private templateComparator: TemplateComparator;
  private reportGenerator: ReportGenerator;

  constructor(private client: LyDianIQ) {
    this.ingestion = new ContractIngestion(client);
    this.clauseAnalyzer = new ClauseAnalyzer(client);
    this.riskEngine = new RiskEngine(client);
    this.templateComparator = new TemplateComparator(client);
    this.reportGenerator = new ReportGenerator(client);
  }

  async reviewContract(
    filePath: string,
    options?: ReviewOptions
  ): Promise<ContractReview> {
    console.log('🚀 Starting Contract Review');
    console.log('═══════════════════════════════\n');

    // Step 1: Ingest
    const contract = await this.ingestion.ingestContract(filePath);
    console.log('');

    // Step 2: Analyze clauses
    const clauseAnalyses = await this.clauseAnalyzer.analyzeAllClauses(
      contract.documentId
    );
    console.log('');

    // Step 3: Detect risks
    const riskReport = await this.riskEngine.detectAllRisks(
      contract.documentId,
      clauseAnalyses
    );
    console.log('');

    // Step 4: Compare to template (if provided)
    let templateComparison: ComparisonResult | undefined;
    if (options?.templateId) {
      templateComparison = await this.templateComparator.compareToTemplate(
        contract.documentId,
        options.templateId
      );
      console.log('');
    }

    // Step 5: Generate report
    const { report, pdf } = await this.reportGenerator.generateReviewReport(
      contract,
      clauseAnalyses,
      riskReport,
      templateComparison
    );

    // Save report
    const reportPath = `./reports/review-${contract.documentId}.pdf`;
    fs.writeFileSync(reportPath, pdf);

    console.log('✅ Review Complete!');
    console.log(`📄 Report saved to: ${reportPath}\n`);

    return {
      contract,
      clauseAnalyses,
      riskReport,
      templateComparison,
      report,
      reportPath
    };
  }

  async batchReview(
    directory: string,
    options?: ReviewOptions
  ): Promise<ContractReview[]> {
    const files = fs.readdirSync(directory)
      .filter(f => f.endsWith('.pdf') || f.endsWith('.docx'))
      .map(f => path.join(directory, f));

    console.log(`🚀 Batch Review: ${files.length} contracts\n`);

    const reviews = await Promise.all(
      files.map(file => this.reviewContract(file, options))
    );

    // Generate summary report
    this.generateBatchSummary(reviews);

    return reviews;
  }

  private generateBatchSummary(reviews: ContractReview[]): void {
    console.log('\n📊 Batch Review Summary');
    console.log('═══════════════════════════════\n');

    const totalRisks = reviews.reduce((sum, r) => sum + r.riskReport.totalRisks, 0);
    const highRisks = reviews.reduce((sum, r) => sum + r.riskReport.highSeverity, 0);

    console.log(`Total Contracts: ${reviews.length}`);
    console.log(`Total Risks: ${totalRisks}`);
    console.log(`High Priority Risks: ${highRisks}\n`);

    const contractsWithHighRisks = reviews.filter(
      r => r.riskReport.highSeverity > 0
    );

    if (contractsWithHighRisks.length > 0) {
      console.log('⚠️  Contracts Requiring Immediate Attention:');
      for (const review of contractsWithHighRisks) {
        console.log(`  - ${review.contract.filename}: ${review.riskReport.highSeverity} high-priority issues`);
      }
    }
  }
}

// Usage
async function main() {
  const client = new LyDianIQ({
    apiKey: process.env.LYDIAN_API_KEY!
  });

  const system = new ContractReviewSystem(client);

  // Review single contract
  const review = await system.reviewContract('./contracts/sample.pdf', {
    templateId: 'template-commercial-contract'
  });

  // Or batch review
  // const reviews = await system.batchReview('./contracts', {
  //   templateId: 'template-commercial-contract'
  // });
}

main().catch(console.error);
```

## Example Output

```
🚀 Starting Contract Review
═══════════════════════════════

📄 Ingesting: commercial-agreement.pdf
✅ Document uploaded: doc_abc123

🔍 Analyzing 24 clauses...

Clause Breakdown:
  payment: 3 clauses
  liability: 2 clauses
  confidentiality: 2 clauses
  term_termination: 2 clauses
  warranties: 3 clauses
  indemnification: 2 clauses
  intellectual_property: 1 clauses
  dispute_resolution: 1 clauses
  general: 8 clauses

⚠️  Running comprehensive risk analysis...

📊 Comparing to template...

📝 Generating review report...

✅ Review Complete!
📄 Report saved to: ./reports/review-doc_abc123.pdf

Risk Summary:
- 12 total risks identified
- 3 high priority
- 6 medium priority
- 3 low priority

Top Issues:
1. [HIGH] Missing limitation of liability cap
2. [HIGH] Auto-renewal without clear opt-out
3. [HIGH] Overly broad indemnification clause
4. [MEDIUM] Non-standard warranty language
5. [MEDIUM] Missing force majeure clause
```

## Next Steps

- [Advanced Clause Extraction](/docs/en/cookbooks/lydian-iq-advanced-extraction.md)
- [Custom Risk Rules](/docs/en/guides/lydian-iq-custom-risk-rules.md)
- [Integration with Contract Management Systems](/docs/en/guides/lydian-iq-cms-integration.md)

## Support

For questions about contract review automation:
- Email: legal-ai@lydian.com
- Documentation: https://docs.lydian.com/lydian-iq
- Community: https://community.lydian.com/lydian-iq

---

**Tutorial Version**: 1.0.0
**Last Updated**: 2025-01-05
**LyDian IQ Version**: 2.1.0+
