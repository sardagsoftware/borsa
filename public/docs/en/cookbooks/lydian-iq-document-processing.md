# LyDian IQ Document Processing Cookbook

## Introduction

This cookbook provides production-ready recipes for processing legal documents with LyDian IQ. Each recipe includes complete code examples and best practices.

## Recipe 1: Batch Contract Analysis with Progress Tracking

**Problem**: Need to analyze hundreds of contracts efficiently with real-time progress updates.

**Solution**: Use streaming batch processing with webhooks for progress tracking.

```typescript
import { LyDianIQ } from '@lydian/lydian-iq';
import EventEmitter from 'events';

class BatchContractAnalyzer extends EventEmitter {
  constructor(private client: LyDianIQ) {
    super();
  }

  async analyzeBatch(files: string[]): Promise<BatchResult> {
    // Create batch job
    const batch = await this.client.documents.createBatch({
      files: files.map(f => ({ path: f, type: 'contract' })),
      options: {
        parallel: 5, // Process 5 at a time
        extractEntities: true,
        identifyRisks: true
      },
      webhook: {
        url: 'https://your-api.com/webhooks/batch-progress',
        events: ['progress', 'completed', 'failed']
      }
    });

    // Poll for progress
    const results = await this.pollBatchProgress(batch.id);

    return results;
  }

  private async pollBatchProgress(batchId: string): Promise<BatchResult> {
    let status: BatchStatus;

    do {
      await new Promise(resolve => setTimeout(resolve, 2000));

      status = await this.client.documents.getBatchStatus(batchId);

      this.emit('progress', {
        completed: status.completed,
        total: status.total,
        percentage: (status.completed / status.total) * 100
      });

    } while (status.status === 'processing');

    const results = await this.client.documents.getBatchResults(batchId);
    this.emit('completed', results);

    return results;
  }
}

// Usage
const analyzer = new BatchContractAnalyzer(client);

analyzer.on('progress', (progress) => {
  console.log(`Progress: ${progress.completed}/${progress.total} (${progress.percentage.toFixed(1)}%)`);
});

analyzer.on('completed', (results) => {
  console.log(`✅ Batch complete: ${results.length} contracts analyzed`);
});

const results = await analyzer.analyzeBatch([
  './contracts/contract-1.pdf',
  './contracts/contract-2.pdf',
  // ... more files
]);
```

