/**
 * 🛡️ AILYDIAN — SOC++ YARA Rules API
 * 
 * YARA rules management
 * - Rule validation and testing
 * - Rule library information
 */

import { NextRequest, NextResponse } from 'next/server';
import { yaraScanner } from '@/lib/security/yara';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ruleContent, testData, testType } = body;

    switch (action) {
      case 'validate':
        return handleRuleValidation(ruleContent);
        
      case 'test':
        return handleRuleTest(ruleContent, testData, testType);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: validate, test' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('YARA rules error:', error);
    return NextResponse.json(
      { 
        error: 'Rule processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'info';

    switch (action) {
      case 'info':
        return handleRulesInfo();
        
      case 'categories':
        return handleRulesCategories();
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: info, categories' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('YARA rules GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve rule information', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle rule validation
 */
async function handleRuleValidation(ruleContent: string) {
  if (!ruleContent) {
    return NextResponse.json(
      { error: 'Rule content is required' },
      { status: 400 }
    );
  }

  try {
    // Basic syntax validation
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check basic YARA rule structure
    if (!ruleContent.includes('rule ')) {
      errors.push('Rule must contain a rule definition');
    }
    
    if (!ruleContent.includes('{') || !ruleContent.includes('}')) {
      errors.push('Rule must have proper brace structure');
    }
    
    if (!ruleContent.includes('condition:')) {
      errors.push('Rule must contain a condition section');
    }
    
    // Extract rule name
    const ruleNameMatch = ruleContent.match(/rule\s+(\w+)/);
    const ruleName = ruleNameMatch ? ruleNameMatch[1] : 'unnamed';
    
    // Generate rule hash
    const ruleHash = crypto.createHash('sha256').update(ruleContent).digest('hex');
    
    return NextResponse.json({
      success: true,
      data: {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          ruleName,
          ruleHash: ruleHash.substring(0, 16),
          ruleSize: ruleContent.length,
          hasStrings: ruleContent.includes('strings:'),
          hasMeta: ruleContent.includes('meta:')
        }
      }
    });

  } catch (error) {
    console.error('Rule validation error:', error);
    return NextResponse.json(
      { 
        error: 'Validation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle rule testing
 */
async function handleRuleTest(ruleContent: string, testData: string, testType: string) {
  if (!ruleContent || !testData || !testType) {
    return NextResponse.json(
      { error: 'Rule content, test data, and test type are required' },
      { status: 400 }
    );
  }

  try {
    const startTime = Date.now();
    
    // Basic rule validation first
    const validation = await handleRuleValidation(ruleContent);
    const validationData = await validation.json();
    
    if (!validationData.data.isValid) {
      return NextResponse.json(
        { 
          error: 'Rule is not valid', 
          details: validationData.data.errors 
        },
        { status: 400 }
      );
    }
    
    // For testing purposes, return mock results
    // In a real implementation, this would use the YARA engine
    const executionTime = Date.now() - startTime;
    
    // Simple pattern matching simulation
    const mockMatches: Array<{
      ruleName: string;
      stringIdentifier: string;
      matchedString: string;
      offset: number;
      length: number;
    }> = [];
    const ruleNameMatch = ruleContent.match(/rule\s+(\w+)/);
    const ruleName = ruleNameMatch ? ruleNameMatch[1] : 'test_rule';
    
    // Check if test data contains any simple patterns from the rule
    const stringMatches = ruleContent.match(/\$\w+\s*=\s*"([^"]+)"/g);
    if (stringMatches) {
      stringMatches.forEach((match, index) => {
        const pattern = match.match(/"([^"]+)"/)?.[1];
        if (pattern && testData.includes(pattern)) {
          mockMatches.push({
            ruleName,
            stringIdentifier: `$string_${index}`,
            matchedString: pattern,
            offset: testData.indexOf(pattern),
            length: pattern.length
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        testType,
        testDataSize: testData.length,
        matches: mockMatches,
        matchCount: mockMatches.length,
        executionTime,
        ruleValid: true,
        message: mockMatches.length > 0 
          ? `Rule matched ${mockMatches.length} pattern(s)` 
          : 'No matches found'
      }
    });

  } catch (error) {
    console.error('Rule test error:', error);
    return NextResponse.json(
      { 
        error: 'Rule test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle rules information
 */
async function handleRulesInfo() {
  return NextResponse.json({
    success: true,
    data: {
      yaraEngine: {
        version: '4.3.0',
        status: 'available',
        supportedFeatures: [
          'Rule compilation',
          'Pattern matching',
          'File scanning',
          'Memory scanning',
          'Metadata extraction'
        ]
      },
      ruleCategories: [
        'malware',
        'trojan',
        'ransomware',
        'apt',
        'packer',
        'crypto',
        'exploit',
        'webshell',
        'custom'
      ],
      supportedFileTypes: [
        'executable',
        'document',
        'archive',
        'script',
        'image',
        'binary'
      ],
      limits: {
        maxRuleSize: '1MB',
        maxFileSize: '100MB',
        maxBatchSize: 20,
        timeoutSeconds: 30
      },
      documentation: {
        yaraReference: 'https://yara.readthedocs.io/',
        ruleWriting: 'https://yara.readthedocs.io/en/stable/writingrules.html',
        examples: 'https://github.com/Yara-Rules/rules'
      }
    }
  });
}

/**
 * Handle rules categories
 */
async function handleRulesCategories() {
  const categories = {
    malware: {
      name: 'Malware Detection',
      description: 'General malware detection rules',
      examples: ['generic trojans', 'backdoors', 'viruses']
    },
    trojan: {
      name: 'Trojan Families',
      description: 'Specific trojan family detection',
      examples: ['Zeus', 'Emotet', 'TrickBot']
    },
    ransomware: {
      name: 'Ransomware',
      description: 'Ransomware detection and analysis',
      examples: ['WannaCry', 'Petya', 'Ryuk']
    },
    apt: {
      name: 'APT Groups',
      description: 'Advanced Persistent Threat detection',
      examples: ['APT1', 'Lazarus', 'FancyBear']
    },
    packer: {
      name: 'Packers & Crypters',
      description: 'Packed/encrypted malware detection',
      examples: ['UPX', 'ASPack', 'Themida']
    },
    exploit: {
      name: 'Exploits',
      description: 'Exploit code detection',
      examples: ['CVE exploits', 'shellcode', 'ROP chains']
    },
    webshell: {
      name: 'Web Shells',
      description: 'Web shell detection',
      examples: ['PHP shells', 'ASP shells', 'JSP shells']
    },
    custom: {
      name: 'Custom Rules',
      description: 'User-defined custom detection rules',
      examples: ['organization-specific', 'threat hunting', 'forensics']
    }
  };

  return NextResponse.json({
    success: true,
    data: {
      categories,
      totalCategories: Object.keys(categories).length,
      recommendedForBeginners: ['malware', 'webshell', 'custom'],
      advancedCategories: ['apt', 'exploit', 'packer']
    }
  });
}
