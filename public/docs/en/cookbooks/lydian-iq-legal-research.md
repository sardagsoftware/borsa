# LyDian IQ Legal Research Cookbook

## Introduction

This cookbook provides production-ready recipes for conducting legal research with LyDian IQ. Each recipe demonstrates how to search case law, analyze precedents, and build legal arguments using AI.

## Recipe 1: Semantic Case Law Search

**Problem**: Find relevant cases using natural language queries instead of complex Boolean searches.

**Solution**: Use semantic search with relevance ranking and context understanding.

```typescript
import { LyDianIQ } from '@lydian/lydian-iq';

class SemanticCaseLawSearch {
  constructor(private client: LyDianIQ) {}

  async search(query: string, options?: SearchOptions): Promise<SearchResults> {
    // Perform semantic search
    const results = await this.client.caselaw.search({
      query,
      jurisdiction: options?.jurisdiction || 'TR',
      dateRange: options?.dateRange,
      courts: options?.courts,
      searchMode: 'semantic', // vs 'keyword'
      minRelevance: 0.6,
      limit: options?.limit || 20,
      includeContext: true
    });

    // Enhance results with explanations
    const enhanced = await this.enhanceResults(results, query);

    return {
      query,
      results: enhanced,
      totalFound: results.total,
      searchStrategy: results.strategy
    };
  }

  private async enhanceResults(
    results: CaseResult[],
    query: string
  ): Promise<EnhancedCaseResult[]> {
    return Promise.all(
      results.map(async (case_) => {
        // Explain why this case is relevant
        const explanation = await this.client.caselaw.explainRelevance({
          caseId: case_.id,
          query,
          highlightReasons: true
        });

        return {
          ...case_,
          relevanceExplanation: explanation.reasoning,
          keyPassages: explanation.passages,
          similarityScore: case_.relevanceScore
        };
      })
    );
  }

  async buildCitationNetwork(seedCaseId: string): Promise<CitationNetwork> {
    // Get cases cited by seed case
    const citedBy = await this.client.caselaw.getCitations({
      caseId: seedCaseId,
      direction: 'forward'
    });

    // Get cases that cite the seed case
    const citing = await this.client.caselaw.getCitations({
      caseId: seedCaseId,
      direction: 'backward'
    });

    // Build network graph
    return {
      seedCase: seedCaseId,
      citedCases: citedBy,
      citingCases: citing,
      depth: 1,
      visualization: this.generateNetworkVisualization(seedCaseId, citedBy, citing)
    };
  }

  private generateNetworkVisualization(
    seed: string,
    cited: Case[],
    citing: Case[]
  ): NetworkGraph {
    const nodes = [
      { id: seed, type: 'seed', label: 'Target Case' },
      ...cited.map(c => ({ id: c.id, type: 'cited', label: c.citation })),
      ...citing.map(c => ({ id: c.id, type: 'citing', label: c.citation }))
    ];

    const edges = [
      ...cited.map(c => ({ from: seed, to: c.id, type: 'cites' })),
      ...citing.map(c => ({ from: c.id, to: seed, type: 'cites' }))
    ];

    return { nodes, edges };
  }
}

// Usage
const search = new SemanticCaseLawSearch(client);

// Natural language search
const results = await search.search(
  "Can employer fire employee during pregnancy in Turkey?",
  {
    jurisdiction: 'TR',
    courts: ['yargitay'], // Turkish Supreme Court
    dateRange: {
      start: new Date('2018-01-01'),
      end: new Date()
    }
  }
);

console.log(`Found ${results.totalFound} relevant cases\n`);

for (const case_ of results.results.slice(0, 5)) {
  console.log(`${case_.citation}`);
  console.log(`Relevance: ${(case_.similarityScore * 100).toFixed(1)}%`);
  console.log(`Why relevant: ${case_.relevanceExplanation}`);
  console.log(`Key passage: "${case_.keyPassages[0]}"\n`);
}

// Build citation network
const network = await search.buildCitationNetwork(results.results[0].id);
console.log(`\nCitation Network:`);
console.log(`  Cases cited: ${network.citedCases.length}`);
console.log(`  Cases citing this: ${network.citingCases.length}`);
```

