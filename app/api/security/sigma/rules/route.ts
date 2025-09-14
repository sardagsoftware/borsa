/**
 * 🛡️ AILYDIAN — SOC++ Sigma Rules API
 * 
 * Sigma detection rules management endpoint
 * - Upload and parse Sigma YAML rules
 * - Rule validation and testing
 * - Rule repository management
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SigmaRuleParser, SigmaRuleEngine } from '@/lib/security/sigma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ruleId = searchParams.get('id');
    const level = searchParams.get('level');
    const tag = searchParams.get('tag');
    const enabled = searchParams.get('enabled');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (ruleId) {
      // Get specific rule
      const rule = await prisma.sigmaRule.findUnique({
        where: { id: ruleId },
        include: {
          matches: {
            take: 10,
            orderBy: { timestamp: 'desc' }
          }
        }
      });

      if (!rule) {
        return NextResponse.json(
          { error: 'Rule not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          rule: {
            ...rule,
            parseData: typeof rule.parseData === 'string' ? JSON.parse(rule.parseData as string) : rule.parseData,
            tags: Array.isArray(rule.tags) ? rule.tags : []
          },
          recentMatches: rule.matches
        }
      });
    }

    // List rules with filters
    const where: Record<string, unknown> = {};
    
    if (level) {
      where.level = level;
    }
    
    if (enabled !== null) {
      where.enabled = enabled === 'true';
    }
    
    if (tag) {
      where.tags = {
        has: tag
      };
    }

    const rules = await prisma.sigmaRule.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        level: true,
        tags: true,
        source: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { matches: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        rules: rules.map(rule => ({
          ...rule,
          tags: Array.isArray(rule.tags) ? rule.tags : [],
          matchCount: rule._count.matches
        })),
        pagination: {
          limit,
          offset,
          total: rules.length
        }
      }
    });

  } catch (error) {
    console.error('Sigma rules GET error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve rules', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ruleContent, ruleData, options } = body;

    switch (action) {
      case 'parse':
        return handleParseRule(ruleContent, options);
        
      case 'validate':
        return handleValidateRule(ruleContent, options);
        
      case 'create':
        return handleCreateRule(ruleData, options);
        
      case 'import':
        return handleImportRules(body.rules, options);
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: parse, validate, create, import' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sigma rules POST error:', error);
    return NextResponse.json(
      { 
        error: 'Request failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ruleId, updates } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // Check if rule exists
    const existingRule = await prisma.sigmaRule.findUnique({
      where: { id: ruleId }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Update rule
    const updateData: Record<string, unknown> = {};
    
    if (updates.enabled !== undefined) {
      updateData.enabled = updates.enabled;
    }
    
    if (updates.ruleContent) {
      // Re-parse rule content
      const parser = new SigmaRuleParser();
      const parseResult = parser.parseRuleWithValidation(updates.ruleContent);
      
      if (!parseResult.isValid) {
        return NextResponse.json(
          { 
            error: 'Invalid rule content', 
            details: parseResult.errors 
          },
          { status: 400 }
        );
      }

      updateData.ruleContent = updates.ruleContent;
      updateData.parseData = JSON.stringify(parseResult.rule);
      updateData.title = parseResult.rule?.title || 'Untitled Rule';
      updateData.level = parseResult.rule?.level || 'medium';
      updateData.tags = parseResult.rule?.tags || [];
    }

    const updatedRule = await prisma.sigmaRule.update({
      where: { id: ruleId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: {
        rule: {
          ...updatedRule,
          parseData: typeof updatedRule.parseData === 'string' ? JSON.parse(updatedRule.parseData as string) : updatedRule.parseData,
          tags: Array.isArray(updatedRule.tags) ? updatedRule.tags : []
        }
      }
    });

  } catch (error) {
    console.error('Sigma rules PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Update failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ruleId = searchParams.get('id');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // Check if rule exists
    const existingRule = await prisma.sigmaRule.findUnique({
      where: { id: ruleId }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Delete rule and associated matches
    await prisma.sigmaRule.delete({
      where: { id: ruleId }
    });

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully'
    });

  } catch (error) {
    console.error('Sigma rules DELETE error:', error);
    return NextResponse.json(
      { 
        error: 'Delete failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Handle rule parsing
 */
async function handleParseRule(ruleContent: string, options: Record<string, unknown> = {}) {
  if (!ruleContent) {
    return NextResponse.json(
      { error: 'Rule content is required' },
      { status: 400 }
    );
  }

  const parser = new SigmaRuleParser();
  const parseResult = parser.parseRuleWithValidation(ruleContent);

  return NextResponse.json({
    success: true,
    data: {
      parseResult,
      metadata: {
        parsedAt: new Date().toISOString(),
        isValid: parseResult.isValid,
        ruleTitle: parseResult.rule?.title,
        ruleLevel: parseResult.rule?.level
      }
    }
  });
}

