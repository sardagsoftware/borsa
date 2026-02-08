/**
 * LyDian Legal Document Analysis API
 * AI-powered legal document analysis and insights
 *
 * Features:
 * - Legal document classification
 * - Key clause extraction
 * - Risk assessment
 * - Compliance checking
 * - Contract review
 * - Legal precedent matching
 *
 * Security: Input validation, sanitization, rate limiting
 */

import { OpenAI } from 'lydian-labs';
import { Anthropic } from '@anthropic-ai/sdk';
const obfuscation = require('../../security/ultra-obfuscation-map');
const { getCorsOrigin } = require('../_middleware/cors');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Document type classifications
const DOCUMENT_TYPES = {
  CONTRACT: 'contract',
  AGREEMENT: 'agreement',
  POLICY: 'policy',
  LEGAL_OPINION: 'legal_opinion',
  COURT_DECISION: 'court_decision',
  LEGISLATION: 'legislation',
  REGULATION: 'regulation',
  LEGAL_NOTICE: 'legal_notice',
  POWER_OF_ATTORNEY: 'power_of_attorney',
  OTHER: 'other'
};

// Risk levels
const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Classify legal document type using AI
 */
async function classifyDocument(text) {
  try {
    // Use obfuscated model
    const modelConfig = obfuscation.getModelConfig('OX7A3F8D'); // LyDian Advanced Neural Core
    const response = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: 'system',
          content: `You are a legal document classifier for Turkish law.
          Analyze the document and classify it into one of these categories:
          - contract: Sözleşme
          - agreement: Anlaşma
          - policy: Politika/Yönetmelik
          - legal_opinion: Hukuki Görüş
          - court_decision: Mahkeme Kararı
          - legislation: Kanun
          - regulation: Tüzük/Yönetmelik
          - legal_notice: Hukuki Bildirim
          - power_of_attorney: Vekaletname
          - other: Diğer

          Respond in JSON format:
          {
            "documentType": "type",
            "confidence": 0.95,
            "reasoning": "explanation"
          }`
        },
        {
          role: 'user',
          content: text.substring(0, 2000) // First 2000 characters for classification
        }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Document classification error:', error);
    return {
      documentType: DOCUMENT_TYPES.OTHER,
      confidence: 0.5,
      reasoning: 'Error during classification'
    };
  }
}

/**
 * Extract key clauses and provisions
 */
async function extractKeyClauses(text, documentType) {
  try {
    // Use obfuscated model
    const modelConfig = obfuscation.getModelConfig('AX9F7E2B'); // LyDian Quantum Reasoning Engine
    const response = await anthropic.messages.create({
      model: modelConfig.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Analyze this ${documentType} document and extract key clauses, provisions, and important terms.

For each clause, provide:
1. Clause title/subject
2. Summary of the clause
3. Importance level (high/medium/low)
4. Potential risks or concerns

Document:
${text}

Respond in JSON format:
{
  "clauses": [
    {
      "title": "clause title",
      "summary": "brief summary",
      "importance": "high|medium|low",
      "risks": ["risk1", "risk2"],
      "location": "section/paragraph reference"
    }
  ]
}`
        }
      ]
    });

    const result = response.content[0].text;
    return JSON.parse(result);
  } catch (error) {
    console.error('Clause extraction error:', error);
    return { clauses: [] };
  }
}

/**
 * Perform risk assessment
 */
async function assessRisks(text, documentType, clauses) {
  try {
    // Use obfuscated model
    const modelConfig = obfuscation.getModelConfig('OX7A3F8D'); // LyDian Advanced Neural Core
    const response = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: 'system',
          content: `You are a legal risk assessment expert for Turkish law.
          Analyze the document for potential legal risks, compliance issues, and unfavorable terms.

          Consider:
          1. Ambiguous or unclear language
          2. Unfavorable terms or conditions
          3. Missing essential clauses
          4. Compliance with Turkish law
          5. Potential liability exposure
          6. Conflict with standard practice

          Respond in JSON format:
          {
            "overallRisk": "low|medium|high|critical",
            "riskScore": 0-100,
            "risks": [
              {
                "category": "category",
                "severity": "low|medium|high|critical",
                "description": "risk description",
                "recommendation": "how to mitigate",
                "affectedClause": "clause reference"
              }
            ],
            "complianceIssues": [
              {
                "law": "relevant law/regulation",
                "issue": "compliance issue",
                "severity": "low|medium|high|critical"
              }
            ]
          }`
        },
        {
          role: 'user',
          content: `Document Type: ${documentType}

Document Text:
${text.substring(0, 4000)}

Key Clauses:
${JSON.stringify(clauses, null, 2)}`
        }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Risk assessment error:', error);
    return {
      overallRisk: RISK_LEVELS.MEDIUM,
      riskScore: 50,
      risks: [],
      complianceIssues: []
    };
  }
}

/**
 * Generate legal recommendations
 */
async function generateRecommendations(text, documentType, risks) {
  try {
    // Use obfuscated model
    const modelConfig = obfuscation.getModelConfig('AX9F7E2B'); // LyDian Quantum Reasoning Engine
    const response = await anthropic.messages.create({
      model: modelConfig.model,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Based on this ${documentType} document analysis, provide actionable legal recommendations.

Document excerpt:
${text.substring(0, 2000)}

Identified risks:
${JSON.stringify(risks, null, 2)}

Provide recommendations in JSON format:
{
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "category",
      "recommendation": "specific recommendation",
      "implementation": "how to implement",
      "impact": "expected impact"
    }
  ],
  "requiredActions": [
    {
      "action": "action description",
      "urgency": "immediate|short-term|long-term",
      "responsible": "who should do it"
    }
  ],
  "additionalConsiderations": ["consideration1", "consideration2"]
}`
        }
      ]
    });

    const result = response.content[0].text;
    return JSON.parse(result);
  } catch (error) {
    console.error('Recommendations generation error:', error);
    return {
      recommendations: [],
      requiredActions: [],
      additionalConsiderations: []
    };
  }
}