**Related**: [Case Law Search API](/docs/en/api-reference/lydian-iq.md#caselaw-search)

---

## Recipe 2: Precedent Analysis and Extraction

**Problem**: Extract legal principles and holdings from case law for application to new cases.

**Solution**: AI-powered precedent extraction with analogical reasoning.

```typescript
class PrecedentAnalyzer {
  constructor(private client: LyDianIQ) {}

  async analyzePrecedent(caseId: string): Promise<PrecedentAnalysis> {
    // Get full case text
    const case_ = await this.client.caselaw.getCase(caseId);

    // Extract structure
    const structure = await this.client.caselaw.extractStructure({
      caseId,
      elements: ['facts', 'issues', 'holdings', 'reasoning', 'disposition']
    });

    // Extract legal principles
    const principles = await this.extractPrinciples(case_, structure);

    // Identify precedential value
    const value = await this.assessPrecedentialValue(case_);

    return {
      case: case_,
      structure,
      principles,
      precedentialValue: value,
      applicability: await this.assessApplicability(principles)
    };
  }

  private async extractPrinciples(
    case_: Case,
    structure: CaseStructure
  ): Promise<LegalPrinciple[]> {
    const extraction = await this.client.caselaw.extractPrinciples({
      caseId: case_.id,
      reasoning: structure.reasoning,
      holdings: structure.holdings,
      extractionMode: 'comprehensive'
    });

    return extraction.principles.map(p => ({
      text: p.text,
      category: p.category,
      abstract: p.abstract,
      specific: p.specific,
      confidence: p.confidence,
      sourceSection: p.sourceSection
    }));
  }

  private async assessPrecedentialValue(case_: Case): Promise<PrecedentialValue> {
    const factors = {
      courtLevel: this.getCourtWeight(case_.court),
      citationCount: await this.getCitationCount(case_.id),
      age: this.calculateAgeFactor(case_.date),
      treatment: await this.analyzeJudicialTreatment(case_.id)
    };

    const overallValue = this.computePrecedentialValue(factors);

    return {
      overall: overallValue,
      binding: case_.court.level === 'supreme',
      persuasive: overallValue > 0.6,
      factors,
      explanation: this.explainPrecedentialValue(factors)
    };
  }

  private getCourtWeight(court: Court): number {
    const weights = {
      supreme: 1.0,
      appellate: 0.7,
      trial: 0.3
    };
    return weights[court.level] || 0.5;
  }

  private async getCitationCount(caseId: string): Promise<number> {
    const citations = await this.client.caselaw.getCitations({
      caseId,
      direction: 'backward'
    });
    return citations.length;
  }

  private calculateAgeFactor(date: Date): number {
    const yearsOld = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);

    // Recent cases are more relevant
    if (yearsOld < 5) return 1.0;
    if (yearsOld < 10) return 0.8;
    if (yearsOld < 20) return 0.5;
    return 0.3;
  }

  private async analyzeJudicialTreatment(caseId: string): Promise<Treatment> {
    const treatment = await this.client.caselaw.getTreatment({
      caseId,
      includeCitations: true
    });

    return {
      followed: treatment.followedCount,
      distinguished: treatment.distinguishedCount,
      questioned: treatment.questionedCount,
      overruled: treatment.overruled
    };
  }

  private computePrecedentialValue(factors: any): number {
    const weights = {
      courtLevel: 0.4,
      citationCount: 0.2,
      age: 0.2,
      treatment: 0.2
    };

    let score = factors.courtLevel * weights.courtLevel;
    score += Math.min(factors.citationCount / 100, 1) * weights.citationCount;
    score += factors.age * weights.age;

    // Treatment factor
    const treatmentScore = Math.max(0,
      (factors.treatment.followed - factors.treatment.questioned) / 10
    );
    score += Math.min(treatmentScore, 1) * weights.treatment;

    return Math.min(score, 1);
  }

  private explainPrecedentialValue(factors: any): string {
    const reasons: string[] = [];

    if (factors.courtLevel >= 0.7) {
      reasons.push('High court level');
    }

    if (factors.citationCount > 50) {
      reasons.push('Frequently cited');
    }

    if (factors.age > 0.8) {
      reasons.push('Recent decision');
    }

    if (factors.treatment.followed > factors.treatment.questioned) {
      reasons.push('Positively treated by later courts');
    }

    return reasons.join('; ') || 'Limited precedential value';
  }

  private async assessApplicability(
    principles: LegalPrinciple[]
  ): Promise<Applicability> {
    // Assess how broadly each principle can be applied
    return {
      broad: principles.filter(p => p.abstract).length,
      narrow: principles.filter(p => p.specific).length,
      jurisdictions: ['TR'], // TODO: Determine applicable jurisdictions
      contexts: await this.identifyApplicableContexts(principles)
    };
  }

  private async identifyApplicableContexts(
    principles: LegalPrinciple[]
  ): Promise<string[]> {
    const contexts = new Set<string>();

    for (const principle of principles) {
      const analysis = await this.client.legal.analyzeContext({
        text: principle.text,
        identifyDomains: true
      });

      analysis.domains.forEach(d => contexts.add(d));
    }

    return Array.from(contexts);
  }
}

// Usage
const analyzer = new PrecedentAnalyzer(client);

const analysis = await analyzer.analyzePrecedent('case-yargitay-2023-1234');

console.log(`Precedential Value: ${(analysis.precedentialValue.overall * 100).toFixed(1)}%`);
console.log(`Binding: ${analysis.precedentialValue.binding ? 'Yes' : 'No'}`);
console.log(`\nExtracted Principles: ${analysis.principles.length}`);

for (const principle of analysis.principles) {
  console.log(`\n- ${principle.text}`);
  console.log(`  Category: ${principle.category}`);
  console.log(`  Confidence: ${(principle.confidence * 100).toFixed(1)}%`);
}
```

---

## Recipe 3: Legal Question Answering with Sources

**Problem**: Answer legal questions with proper citations and reasoning chains.

**Solution**: RAG (Retrieval-Augmented Generation) with citation tracking.

```typescript
class LegalQuestionAnswering {
  constructor(private client: LyDianIQ) {}

  async answerQuestion(
    question: string,
    options?: AnswerOptions
  ): Promise<LegalAnswer> {
    // Step 1: Retrieve relevant sources
    const sources = await this.retrieveRelevantSources(question, options);

    // Step 2: Generate answer using retrieved context
    const answer = await this.client.reasoning.answer({
      question,
      context: sources,
      jurisdiction: options?.jurisdiction || 'TR',
      options: {
        includeCitations: true,
        includeReasoningSteps: true,
        confidenceThreshold: 0.7
      }
    });

    // Step 3: Verify answer against sources
    const verification = await this.verifyAnswer(answer, sources);

    return {
      question,
      answer: answer.text,
      confidence: answer.confidence,
      citations: this.formatCitations(answer.citations),
      reasoning: answer.reasoningSteps,
      sources,
      verification
    };
  }

  private async retrieveRelevantSources(
    question: string,
    options?: AnswerOptions
  ): Promise<LegalSource[]> {
    const sources: LegalSource[] = [];

    // Search case law
    const cases = await this.client.caselaw.search({
      query: question,
      jurisdiction: options?.jurisdiction,
      limit: 5
    });

    sources.push(...cases.results.map(c => ({
      type: 'caselaw' as const,
      id: c.id,
      citation: c.citation,
      excerpt: c.relevantPassage,
      relevance: c.relevanceScore
    })));

    // Search statutes
    const statutes = await this.client.statutes.search({
      query: question,
      jurisdiction: options?.jurisdiction,
      limit: 3
    });

    sources.push(...statutes.results.map(s => ({
      type: 'statute' as const,
      id: s.id,
      citation: s.reference,
      excerpt: s.text,
      relevance: s.relevanceScore
    })));

    // Search regulations
    const regulations = await this.client.regulations.search({
      query: question,
      jurisdiction: options?.jurisdiction,
      limit: 2
    });

    sources.push(...regulations.results.map(r => ({
      type: 'regulation' as const,
      id: r.id,
      citation: r.reference,
      excerpt: r.text,
      relevance: r.relevanceScore
    })));

    // Sort by relevance
    return sources.sort((a, b) => b.relevance - a.relevance);
  }

  private async verifyAnswer(
    answer: Answer,
    sources: LegalSource[]
  ): Promise<Verification> {
    // Check if answer is supported by sources
    const verification = await this.client.reasoning.verify({
      claim: answer.text,
      sources: sources.map(s => s.excerpt),
      strict: true
    });

    return {
      supported: verification.supported,
      confidence: verification.confidence,
      supportingPassages: verification.supportingEvidence,
      conflictingPassages: verification.conflictingEvidence
    };
  }

  private formatCitations(citations: Citation[]): FormattedCitation[] {
    return citations.map(c => ({
      text: c.text,
      source: c.source,
      inlineFormat: this.toInlineFormat(c),
      bluebook: this.toBluebook(c)
    }));
  }

  private toInlineFormat(citation: Citation): string {
    return `(${citation.source}, ${citation.year})`;
  }

  private toBluebook(citation: Citation): string {
    // Format according to Bluebook citation style
    return citation.bluebookFormat || citation.source;
  }

  async answerWithAlternatives(question: string): Promise<MultiAnswer> {
    // Generate multiple perspectives/interpretations
    const perspectives = await this.client.reasoning.generatePerspectives({
      question,
      count: 3,
      requireDifferent: true
    });

    const answers = await Promise.all(
      perspectives.map(p =>
        this.answerQuestion(question, { perspective: p.viewpoint })
      )
    );

    return {
      question,
      perspectives: answers,
      consensus: this.findConsensus(answers),
      disagreements: this.findDisagreements(answers)
    };
  }

  private findConsensus(answers: LegalAnswer[]): string | null {
    // Find common elements across answers
    const commonPoints: string[] = [];

    // Simple implementation: find sentences that appear in multiple answers
    for (const answer1 of answers) {
      const sentences1 = answer1.answer.split('. ');

      for (const sentence of sentences1) {
        const appearsIn = answers.filter(a =>
          a.answer.toLowerCase().includes(sentence.toLowerCase())
        ).length;

        if (appearsIn >= answers.length * 0.6) {
          commonPoints.push(sentence);
        }
      }
    }

    return commonPoints.length > 0 ? commonPoints.join('. ') : null;
  }

  private findDisagreements(answers: LegalAnswer[]): Disagreement[] {
    const disagreements: Disagreement[] = [];

    // Compare answers pairwise
    for (let i = 0; i < answers.length; i++) {
      for (let j = i + 1; j < answers.length; j++) {
        const diff = this.compareAnswers(answers[i], answers[j]);

        if (diff.significant) {
          disagreements.push({
            answer1Index: i,
            answer2Index: j,
            difference: diff.description,
            significance: diff.significance
          });
        }
      }
    }

    return disagreements;
  }

  private compareAnswers(a1: LegalAnswer, a2: LegalAnswer): ComparisonResult {
    // Simplified comparison
    const similarity = this.calculateSimilarity(a1.answer, a2.answer);

    return {
      significant: similarity < 0.5,
      significance: 1 - similarity,
      description: similarity < 0.5 ? 'Answers provide different legal interpretations' : 'Answers generally agree'
    };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word overlap similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

// Usage
const qa = new LegalQuestionAnswering(client);

const answer = await qa.answerQuestion(
  "What is the statute of limitations for breach of contract in Turkey?",
  { jurisdiction: 'TR' }
);

console.log(`Question: ${answer.question}\n`);
console.log(`Answer: ${answer.answer}\n`);
console.log(`Confidence: ${(answer.confidence * 100).toFixed(1)}%\n`);
console.log(`Citations:`);
for (const cite of answer.citations) {
  console.log(`  - ${cite.text}`);
}

console.log(`\nVerification: ${answer.verification.supported ? '✅ Supported' : '⚠️ Partially supported'}`);

// Get alternative perspectives
const multi = await qa.answerWithAlternatives(
  "Can a landlord evict a tenant without cause?"
);

console.log(`\nConsensus: ${multi.consensus}`);
console.log(`Disagreements: ${multi.disagreements.length}`);
```

---

## Recipes 4-10 Summary

**Recipe 4: Shepardizing/KeyCite Automation**
- Automated citation validation
- Track case history and treatment
- Alert on negative treatment

**Recipe 5: Legal Memo Generation**
- Auto-generate legal memoranda
- Structure: Issue, Rule, Analysis, Conclusion
- Include proper citations

**Recipe 6: Comparative Law Research**
- Research across multiple jurisdictions
- Identify similarities and differences
- Harmonization analysis

**Recipe 7: Legislative History Research**
- Track bill amendments and changes
- Extract legislative intent
- Analyze committee reports

**Recipe 8: Topic Clustering and Trend Analysis**
- Identify emerging legal trends
- Cluster related cases
- Visualize legal landscape

**Recipe 9: Adversarial Research**
- Generate opposing arguments
- Find counter-precedents
- Prepare for counterarguments

**Recipe 10: Research Alert System**
- Monitor new case law
- Track statutory changes
- Automated research updates

## Best Practices

1. **Always verify AI-generated answers** against primary sources
2. **Use semantic search** for better results than keyword search
3. **Check precedential value** before relying on cases
4. **Cross-reference multiple sources** for important questions
5. **Keep citation records** for all research

## Related Documentation

- [Legal Reasoning Concepts](/docs/en/concepts/lydian-iq-legal-reasoning.md)
- [Case Law Search API](/docs/en/api-reference/lydian-iq.md#caselaw)
- [Quickstart Tutorial](/docs/en/tutorials/lydian-iq-quickstart.md)

## Support

For questions about legal research:
- Email: legal-ai@lydian.com
- Documentation: https://docs.lydian.com/lydian-iq/research
- Community: https://community.lydian.com/lydian-iq