/**
 * Handle rule validation
 */
async function handleValidateRule(ruleContent: string, options: Record<string, unknown> = {}) {
  if (!ruleContent) {
    return NextResponse.json(
      { error: 'Rule content is required' },
      { status: 400 }
    );
  }

  const parser = new SigmaRuleParser();
  const parseResult = parser.parseRuleWithValidation(ruleContent);

  if (!parseResult.isValid) {
    return NextResponse.json({
      success: false,
      data: {
        valid: false,
        errors: parseResult.errors,
        warnings: parseResult.warnings || []
      }
    });
  }

  // Additional validation checks
  const warnings: string[] = [];
  
  if (!parseResult.rule?.logsource) {
    warnings.push('Log source not specified');
  }
  
  if (!parseResult.rule?.detection) {
    warnings.push('Detection logic is empty');
  }
  
  if (parseResult.rule?.tags && parseResult.rule.tags.length === 0) {
    warnings.push('No tags specified');
  }

  return NextResponse.json({
    success: true,
    data: {
      valid: true,
      errors: [],
      warnings,
      suggestions: generateRuleSuggestions(parseResult.rule)
    }
  });
}

/**
 * Handle rule creation
 */
async function handleCreateRule(ruleData: any, options: any = {}) {
  if (!ruleData || !ruleData.ruleContent) {
    return NextResponse.json(
      { error: 'Rule content is required' },
      { status: 400 }
    );
  }

  // Parse rule first
  const parser = new SigmaRuleParser();
  const parseResult = parser.parseRule(ruleData.ruleContent);

  if (!parseResult.isValid) {
    return NextResponse.json(
      { 
        error: 'Invalid rule content', 
        details: parseResult.errors 
      },
      { status: 400 }
    );
  }

  // Create rule in database
  const rule = await prisma.sigmaRule.create({
    data: {
      title: parseResult.rule?.title || 'Untitled Rule',
      level: parseResult.rule?.level || 'medium',
      tags: parseResult.rule?.tags || [],
      source: ruleData.source || 'manual',
      ruleContent: ruleData.ruleContent,
      parseData: JSON.stringify(parseResult.rule),
      enabled: ruleData.enabled !== false
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      rule: {
        ...rule,
        parseData: typeof rule.parseData === 'string' ? JSON.parse(rule.parseData as string) : rule.parseData,
        tags: Array.isArray(rule.tags) ? rule.tags : []
      }
    }
  });
}

/**
 * Handle bulk rule import
 */
async function handleImportRules(rules: any[], options: any = {}) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return NextResponse.json(
      { error: 'Rules array is required' },
      { status: 400 }
    );
  }

  const parser = new SigmaRuleParser();
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as any[]
  };

  // Process rules in batch
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    
    try {
      if (!rule.ruleContent) {
        throw new Error('Rule content is required');
      }

      const parseResult = parser.parseRule(rule.ruleContent);
      
      if (!parseResult.isValid) {
        throw new Error(`Parse errors: ${parseResult.errors.join(', ')}`);
      }

      // Create rule
      await prisma.sigmaRule.create({
        data: {
          title: parseResult.rule?.title || `Imported Rule ${i + 1}`,
          level: parseResult.rule?.level || 'medium',
          tags: parseResult.rule?.tags || [],
          source: rule.source || 'import',
          ruleContent: rule.ruleContent,
          parseData: JSON.stringify(parseResult.rule),
          enabled: rule.enabled !== false
        }
      });

      results.successful++;

    } catch (error) {
      results.failed++;
      results.errors.push({
        index: i,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    success: results.successful > 0,
    data: results
  });
}

/**
 * Generate rule improvement suggestions
 */
function generateRuleSuggestions(rule: any): string[] {
  const suggestions: string[] = [];
  
  if (!rule) return suggestions;

  // Check for common improvements
  if (!rule.description) {
    suggestions.push('Add a description to explain what this rule detects');
  }
  
  if (!rule.references || rule.references.length === 0) {
    suggestions.push('Add references to threat reports or documentation');
  }
  
  if (!rule.author) {
    suggestions.push('Specify the rule author for better attribution');
  }
  
  if (rule.level === 'informational') {
    suggestions.push('Consider if this rule should have a higher severity level');
  }
  
  if (!rule.logsource?.service) {
    suggestions.push('Specify the log source service for better targeting');
  }

  return suggestions;
}