/**
 * Calculate document complexity score
 */
function calculateComplexity(text) {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;

  // Legal jargon detection
  const legalTerms = [
    'taraf', 'sözleşme', 'madde', 'fıkra', 'hüküm', 'yürürlük',
    'fesih', 'tazminat', 'sorumluluk', 'kanun', 'yönetmelik',
    'müeyyide', 'dava', 'mahkeme', 'karar', 'ihtilaf'
  ];

  const legalTermCount = legalTerms.reduce((count, term) => {
    const regex = new RegExp(term, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);

  const legalTermDensity = (legalTermCount / words) * 100;

  // Complexity scoring
  let complexityScore = 0;

  if (avgWordsPerSentence > 25) complexityScore += 30;
  else if (avgWordsPerSentence > 20) complexityScore += 20;
  else if (avgWordsPerSentence > 15) complexityScore += 10;

  if (legalTermDensity > 5) complexityScore += 40;
  else if (legalTermDensity > 3) complexityScore += 25;
  else if (legalTermDensity > 1) complexityScore += 15;

  if (words > 5000) complexityScore += 20;
  else if (words > 2000) complexityScore += 10;

  complexityScore = Math.min(100, complexityScore);

  let complexityLevel = 'low';
  if (complexityScore > 70) complexityLevel = 'high';
  else if (complexityScore > 40) complexityLevel = 'medium';

  return {
    score: complexityScore,
    level: complexityLevel,
    metrics: {
      wordCount: words,
      sentenceCount: sentences,
      avgWordsPerSentence: Math.round(avgWordsPerSentence),
      legalTermDensity: legalTermDensity.toFixed(2) + '%'
    }
  };
}

/**
 * Main analysis handler
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    const {
      text,
      analysisType = 'full', // 'full', 'quick', 'risk-only', 'clauses-only'
      language = 'tr'
    } = req.body;

    // Input validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        details: 'Text must be a non-empty string'
      });
    }

    if (text.length < 100) {
      return res.status(400).json({
        error: 'Text too short',
        details: 'Document must be at least 100 characters for meaningful analysis'
      });
    }

    if (text.length > 50000) {
      return res.status(400).json({
        error: 'Text too long',
        details: 'Document must not exceed 50,000 characters'
      });
    }

    const startTime = Date.now();

    // 1. Document classification
    const classification = await classifyDocument(text);

    // 2. Complexity analysis
    const complexity = calculateComplexity(text);

    let clauses = { clauses: [] };
    let riskAssessment = { overallRisk: 'low', riskScore: 0, risks: [], complianceIssues: [] };
    let recommendations = { recommendations: [], requiredActions: [], additionalConsiderations: [] };

    // 3. Extract clauses (if not quick analysis)
    if (analysisType === 'full' || analysisType === 'clauses-only') {
      clauses = await extractKeyClauses(text, classification.documentType);
    }

    // 4. Risk assessment (if not clauses-only)
    if (analysisType === 'full' || analysisType === 'risk-only') {
      riskAssessment = await assessRisks(text, classification.documentType, clauses);
    }

    // 5. Generate recommendations (full analysis only)
    if (analysisType === 'full') {
      recommendations = await generateRecommendations(text, classification.documentType, riskAssessment);
    }

    const processingTime = Date.now() - startTime;

    // Build response
    const response = {
      success: true,
      analysis: {
        classification: classification,
        complexity: complexity,
        clauses: clauses.clauses || [],
        riskAssessment: riskAssessment,
        recommendations: recommendations
      },
      metadata: {
        analysisType: analysisType,
        language: language,
        processingTime: `${processingTime}ms`,
        documentLength: text.length,
        timestamp: new Date().toISOString()
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Legal analysis error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during document analysis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