**Related**: [Batch Processing API](/docs/en/api-reference/lydian-iq.md#batch-processing)

---

## Recipe 2: Smart Document Classification

**Problem**: Automatically classify and route legal documents to appropriate workflows.

**Solution**: Multi-level classification with confidence thresholds and fallback logic.

```typescript
interface DocumentRouter {
  route(document: Buffer): Promise<RoutingDecision>;
}

class SmartDocumentClassifier implements DocumentRouter {
  constructor(private client: LyDianIQ) {}

  async route(document: Buffer): Promise<RoutingDecision> {
    // Step 1: Quick classification
    const quickClass = await this.client.documents.classifyQuick({
      document,
      models: ['fast'],
      confidenceThreshold: 0.8
    });

    if (quickClass.confidence >= 0.8) {
      return this.makeRoutingDecision(quickClass);
    }

    // Step 2: Detailed classification if confidence is low
    const detailedClass = await this.client.documents.classify({
      document,
      models: ['accurate'],
      extractSignatures: true,
      detectLanguage: true
    });

    if (detailedClass.confidence >= 0.6) {
      return this.makeRoutingDecision(detailedClass);
    }

    // Step 3: Manual review queue
    return {
      type: 'unknown',
      confidence: detailedClass.confidence,
      route: 'manual_review',
      reason: 'Low confidence classification',
      suggestions: detailedClass.possibleTypes
    };
  }

  private makeRoutingDecision(
    classification: Classification
  ): RoutingDecision {
    const routes: Record<string, string> = {
      'employment_contract': 'employment_workflow',
      'nda': 'nda_workflow',
      'service_agreement': 'commercial_workflow',
      'lease': 'real_estate_workflow',
      'court_filing': 'litigation_workflow'
    };

    return {
      type: classification.type,
      confidence: classification.confidence,
      route: routes[classification.type] || 'general_workflow',
      metadata: classification.metadata
    };
  }
}

// Usage
const classifier = new SmartDocumentClassifier(client);

const document = fs.readFileSync('./unknown-document.pdf');
const decision = await classifier.route(document);

console.log(`Document Type: ${decision.type}`);
console.log(`Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
console.log(`Route to: ${decision.route}`);
```

---

## Recipe 3: Redaction and Anonymization

**Problem**: Remove sensitive information from legal documents for sharing or compliance.

**Solution**: AI-powered entity detection with customizable redaction rules.

```typescript
interface RedactionRule {
  entityType: string;
  action: 'redact' | 'anonymize' | 'tokenize';
  replacement?: string;
}

class DocumentRedactor {
  constructor(private client: LyDianIQ) {}

  async redactDocument(
    document: Buffer,
    rules: RedactionRule[]
  ): Promise<RedactedDocument> {
    // Detect sensitive entities
    const entities = await this.client.documents.extractEntities({
      document,
      entityTypes: [
        'PERSON', 'EMAIL', 'PHONE', 'SSN', 'CREDIT_CARD',
        'ADDRESS', 'DATE_OF_BIRTH', 'BANK_ACCOUNT'
      ],
      includeLocations: true
    });

    // Apply redaction rules
    const redactions = entities.flatMap(entity => {
      const rule = rules.find(r => r.entityType === entity.type);
      if (!rule) return [];

      return {
        location: entity.location,
        original: entity.text,
        replacement: this.getReplacement(entity, rule),
        action: rule.action
      };
    });

    // Create redacted document
    const redacted = await this.client.documents.redact({
      document,
      redactions,
      options: {
        preserveFormatting: true,
        addWatermark: 'REDACTED COPY',
        generateAuditLog: true
      }
    });

    return {
      document: redacted.document,
      redactionCount: redactions.length,
      auditLog: redacted.auditLog,
      mapping: redacted.tokenMapping // for reversible redactions
    };
  }

  private getReplacement(entity: Entity, rule: RedactionRule): string {
    switch (rule.action) {
      case 'redact':
        return rule.replacement || '█'.repeat(entity.text.length);

      case 'anonymize':
        return this.generateAnonymousValue(entity.type);

      case 'tokenize':
        return `[${entity.type}-${this.generateToken()}]`;

      default:
        return '[REDACTED]';
    }
  }

  private generateAnonymousValue(entityType: string): string {
    const generators: Record<string, () => string> = {
      PERSON: () => `Person ${Math.floor(Math.random() * 1000)}`,
      EMAIL: () => `user${Math.floor(Math.random() * 1000)}@example.com`,
      PHONE: () => `+1-555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      ADDRESS: () => `${Math.floor(Math.random() * 9999)} Main St`
    };

    return generators[entityType]?.() || '[ANONYMOUS]';
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

// Usage
const redactor = new DocumentRedactor(client);

const rules: RedactionRule[] = [
  { entityType: 'PERSON', action: 'anonymize' },
  { entityType: 'EMAIL', action: 'redact' },
  { entityType: 'SSN', action: 'redact', replacement: 'XXX-XX-XXXX' },
  { entityType: 'PHONE', action: 'tokenize' }
];

const result = await redactor.redactDocument(document, rules);
console.log(`Redacted ${result.redactionCount} entities`);
```

---

## Recipe 4: Document Version Comparison

**Problem**: Track changes between document versions and identify significant modifications.

**Solution**: Semantic diff with clause-level change tracking.

```typescript
class DocumentVersionComparator {
  constructor(private client: LyDianIQ) {}

  async compareVersions(
    oldVersion: Buffer,
    newVersion: Buffer
  ): Promise<VersionComparison> {
    // Perform deep comparison
    const comparison = await this.client.documents.compare({
      document1: oldVersion,
      document2: newVersion,
      options: {
        semanticDiff: true,
        clauseLevel: true,
        highlightChanges: true,
        assessImpact: true
      }
    });

    // Categorize changes
    const categorized = this.categorizeChanges(comparison.changes);

    // Generate change report
    const report = await this.generateChangeReport(categorized);

    return {
      changes: categorized,
      report,
      summary: this.generateSummary(categorized)
    };
  }

  private categorizeChanges(changes: Change[]): CategorizedChanges {
    return {
      critical: changes.filter(c => c.impact === 'critical'),
      major: changes.filter(c => c.impact === 'major'),
      minor: changes.filter(c => c.impact === 'minor'),
      formatting: changes.filter(c => c.impact === 'formatting')
    };
  }

  private generateSummary(changes: CategorizedChanges): string {
    const parts: string[] = [];

    if (changes.critical.length > 0) {
      parts.push(`${changes.critical.length} critical changes`);
    }
    if (changes.major.length > 0) {
      parts.push(`${changes.major.length} major changes`);
    }
    if (changes.minor.length > 0) {
      parts.push(`${changes.minor.length} minor changes`);
    }

    return parts.join(', ') || 'No significant changes';
  }

  private async generateChangeReport(
    changes: CategorizedChanges
  ): Promise<Buffer> {
    return this.client.reports.generate({
      type: 'version_comparison',
      data: changes,
      format: 'pdf',
      options: {
        includeTrackChanges: true,
        highlightCritical: true
      }
    });
  }
}

// Usage
const comparator = new DocumentVersionComparator(client);

const v1 = fs.readFileSync('./contract-v1.pdf');
const v2 = fs.readFileSync('./contract-v2.pdf');

const comparison = await comparator.compareVersions(v1, v2);

console.log(comparison.summary);
console.log(`Critical changes: ${comparison.changes.critical.length}`);

// Save change report
fs.writeFileSync('./version-comparison.pdf', comparison.report);
```

---

## Recipe 5: Multi-Language Document Processing

**Problem**: Process legal documents in multiple languages with consistent results.

**Solution**: Auto-detection with language-specific processing pipelines.

```typescript
class MultiLanguageProcessor {
  constructor(private client: LyDianIQ) {}

  async processDocument(document: Buffer): Promise<ProcessedDocument> {
    // Detect language
    const detection = await this.client.documents.detectLanguage({
      document,
      includeConfidence: true
    });

    console.log(`Detected: ${detection.language} (${(detection.confidence * 100).toFixed(1)}% confidence)`);

    // Get language-specific pipeline
    const pipeline = this.getPipeline(detection.language);

    // Process with appropriate settings
    const result = await this.client.documents.analyze({
      document,
      language: detection.language,
      options: {
        ...pipeline.options,
        translateToEnglish: pipeline.translateForAnalysis,
        preserveOriginal: true
      }
    });

    // Post-process based on language
    return this.postProcess(result, detection.language);
  }

  private getPipeline(language: string): ProcessingPipeline {
    const pipelines: Record<string, ProcessingPipeline> = {
      'tr': {
        options: {
          jurisdiction: 'TR',
          citationFormat: 'turkish',
          dateFormat: 'DD.MM.YYYY'
        },
        translateForAnalysis: false, // Turkish model available
        legalTermsDictionary: 'turkish_legal'
      },
      'de': {
        options: {
          jurisdiction: 'DE',
          citationFormat: 'german',
          dateFormat: 'DD.MM.YYYY'
        },
        translateForAnalysis: false,
        legalTermsDictionary: 'german_legal'
      },
      'en': {
        options: {
          jurisdiction: 'US',
          citationFormat: 'bluebook',
          dateFormat: 'MM/DD/YYYY'
        },
        translateForAnalysis: false,
        legalTermsDictionary: 'english_legal'
      }
    };

    return pipelines[language] || pipelines['en'];
  }

  private async postProcess(
    result: AnalysisResult,
    language: string
  ): Promise<ProcessedDocument> {
    // Language-specific post-processing
    if (language === 'tr') {
      result = await this.processTurkishLegalTerms(result);
    }

    return {
      ...result,
      originalLanguage: language,
      processedAt: new Date()
    };
  }

  private async processTurkishLegalTerms(
    result: AnalysisResult
  ): Promise<AnalysisResult> {
    // Map Turkish legal terms to international equivalents
    const termMapping = await this.client.legal.mapTerms({
      terms: result.entities.legalTerms,
      from: 'tr',
      to: 'international'
    });

    result.entities.legalTermsInternational = termMapping;
    return result;
  }
}

// Usage
const processor = new MultiLanguageProcessor(client);

const documents = [
  fs.readFileSync('./turkish-contract.pdf'),
  fs.readFileSync('./german-contract.pdf'),
  fs.readFileSync('./english-contract.pdf')
];

for (const doc of documents) {
  const result = await processor.processDocument(doc);
  console.log(`Processed ${result.originalLanguage} document`);
}
```

---

## Recipe 6: Incremental Document Updates

**Problem**: Efficiently re-analyze documents when only small sections change.

**Solution**: Delta processing with change detection.

```typescript
class IncrementalDocumentProcessor {
  private cache = new Map<string, CachedAnalysis>();

  constructor(private client: LyDianIQ) {}

  async analyzeWithCache(
    documentId: string,
    document: Buffer
  ): Promise<AnalysisResult> {
    // Check if we have a cached version
    const cached = this.cache.get(documentId);

    if (!cached) {
      // First time - full analysis
      return this.fullAnalysis(documentId, document);
    }

    // Compute document hash
    const hash = this.computeHash(document);

    if (hash === cached.hash) {
      // No changes - return cached
      console.log('✅ No changes detected, using cached analysis');
      return cached.analysis;
    }

    // Detect changes
    const changes = await this.client.documents.detectChanges({
      originalHash: cached.hash,
      newDocument: document,
      granularity: 'clause'
    });

    if (changes.changedSections.length < 3) {
      // Small changes - incremental update
      return this.incrementalUpdate(documentId, document, cached, changes);
    } else {
      // Large changes - full reanalysis
      return this.fullAnalysis(documentId, document);
    }
  }

  private async incrementalUpdate(
    documentId: string,
    document: Buffer,
    cached: CachedAnalysis,
    changes: DocumentChanges
  ): Promise<AnalysisResult> {
    console.log(`📊 Incremental update: ${changes.changedSections.length} sections changed`);

    // Reanalyze only changed sections
    const updates = await Promise.all(
      changes.changedSections.map(section =>
        this.client.documents.analyzeSection({
          documentId,
          sectionId: section.id,
          content: section.newContent
        })
      )
    );

    // Merge with cached analysis
    const merged = this.mergeAnalyses(cached.analysis, updates);

    // Update cache
    this.cache.set(documentId, {
      hash: this.computeHash(document),
      analysis: merged,
      updatedAt: new Date()
    });

    return merged;
  }

  private async fullAnalysis(
    documentId: string,
    document: Buffer
  ): Promise<AnalysisResult> {
    console.log('📄 Performing full analysis');

    const analysis = await this.client.documents.analyze({
      document,
      documentId,
      options: { extractAll: true }
    });

    // Cache result
    this.cache.set(documentId, {
      hash: this.computeHash(document),
      analysis,
      updatedAt: new Date()
    });

    return analysis;
  }

  private mergeAnalyses(
    base: AnalysisResult,
    updates: SectionAnalysis[]
  ): AnalysisResult {
    const merged = { ...base };

    for (const update of updates) {
      // Update specific section
      const sectionIndex = merged.sections.findIndex(
        s => s.id === update.sectionId
      );

      if (sectionIndex >= 0) {
        merged.sections[sectionIndex] = {
          ...merged.sections[sectionIndex],
          ...update.analysis
        };
      }
    }

    return merged;
  }

  private computeHash(document: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(document).digest('hex');
  }
}

// Usage
const processor = new IncrementalDocumentProcessor(client);

// First analysis
let result = await processor.analyzeWithCache('doc-1', document);

// Make small edit to document
const updatedDocument = makeSmallEdit(document);

// Efficient reanalysis
result = await processor.analyzeWithCache('doc-1', updatedDocument);
```

---

## Recipes 7-10 Summary

**Recipe 7: OCR with Post-Processing Correction**
- Handles scanned documents with low quality
- AI-powered OCR error correction
- Legal terminology-aware spell checking

**Recipe 8: Table and Schedule Extraction**
- Extracts structured data from tables
- Handles complex nested tables
- Exports to JSON/CSV for analysis

**Recipe 9: Signature and Date Extraction**
- Detects signature blocks
- Extracts execution dates
- Validates signature presence

**Recipe 10: Document Splitting and Reassembly**
- Splits multi-document PDFs
- Intelligent boundary detection
- Maintains document relationships

## Best Practices

1. **Always validate file types** before processing
2. **Use batch processing** for multiple documents
3. **Implement caching** to avoid redundant analysis
4. **Handle errors gracefully** with retry logic
5. **Monitor API usage** and implement rate limiting

## Related Documentation

- [LyDian IQ API Reference](/docs/en/api-reference/lydian-iq.md)
- [Document Understanding Concepts](/docs/en/concepts/lydian-iq-document-understanding.md)
- [Quickstart Tutorial](/docs/en/tutorials/lydian-iq-quickstart.md)

## Support

For questions about document processing:
- Email: legal-ai@lydian.com
- Documentation: https://docs.lydian.com/lydian-iq
- Community: https://community.lydian.com/lydian-iq
