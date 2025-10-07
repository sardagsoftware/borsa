# LyDian IQ Quickstart Tutorial

## Introduction

This tutorial will guide you through getting started with LyDian IQ, our legal AI platform. You'll learn how to set up your environment, perform your first document analysis, and use core features like legal reasoning and compliance checking.

**Time to complete**: 30-45 minutes

**Prerequisites**:
- Node.js 18+ or Python 3.9+
- LyDian account with API access
- Basic knowledge of JavaScript/TypeScript or Python

## What You'll Build

By the end of this tutorial, you'll have:
- A working LyDian IQ integration
- Analyzed a legal document
- Performed compliance checking
- Extracted legal entities and obligations
- Generated legal summaries

## Step 1: Installation and Setup

### Install the SDK

**For Node.js/TypeScript:**
```bash
npm install @lydian/lydian-iq
# or
yarn add @lydian/lydian-iq
# or
pnpm add @lydian/lydian-iq
```

**For Python:**
```bash
pip install lydian-iq
```

### Get Your API Key

1. Go to [https://dashboard.lydian.com](https://dashboard.lydian.com)
2. Navigate to **Settings** → **API Keys**
3. Click **Create New API Key**
4. Copy your key and store it securely

### Initialize the Client

**TypeScript:**
```typescript
import { LyDianIQ } from '@lydian/lydian-iq';

const client = new LyDianIQ({
  apiKey: process.env.LYDIAN_API_KEY,
  // Optional: specify region
  region: 'eu-west', // or 'us-east', 'tr-central'
});

// Verify connection
async function verifySetup() {
  try {
    const status = await client.status();
    console.log('✅ Connected to LyDian IQ');
    console.log('Region:', status.region);
    console.log('Version:', status.version);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

verifySetup();
```

**Python:**
```python
from lydian_iq import LyDianIQ
import os

client = LyDianIQ(
    api_key=os.environ.get('LYDIAN_API_KEY'),
    region='eu-west'  # or 'us-east', 'tr-central'
)

# Verify connection
try:
    status = client.status()
    print('✅ Connected to LyDian IQ')
    print(f'Region: {status.region}')
    print(f'Version: {status.version}')
except Exception as e:
    print(f'❌ Connection failed: {e}')
```

## Step 2: Analyze Your First Document

Let's analyze a sample employment contract.

### Upload and Analyze

**TypeScript:**
```typescript
import * as fs from 'fs';

async function analyzeContract() {
  // Read the contract file
  const contractBuffer = fs.readFileSync('./sample-contract.pdf');

  // Upload and start analysis
  const analysis = await client.documents.analyze({
    file: contractBuffer,
    filename: 'sample-contract.pdf',
    type: 'contract',
    jurisdiction: 'TR', // Turkey
    options: {
      extractEntities: true,
      classifyClauses: true,
      identifyRisks: true,
      generateSummary: true
    }
  });

  console.log('📄 Document Analysis Complete');
  console.log('═══════════════════════════════\n');

  // Document info
  console.log('Document Type:', analysis.documentType);
  console.log('Page Count:', analysis.pageCount);
  console.log('Language:', analysis.language);
  console.log('Confidence:', (analysis.confidence * 100).toFixed(1) + '%\n');

  // Extracted parties
  console.log('Parties:');
  for (const party of analysis.entities.parties) {
    console.log(`  - ${party.name} (${party.role})`);
  }
  console.log();

  // Key dates
  console.log('Key Dates:');
  for (const date of analysis.entities.dates.slice(0, 5)) {
    console.log(`  - ${date.type}: ${date.value}`);
  }
  console.log();

  // Obligations
  console.log('Obligations Found:', analysis.entities.obligations.length);
  for (const obl of analysis.entities.obligations.slice(0, 3)) {
    console.log(`  - ${obl.obligor} must ${obl.action}`);
    if (obl.deadline) {
      console.log(`    Deadline: ${obl.deadline}`);
    }
  }
  console.log();

  // Risks identified
  if (analysis.risks && analysis.risks.length > 0) {
    console.log('⚠️  Risks Identified:');
    for (const risk of analysis.risks) {
      console.log(`  - [${risk.severity.toUpperCase()}] ${risk.description}`);
      console.log(`    Recommendation: ${risk.recommendation}\n`);
    }
  }

  // Summary
  console.log('Summary:');
  console.log(analysis.summary);

  return analysis;
}

// Run the analysis
analyzeContract().catch(console.error);
```

**Python:**
```python
def analyze_contract():
    # Read the contract file
    with open('./sample-contract.pdf', 'rb') as f:
        contract_data = f.read()

    # Upload and start analysis
    analysis = client.documents.analyze(
        file=contract_data,
        filename='sample-contract.pdf',
        type='contract',
        jurisdiction='TR',  # Turkey
        options={
            'extract_entities': True,
            'classify_clauses': True,
            'identify_risks': True,
            'generate_summary': True
        }
    )

    print('📄 Document Analysis Complete')
    print('═══════════════════════════════\n')

    # Document info
    print(f'Document Type: {analysis.document_type}')
    print(f'Page Count: {analysis.page_count}')
    print(f'Language: {analysis.language}')
    print(f'Confidence: {analysis.confidence * 100:.1f}%\n')

    # Extracted parties
    print('Parties:')
    for party in analysis.entities.parties:
        print(f'  - {party.name} ({party.role})')
    print()

    # Key dates
    print('Key Dates:')
    for date in analysis.entities.dates[:5]:
        print(f'  - {date.type}: {date.value}')
    print()

    # Obligations
    print(f'Obligations Found: {len(analysis.entities.obligations)}')
    for obl in analysis.entities.obligations[:3]:
        print(f'  - {obl.obligor} must {obl.action}')
        if obl.deadline:
            print(f'    Deadline: {obl.deadline}')
    print()

    # Risks identified
    if analysis.risks:
        print('⚠️  Risks Identified:')
        for risk in analysis.risks:
            print(f'  - [{risk.severity.upper()}] {risk.description}')
            print(f'    Recommendation: {risk.recommendation}\n')

    # Summary
    print('Summary:')
    print(analysis.summary)

    return analysis

# Run the analysis
try:
    result = analyze_contract()
except Exception as e:
    print(f'Error: {e}')
```

### Expected Output

```
📄 Document Analysis Complete
═══════════════════════════════

Document Type: employment_contract
Page Count: 12
Language: tr
Confidence: 94.3%

Parties:
  - ABC Teknoloji A.Ş. (employer)
  - Ahmet Yılmaz (employee)

Key Dates:
  - effective_date: 2024-01-15
  - termination_notice: 30 days
  - probation_end: 2024-04-15

Obligations Found: 18
  - Employee must maintain confidentiality
    Deadline: contract_duration
  - Employer must provide health insurance
    Deadline: 2024-02-01
  - Employee must give 30 days notice
    Deadline: before_termination

⚠️  Risks Identified:
  - [MEDIUM] Non-compete clause duration exceeds typical 6-month period
    Recommendation: Review non-compete duration with legal counsel

Summary:
This is a standard Turkish employment contract between ABC Teknoloji A.Ş.
and Ahmet Yılmaz for a Software Engineer position. The contract includes
standard provisions for compensation (25,000 TL monthly), working hours
(40 hours/week), benefits, and termination conditions. Notable clauses
include a 3-month probation period, confidentiality obligations, and a
12-month non-compete restriction.
```

## Step 3: Search Legal Precedents

Now let's search for relevant case law.

**TypeScript:**
```typescript
async function searchCaseLaw() {
  const results = await client.caselaw.search({
    query: 'employment contract termination without cause',
    jurisdiction: 'TR',
    courts: ['yargitay'], // Turkish Supreme Court
    dateRange: {
      start: new Date('2020-01-01'),
      end: new Date()
    },
    limit: 5
  });

  console.log('📚 Case Law Search Results');
  console.log('═══════════════════════════════\n');

  for (const case_ of results.cases) {
    console.log(`${case_.citation}`);
    console.log(`Court: ${case_.court}`);
    console.log(`Date: ${case_.date}`);
    console.log(`Relevance: ${(case_.relevanceScore * 100).toFixed(1)}%`);
    console.log(`Summary: ${case_.summary.substring(0, 200)}...`);
    console.log();
  }

  return results;
}

searchCaseLaw().catch(console.error);
```

**Python:**
```python
def search_case_law():
    from datetime import datetime

    results = client.caselaw.search(
        query='employment contract termination without cause',
        jurisdiction='TR',
        courts=['yargitay'],  # Turkish Supreme Court
        date_range={
            'start': datetime(2020, 1, 1),
            'end': datetime.now()
        },
        limit=5
    )

    print('📚 Case Law Search Results')
    print('═══════════════════════════════\n')

    for case in results.cases:
        print(f'{case.citation}')
        print(f'Court: {case.court}')
        print(f'Date: {case.date}')
        print(f'Relevance: {case.relevance_score * 100:.1f}%')
        print(f'Summary: {case.summary[:200]}...')
        print()

    return results

try:
    results = search_case_law()
except Exception as e:
    print(f'Error: {e}')
```

## Step 4: Compliance Checking

Let's check GDPR compliance of a privacy policy.

**TypeScript:**
```typescript
async function checkGDPRCompliance() {
  // Assume we have a privacy policy document
  const policyBuffer = fs.readFileSync('./privacy-policy.pdf');

  const complianceCheck = await client.compliance.check({
    document: policyBuffer,
    framework: 'GDPR',
    jurisdiction: 'EU',
    options: {
      detailedAnalysis: true,
      generateReport: true,
      suggestRemediation: true
    }
  });

  console.log('🔒 GDPR Compliance Check');
  console.log('═══════════════════════════════\n');

  console.log(`Overall Status: ${complianceCheck.status.toUpperCase()}`);
  console.log(`Compliance Score: ${(complianceCheck.score * 100).toFixed(1)}%`);
  console.log(`Requirements Checked: ${complianceCheck.results.length}\n`);

  // Show compliant requirements
  const compliant = complianceCheck.results.filter(r => r.status === 'compliant');
  console.log(`✅ Compliant: ${compliant.length}`);

  // Show gaps
  const gaps = complianceCheck.results.filter(r => r.status !== 'compliant');
  if (gaps.length > 0) {
    console.log(`\n⚠️  Gaps Found: ${gaps.length}\n`);

    for (const gap of gaps) {
      console.log(`${gap.requirement.reference}: ${gap.requirement.title}`);
      console.log(`Status: ${gap.status}`);
      console.log(`Issue: ${gap.finding}`);

      if (gap.remediation) {
        console.log(`Remediation: ${gap.remediation.description}`);
        console.log(`Effort: ${gap.remediation.estimatedEffort}`);
        console.log(`Priority: ${gap.remediation.priority}`);
      }
      console.log();
    }
  }

  // Export report
  const reportPath = './compliance-report.pdf';
  await fs.promises.writeFile(reportPath, complianceCheck.report);
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return complianceCheck;
}

checkGDPRCompliance().catch(console.error);
```

**Python:**
```python
def check_gdpr_compliance():
    # Read privacy policy
    with open('./privacy-policy.pdf', 'rb') as f:
        policy_data = f.read()

    compliance_check = client.compliance.check(
        document=policy_data,
        framework='GDPR',
        jurisdiction='EU',
        options={
            'detailed_analysis': True,
            'generate_report': True,
            'suggest_remediation': True
        }
    )

    print('🔒 GDPR Compliance Check')
    print('═══════════════════════════════\n')

    print(f'Overall Status: {compliance_check.status.upper()}')
    print(f'Compliance Score: {compliance_check.score * 100:.1f}%')
    print(f'Requirements Checked: {len(compliance_check.results)}\n')

    # Show compliant requirements
    compliant = [r for r in compliance_check.results if r.status == 'compliant']
    print(f'✅ Compliant: {len(compliant)}')

    # Show gaps
    gaps = [r for r in compliance_check.results if r.status != 'compliant']
    if gaps:
        print(f'\n⚠️  Gaps Found: {len(gaps)}\n')

        for gap in gaps:
            print(f'{gap.requirement.reference}: {gap.requirement.title}')
            print(f'Status: {gap.status}')
            print(f'Issue: {gap.finding}')

            if gap.remediation:
                print(f'Remediation: {gap.remediation.description}')
                print(f'Effort: {gap.remediation.estimated_effort}')
                print(f'Priority: {gap.remediation.priority}')
            print()

    # Export report
    with open('./compliance-report.pdf', 'wb') as f:
        f.write(compliance_check.report)
    print('\n📄 Detailed report saved to: ./compliance-report.pdf')

    return compliance_check

try:
    result = check_gdpr_compliance()
except Exception as e:
    print(f'Error: {e}')
```

## Step 5: Legal Question Answering

Ask legal questions using the reasoning engine.

**TypeScript:**
```typescript
async function askLegalQuestion() {
  const question = `
    In Turkey, can an employer terminate an employment contract
    without cause during the probation period?
  `;

  const answer = await client.reasoning.answer({
    question,
    jurisdiction: 'TR',
    context: {
      documentType: 'employment_contract',
      relevantLaws: ['Turkish Labor Law No. 4857']
    },
    options: {
      includeCitations: true,
      includeAnalysis: true,
      confidence: 'high' // only return if confident
    }
  });

  console.log('⚖️  Legal Question & Answer');
  console.log('═══════════════════════════════\n');

  console.log('Question:');
  console.log(question.trim());
  console.log();

  console.log('Answer:');
  console.log(answer.answer);
  console.log();

  console.log(`Confidence: ${(answer.confidence * 100).toFixed(1)}%\n`);

  if (answer.citations && answer.citations.length > 0) {
    console.log('Legal Basis:');
    for (const citation of answer.citations) {
      console.log(`  - ${citation.reference}: ${citation.text}`);
    }
    console.log();
  }

  if (answer.analysis) {
    console.log('Analysis:');
    console.log(answer.analysis);
  }

  return answer;
}

askLegalQuestion().catch(console.error);
```

**Expected Output:**
```
⚖️  Legal Question & Answer
═══════════════════════════════

Question:
In Turkey, can an employer terminate an employment contract
without cause during the probation period?

Answer:
Yes, under Turkish Labor Law, employers can terminate employment contracts
without cause during the probation period without providing justification or
paying severance. However, the employer must still provide written notice,
and the probation period cannot exceed 2 months for regular employees or
4 months for positions requiring technical expertise (Article 15).

Confidence: 92.3%

Legal Basis:
  - Turkish Labor Law No. 4857, Article 15: Probation periods and termination
  - Turkish Labor Law No. 4857, Article 17: Termination notice requirements
  - Yargıtay 9. HD, 2019/5432: Probation period termination case

Analysis:
This is a well-established principle in Turkish employment law. The probation
period serves to allow both parties to evaluate the employment relationship.
During this time, either party may terminate without cause, though basic
notice requirements still apply. The employee retains rights to unpaid wages
and unused vacation time.
```

## Step 6: Batch Processing

Process multiple documents efficiently.

**TypeScript:**
```typescript
async function batchProcessContracts() {
  const contractFiles = [
    './contracts/contract-1.pdf',
    './contracts/contract-2.pdf',
    './contracts/contract-3.pdf',
    './contracts/contract-4.pdf',
    './contracts/contract-5.pdf'
  ];

  // Start batch processing
  const batch = await client.documents.analyzeBatch({
    files: contractFiles.map(path => ({
      file: fs.readFileSync(path),
      filename: path.split('/').pop()!,
      type: 'contract'
    })),
    options: {
      jurisdiction: 'TR',
      extractEntities: true,
      identifyRisks: true,
      parallel: true // Process in parallel
    }
  });

  console.log('📦 Batch Processing');
  console.log('═══════════════════════════════\n');
  console.log(`Batch ID: ${batch.id}`);
  console.log(`Total Documents: ${batch.total}`);
  console.log(`Status: ${batch.status}\n`);

  // Poll for completion
  let result = batch;
  while (result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    result = await client.documents.getBatchStatus(batch.id);

    console.log(`Progress: ${result.completed}/${result.total} (${Math.round(result.completed / result.total * 100)}%)`);
  }

  console.log('\n✅ Batch Complete!\n');

  // Get results
  const analyses = await client.documents.getBatchResults(batch.id);

  // Aggregate statistics
  const stats = {
    totalPages: 0,
    totalObligations: 0,
    highRisks: 0,
    mediumRisks: 0,
    lowRisks: 0
  };

  for (const analysis of analyses) {
    stats.totalPages += analysis.pageCount;
    stats.totalObligations += analysis.entities.obligations.length;

    for (const risk of analysis.risks || []) {
      if (risk.severity === 'high') stats.highRisks++;
      else if (risk.severity === 'medium') stats.mediumRisks++;
      else stats.lowRisks++;
    }
  }

  console.log('Summary Statistics:');
  console.log(`  Total Pages Analyzed: ${stats.totalPages}`);
  console.log(`  Total Obligations Found: ${stats.totalObligations}`);
  console.log(`  High Risks: ${stats.highRisks}`);
  console.log(`  Medium Risks: ${stats.mediumRisks}`);
  console.log(`  Low Risks: ${stats.lowRisks}`);

  return analyses;
}

batchProcessContracts().catch(console.error);
```

## Next Steps

Congratulations! You've completed the LyDian IQ quickstart tutorial. Here's what to explore next:

### Advanced Topics

1. **Document Comparison** - Compare contract versions and track changes
   - See: [Document Comparison Tutorial](/docs/en/tutorials/lydian-iq-document-comparison.md)

2. **Custom Compliance Frameworks** - Define your own compliance requirements
   - See: [Custom Compliance Guide](/docs/en/guides/lydian-iq-custom-compliance.md)

3. **Knowledge Graph Integration** - Build legal knowledge graphs
   - See: [Knowledge Graph Cookbook](/docs/en/cookbooks/lydian-iq-knowledge-graphs.md)

4. **Multi-Jurisdiction Analysis** - Handle cross-border legal issues
   - See: [Multi-Jurisdiction Guide](/docs/en/guides/lydian-iq-multi-jurisdiction.md)

### Production Considerations

- **Rate Limits**: Free tier allows 100 requests/hour. See [pricing page](https://lydian.com/pricing) for higher limits.
- **Caching**: Cache frequently accessed documents and search results.
- **Error Handling**: Implement retry logic with exponential backoff.
- **Monitoring**: Use webhooks to track long-running analyses.

### Resources

- [API Reference](/docs/en/api-reference/lydian-iq.md)
- [LyDian IQ Cookbook](/docs/en/cookbooks/lydian-iq-recipes.md)
- [Community Forum](https://community.lydian.com/lydian-iq)
- [Support](mailto:legal-ai@lydian.com)

## Troubleshooting

### Common Issues

**Issue**: `Authentication failed`
- **Solution**: Verify your API key is correct and hasn't expired. Check that you're setting the environment variable correctly.

**Issue**: `Document analysis taking too long`
- **Solution**: Large documents (>50 pages) can take 30-60 seconds. Use batch processing or webhooks for better experience.

**Issue**: `Unsupported jurisdiction`
- **Solution**: Check [supported jurisdictions](https://docs.lydian.com/lydian-iq/jurisdictions). Contact support for additional jurisdiction requests.

**Issue**: `Compliance framework not found`
- **Solution**: Verify framework name. Use `client.compliance.listFrameworks()` to see available options.

## Feedback

We'd love to hear from you! Share your experience:
- Email: legal-ai@lydian.com
- Community: https://community.lydian.com/lydian-iq
- GitHub: https://github.com/lydian-ai/lydian-iq-sdk

---

**Tutorial Version**: 1.0.0
**Last Updated**: 2025-01-05
**LyDian IQ Version**: 2.1.0+
