/**
 * 🛡️ AILYDIAN SOC++ - Sigma Rules Engine
 * Parse Sigma detection rules, generate predicates, evaluate against SOC events
 * Coverage analysis and false positive detection
 * © Emrah Şardağ. All rights reserved.
 */

import * as yaml from 'js-yaml';
import { SocEvent } from './soc/schema';

// Parse result for validation and error handling
export interface SigmaParseResult {
  isValid: boolean;
  rule?: SigmaRule;
  errors: string[];
  warnings?: string[];
}

export interface SigmaRule {
  id: string;
  title: string;
  description?: string;
  status?: 'stable' | 'test' | 'experimental' | 'deprecated';
  level: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  references?: string[];
  author?: string;
  date?: string;
  modified?: string;
  logsource: any;
  detection: any;
  falsepositives: string[];
  filePath?: string;
  fields?: string[];
  related?: Array<{
    id: string;
    type: string;
  }>;
}

export interface SigmaMatch {
  id: string;
  ruleId: string;
  ruleName: string;
  eventId?: string;
  timestamp: Date;
  source: string;
  fields: Record<string, any>;
  riskScore: number;
  confidence: number;
  context: {
    matchedCondition: string;
    matchedFields: string[];
    eventData: any;
  };
}

export interface SigmaEvaluationResult {
  matches: SigmaMatch[];
  stats: {
    totalRules: number;
    executedRules: number;
    matchCount: number;
    falsePositiveHints: number;
    executionTimeMs: number;
  };
  coverage: {
    tacticsCovered: string[];
    techniquesCovered: string[];
    coveragePercentage: number;
  };
}

export interface SigmaPredicate {
  field: string;
  operator: 'equals' | 'contains' | 'startswith' | 'endswith' | 'regex' | 'gt' | 'lt' | 'in' | 'exists';
  value: any;
  negate?: boolean;
}

export interface SigmaCondition {
  type: 'and' | 'or' | 'not' | 'count' | '1_of_them' | 'all_of_them';
  predicates: SigmaPredicate[];
  subConditions?: SigmaCondition[];
  threshold?: number;
  timeframe?: string;
}

/**
 * Sigma Rule Parser - Parse YAML rules into structured format
 */
export class SigmaRuleParser {
  /**
   * Parse Sigma rule from YAML content with validation
   */
  parseRuleWithValidation(yamlContent: string, filePath?: string): SigmaParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const doc = yaml.load(yamlContent) as any;
      
      if (!doc || typeof doc !== 'object') {
        return {
          isValid: false,
          errors: ['Invalid YAML structure'],
          warnings
        };
      }

      // Validate required fields
      if (!doc.title) errors.push('Missing required field: title');
      if (!doc.detection) errors.push('Missing required field: detection');

      if (errors.length > 0) {
        return {
          isValid: false,
          errors,
          warnings
        };
      }

      // Generate ID if not present
      const id = doc.id || this.generateRuleId(doc.title, filePath);

      const rule: SigmaRule = {
        id,
        title: doc.title,
        description: doc.description,
        status: doc.status || 'test',
        level: doc.level || 'medium',
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        references: Array.isArray(doc.references) ? doc.references : [],
        author: doc.author,
        date: doc.date,
        modified: doc.modified,
        logsource: doc.logsource || {},
        detection: doc.detection || {},
        falsepositives: Array.isArray(doc.falsepositives) ? doc.falsepositives : [],
        filePath
      };

      // Add warnings for optional but recommended fields
      if (!rule.description) warnings.push('Description field is recommended');
      if (!rule.author) warnings.push('Author field is recommended');
      if (!rule.references || rule.references.length === 0) warnings.push('References are recommended');

      return {
        isValid: true,
        rule,
        errors: [],
        warnings
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Parse Sigma rule from YAML content
   */
  parseRule(yamlContent: string, filePath?: string): SigmaRule {
    try {
      const doc = yaml.load(yamlContent) as any;
      
      if (!doc || typeof doc !== 'object') {
        throw new Error('Invalid YAML structure');
      }

      // Validate required fields
      if (!doc.title || !doc.detection) {
        throw new Error('Missing required fields: title, detection');
      }

      // Generate ID if not present
      const id = doc.id || this.generateRuleId(doc.title, filePath);

      const rule: SigmaRule = {
        id,
        title: doc.title,
        description: doc.description,
        status: doc.status || 'test',
        level: doc.level || 'medium',
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        references: Array.isArray(doc.references) ? doc.references : [],
        author: doc.author,
        date: doc.date,
        modified: doc.modified,
        logsource: {
          category: doc.logsource?.category,
          product: doc.logsource?.product,
          service: doc.logsource?.service,
        },
        detection: doc.detection,
        falsepositives: Array.isArray(doc.falsepositives) ? doc.falsepositives : [],
        fields: Array.isArray(doc.fields) ? doc.fields : [],
        related: Array.isArray(doc.related) ? doc.related : [],
      };

      this.validateRule(rule);
      return rule;

    } catch (error) {
      throw new Error(`Failed to parse Sigma rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse multiple rules from directory structure
   */
  async parseRulesFromDirectory(rulesPath: string): Promise<SigmaRule[]> {
    // This would typically use fs to read files
    // For now, return empty array as placeholder
    console.log(`Parsing rules from ${rulesPath}`);
    return [];
  }

  /**
   * Generate rule ID from title and path
   */
  private generateRuleId(title: string, filePath?: string): string {
    const hash = this.simpleHash(title + (filePath || ''));
    return `sigma_${hash}`;
  }

  /**
   * Simple hash function for ID generation
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Validate rule structure
   */
  private validateRule(rule: SigmaRule): void {
    if (!rule.title || rule.title.trim() === '') {
      throw new Error('Rule title cannot be empty');
    }

    if (!rule.detection || !rule.detection.condition) {
      throw new Error('Rule must have detection condition');
    }

    if (!['low', 'medium', 'high', 'critical'].includes(rule.level)) {
      throw new Error('Invalid rule level');
    }
  }
}

/**
 * Sigma Rule Compiler - Convert Sigma rules to predicates
 */
export class SigmaRuleCompiler {
  /**
   * Compile Sigma rule to executable predicates
   */
  compileRule(rule: SigmaRule): SigmaCondition {
    const detection = rule.detection;
    const condition = detection.condition;

    // Parse the condition string
    return this.parseCondition(condition, detection);
  }

  /**
   * Parse condition string into structured condition
   */
  private parseCondition(conditionStr: string, detection: any): SigmaCondition {
    // Simple condition parsing - would need more sophisticated parser for complex conditions
    const condition = conditionStr.trim();

    // Handle basic conditions
    if (condition.includes(' and ')) {
      return {
        type: 'and',
        predicates: [],
        subConditions: condition.split(' and ').map(c => this.parseCondition(c.trim(), detection)),
      };
    }

    if (condition.includes(' or ')) {
      return {
        type: 'or',
        predicates: [],
        subConditions: condition.split(' or ').map(c => this.parseCondition(c.trim(), detection)),
      };
    }

    // Handle selection references (e.g., "selection")
    if (detection[condition]) {
      const selectionData = detection[condition];
      return {
        type: 'and',
        predicates: this.buildPredicatesFromSelection(selectionData),
      };
    }

    // Handle "1 of them", "all of them", etc.
    if (condition.includes('of them')) {
      return this.parseOfThemCondition(condition, detection);
    }

    // Default fallback
    return {
      type: 'and',
      predicates: [],
    };
  }

  /**
   * Build predicates from selection data
   */
  private buildPredicatesFromSelection(selectionData: any): SigmaPredicate[] {
    const predicates: SigmaPredicate[] = [];

    if (typeof selectionData === 'object' && selectionData !== null) {
      for (const [field, value] of Object.entries(selectionData)) {
        if (Array.isArray(value)) {
          predicates.push({
            field,
            operator: 'in',
            value,
          });
        } else if (typeof value === 'string') {
          // Determine operator based on value pattern
          if (value.includes('*')) {
            predicates.push({
              field,
              operator: 'contains',
              value: value.replace(/\*/g, ''),
            });
          } else {
            predicates.push({
              field,
              operator: 'equals',
              value,
            });
          }
        } else {
          predicates.push({
            field,
            operator: 'equals',
            value,
          });
        }
      }
    }

    return predicates;
  }

  /**
   * Parse "X of them" conditions
   */
  private parseOfThemCondition(condition: string, detection: any): SigmaCondition {
    const match = condition.match(/^(\d+|all)\s+of\s+them/);
    if (!match) {
      return { type: 'or', predicates: [] };
    }

    const threshold = match[1] === 'all' ? -1 : parseInt(match[1]);
    const selections = Object.keys(detection).filter(key => 
      key !== 'condition' && key !== 'timeframe'
    );

    const subConditions = selections.map(selectionName => ({
      type: 'and' as const,
      predicates: this.buildPredicatesFromSelection(detection[selectionName]),
    }));

    return {
      type: threshold === -1 ? 'and' : 'or',
      predicates: [],
      subConditions,
      threshold: threshold === -1 ? subConditions.length : threshold,
    };
  }
}

/**
 * Sigma Rule Engine - Evaluate rules against events
 */
export class SigmaRuleEngine {
  private parser = new SigmaRuleParser();
  private compiler = new SigmaRuleCompiler();
  private rules: Map<string, { rule: SigmaRule; condition: SigmaCondition }> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default SOC++ rules
   */
  private initializeDefaultRules(): void {
    const defaultRules = [
      // Suspicious Trading Pattern
      `
title: Suspicious High Frequency Trading
id: sigma_001
description: Detects unusually high frequency trading that may indicate automated attack
author: AILYDIAN SOC++ Team
date: 2024/01/01
status: stable
level: high
logsource:
  product: trading
  service: orders
detection:
  selection:
    event_type: 'trade_execution'
    orders_per_minute: '>100'
  condition: selection
fields:
  - user_id
  - symbol
  - order_count
  - time_window
falsepositives:
  - Legitimate algorithmic trading
  - Market making activities
tags:
  - attack.impact
  - attack.t1565.001
references:
  - https://attack.mitre.org/techniques/T1565/001/
      `,

      // Large Volume Withdrawal
      `
title: Large Volume Withdrawal
id: sigma_002
description: Detects large cryptocurrency withdrawals that may indicate fund theft
author: AILYDIAN SOC++ Team
date: 2024/01/01
status: stable
level: critical
logsource:
  product: wallet
  service: transactions
detection:
  selection:
    event_type: 'withdrawal'
    amount_usd: '>10000'
  condition: selection
fields:
  - user_id
  - amount
  - destination_address
  - timestamp
falsepositives:
  - Legitimate large withdrawals by whale traders
  - Business withdrawals
tags:
  - attack.exfiltration
  - attack.t1041
references:
  - https://attack.mitre.org/techniques/T1041/
      `,

      // Brute Force Attack
      `
title: Multiple Failed Login Attempts
id: sigma_003
description: Detects brute force attacks against user accounts
author: AILYDIAN SOC++ Team
date: 2024/01/01
status: stable
level: medium
logsource:
  product: auth
  service: login
detection:
  selection:
    event_type: 'login_failed'
  timeframe: 5m
  condition: selection | count() > 5
fields:
  - user_id
  - ip_address
  - user_agent
  - failure_count
falsepositives:
  - Users forgetting passwords
  - Mobile app authentication issues
tags:
  - attack.credential_access
  - attack.t1110
references:
  - https://attack.mitre.org/techniques/T1110/
      `
    ];

    defaultRules.forEach(rule => {
      try {
        this.loadRule(rule);
      } catch (error) {
        console.warn(`Failed to load default rule: ${error}`);
      }
    });
  }

  /**
   * Load rules from YAML content
   */
  loadRule(yamlContent: string, filePath?: string): string {
    const rule = this.parser.parseRule(yamlContent, filePath);
    const condition = this.compiler.compileRule(rule);
    
    this.rules.set(rule.id, { rule, condition });
    return rule.id;
  }

  /**
   * Load multiple rules
   */
  loadRules(rulesData: Array<{ content: string; path?: string }>): string[] {
    return rulesData.map(({ content, path }) => this.loadRule(content, path));
  }

  /**
   * Evaluate rules against SOC events
   */
  async evaluateEvents(
    events: SocEvent[],
    ruleIds?: string[],
    timeWindowMinutes = 60
  ): Promise<SigmaEvaluationResult> {
    const startTime = Date.now();
    const matches: SigmaMatch[] = [];
    const stats = {
      totalRules: this.rules.size,
      executedRules: 0,
      matchCount: 0,
      falsePositiveHints: 0,
      executionTimeMs: 0,
    };

    // Filter rules to evaluate
    const rulesToEvaluate = ruleIds 
      ? Array.from(this.rules.entries()).filter(([id]) => ruleIds.includes(id))
      : Array.from(this.rules.entries());

    // Filter events by time window
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentEvents = events.filter(event => event.timestamp >= cutoffTime);

    // Evaluate each rule against events
    for (const [ruleId, { rule, condition }] of rulesToEvaluate) {
      stats.executedRules++;

      for (const event of recentEvents) {
        if (this.evaluateCondition(condition, event)) {
          const match: SigmaMatch = {
            id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId,
            ruleName: rule.title,
            eventId: event.id,
            timestamp: new Date(),
            source: event.source,
            fields: this.extractMatchedFields(condition, event),
            riskScore: this.calculateRiskScore(rule, event),
            confidence: this.calculateConfidence(rule, event),
            context: {
              matchedCondition: JSON.stringify(condition),
              matchedFields: this.getMatchedFieldNames(condition),
              eventData: event,
            },
          };

          matches.push(match);
          stats.matchCount++;
        }
      }

      // Check for false positive hints
      if (rule.falsepositives && rule.falsepositives.length > 0) {
        stats.falsePositiveHints++;
      }
    }

    stats.executionTimeMs = Date.now() - startTime;

    // Calculate coverage
    const coverage = this.calculateCoverage(rulesToEvaluate.map(([, { rule }]) => rule));

    return {
      matches,
      stats,
      coverage,
    };
  }

  /**
   * Evaluate condition against event
   */
  private evaluateCondition(condition: SigmaCondition, event: SocEvent): boolean {
    switch (condition.type) {
      case 'and':
        return this.evaluateAndCondition(condition, event);
      case 'or':
        return this.evaluateOrCondition(condition, event);
      case 'not':
        return !this.evaluateAndCondition(condition, event);
      default:
        return false;
    }
  }

  /**
   * Evaluate AND condition
   */
  private evaluateAndCondition(condition: SigmaCondition, event: SocEvent): boolean {
    // Evaluate predicates
    const predicateResults = condition.predicates?.map(predicate => 
      this.evaluatePredicate(predicate, event)
    ) || [];

    // Evaluate sub-conditions
    const subConditionResults = condition.subConditions?.map(subCondition => 
      this.evaluateCondition(subCondition, event)
    ) || [];

    const allResults = [...predicateResults, ...subConditionResults];
    
    if (condition.threshold !== undefined) {
      const trueCount = allResults.filter(Boolean).length;
      return trueCount >= condition.threshold;
    }

    return allResults.length > 0 && allResults.every(Boolean);
  }

  /**
   * Evaluate OR condition
   */
  private evaluateOrCondition(condition: SigmaCondition, event: SocEvent): boolean {
    // Evaluate predicates
    const predicateResults = condition.predicates?.map(predicate => 
      this.evaluatePredicate(predicate, event)
    ) || [];

    // Evaluate sub-conditions
    const subConditionResults = condition.subConditions?.map(subCondition => 
      this.evaluateCondition(subCondition, event)
    ) || [];

    const allResults = [...predicateResults, ...subConditionResults];
    return allResults.some(Boolean);
  }

  /**
   * Evaluate individual predicate
   */
  private evaluatePredicate(predicate: SigmaPredicate, event: SocEvent): boolean {
    const eventValue = this.getEventFieldValue(predicate.field, event);
    let result = false;

    switch (predicate.operator) {
      case 'equals':
        result = eventValue === predicate.value;
        break;
      case 'contains':
        result = typeof eventValue === 'string' && 
                eventValue.toLowerCase().includes(String(predicate.value).toLowerCase());
        break;
      case 'startswith':
        result = typeof eventValue === 'string' && 
                eventValue.toLowerCase().startsWith(String(predicate.value).toLowerCase());
        break;
      case 'endswith':
        result = typeof eventValue === 'string' && 
                eventValue.toLowerCase().endsWith(String(predicate.value).toLowerCase());
        break;
      case 'regex':
        try {
          const regex = new RegExp(String(predicate.value), 'i');
          result = typeof eventValue === 'string' && regex.test(eventValue);
        } catch {
          result = false;
        }
        break;
      case 'gt':
        result = Number(eventValue) > Number(predicate.value);
        break;
      case 'lt':
        result = Number(eventValue) < Number(predicate.value);
        break;
      case 'in':
        result = Array.isArray(predicate.value) && 
                predicate.value.includes(eventValue);
        break;
      case 'exists':
        result = eventValue !== undefined && eventValue !== null;
        break;
      default:
        result = false;
    }

    return predicate.negate ? !result : result;
  }

  /**
   * Get field value from event
   */
  private getEventFieldValue(fieldPath: string, event: SocEvent): any {
    // Handle nested field paths (e.g., "signal.ip", "metadata.user")
    const parts = fieldPath.split('.');
    let value: any = event;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as any)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Extract matched fields from event
   */
  private extractMatchedFields(condition: SigmaCondition, event: SocEvent): Record<string, any> {
    const fields: Record<string, any> = {};
    
    const collectFields = (cond: SigmaCondition) => {
      cond.predicates?.forEach(predicate => {
        const value = this.getEventFieldValue(predicate.field, event);
        if (value !== undefined) {
          fields[predicate.field] = value;
        }
      });

      cond.subConditions?.forEach(subCond => collectFields(subCond));
    };

    collectFields(condition);
    return fields;
  }

  /**
   * Get matched field names
   */
  private getMatchedFieldNames(condition: SigmaCondition): string[] {
    const fieldNames: string[] = [];
    
    const collectFieldNames = (cond: SigmaCondition) => {
      cond.predicates?.forEach(predicate => {
        fieldNames.push(predicate.field);
      });

      cond.subConditions?.forEach(subCond => collectFieldNames(subCond));
    };

    collectFieldNames(condition);
    return [...new Set(fieldNames)]; // Remove duplicates
  }

  /**
   * Calculate risk score for match
   */
  private calculateRiskScore(rule: SigmaRule, event: SocEvent): number {
    let score = 0;

    // Base score from rule level
    switch (rule.level) {
      case 'critical': score = 90; break;
      case 'high': score = 70; break;
      case 'medium': score = 50; break;
      case 'low': score = 30; break;
    }

    // Adjust based on event source reliability
    switch (event.source) {
      case 'cloudflare':
      case 'waf':
        score += 10; break;
      case 'secscan':
        score += 5; break;
    }

    // Adjust for false positive hints
    if (rule.falsepositives && rule.falsepositives.length > 0) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate confidence score for match
   */
  private calculateConfidence(rule: SigmaRule, event: SocEvent): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on rule status
    switch (rule.status) {
      case 'stable': confidence = 0.9; break;
      case 'test': confidence = 0.7; break;
      case 'experimental': confidence = 0.5; break;
      case 'deprecated': confidence = 0.3; break;
    }

    // Adjust for false positives
    if (rule.falsepositives && rule.falsepositives.length > 2) {
      confidence -= 0.2;
    }

    // Adjust for event completeness
    const eventFields = Object.keys(event).length + 
                       Object.keys(event.signal || {}).length + 
                       Object.keys(event.metadata || {}).length;
    
    if (eventFields > 10) {
      confidence += 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Calculate MITRE ATT&CK coverage
   */
  private calculateCoverage(rules: SigmaRule[]): {
    tacticsCovered: string[];
    techniquesCovered: string[];
    coveragePercentage: number;
  } {
    const tacticsCovered = new Set<string>();
    const techniquesCovered = new Set<string>();

    // Extract MITRE tags from rules
    for (const rule of rules) {
      for (const tag of rule.tags) {
        if (tag.startsWith('attack.t')) {
          // Extract technique ID (e.g., "attack.t1110" -> "T1110")
          const techniqueId = tag.replace('attack.t', 'T').toUpperCase();
          techniquesCovered.add(techniqueId);
        }
        
        if (tag.startsWith('attack.ta')) {
          // Extract tactic ID (e.g., "attack.ta0006" -> "TA0006")
          const tacticId = tag.replace('attack.ta', 'TA').toUpperCase();
          tacticsCovered.add(tacticId);
        }
      }
    }

    // Calculate coverage percentage (based on common enterprise techniques)
    const totalCommonTechniques = 200; // Approximate number of commonly used techniques
    const coveragePercentage = (techniquesCovered.size / totalCommonTechniques) * 100;

    return {
      tacticsCovered: Array.from(tacticsCovered),
      techniquesCovered: Array.from(techniquesCovered),
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
    };
  }

  /**
   * Get loaded rules
   */
  getRules(): SigmaRule[] {
    return Array.from(this.rules.values()).map(({ rule }) => rule);
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): SigmaRule | undefined {
    return this.rules.get(ruleId)?.rule;
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules.clear();
  }

  // Legacy compatibility methods from old implementation
  detectThreats(events: SocEvent[]): any {
    const result = this.evaluateEvents(events);
    return result.then(evaluation => ({
      detections: evaluation.matches.map(match => ({
        rule_id: match.ruleId,
        rule_title: match.ruleName,
        description: this.getRule(match.ruleId)?.description,
        severity: this.getRule(match.ruleId)?.level,
        mitre_attack: this.getAttackTechniques([match]),
        matched_events: [match.context.eventData],
        event_count: 1,
        timestamp: match.timestamp.toISOString()
      })),
      statistics: {
        total_rules: evaluation.stats.totalRules,
        triggered_rules: evaluation.stats.executedRules,
        total_detections: evaluation.stats.matchCount,
        severity_breakdown: this.getSeverityBreakdown(evaluation.matches)
      },
      timestamp: new Date().toISOString()
    }));
  }

  getAttackTechniques(matches: SigmaMatch[]): string[] {
    const techniques = new Set<string>();
    
    for (const match of matches) {
      const rule = this.getRule(match.ruleId);
      if (rule) {
        for (const tag of rule.tags) {
          if (tag.startsWith('attack.t')) {
            techniques.add(tag.replace('attack.t', 'T').toUpperCase());
          }
        }
      }
    }

    return Array.from(techniques);
  }

  private getSeverityBreakdown(matches: SigmaMatch[]): Record<string, number> {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    
    for (const match of matches) {
      const rule = this.getRule(match.ruleId);
      if (rule && breakdown.hasOwnProperty(rule.level)) {
        breakdown[rule.level as keyof typeof breakdown]++;
      }
    }
    
    return breakdown;
  }

  exportSigmaRules(): string {
    const rules: string[] = [];
    
    this.rules.forEach(({ rule }) => {
      // Generate YAML representation
      const yamlRule = `
title: ${rule.title}
id: ${rule.id}
description: ${rule.description || ''}
author: ${rule.author || 'AILYDIAN SOC++'}
date: ${rule.date || new Date().toISOString().split('T')[0]}
status: ${rule.status || 'test'}
level: ${rule.level}
logsource:
  product: ${rule.logsource.product || ''}
  service: ${rule.logsource.service || ''}
  category: ${rule.logsource.category || ''}
detection:
  condition: ${rule.detection.condition}
fields: ${JSON.stringify(rule.fields || [])}
falsepositives: ${JSON.stringify(rule.falsepositives || [])}
tags: ${JSON.stringify(rule.tags || [])}
references: ${JSON.stringify(rule.references || [])}
      `.trim();
      
      rules.push(yamlRule);
    });

    return rules.join('\n\n---\n\n');
  }

  addCustomRule(ruleData: any): void {
    const yamlRule = typeof ruleData === 'string' ? ruleData : this.objectToYaml(ruleData);
    this.loadRule(yamlRule);
  }

  private objectToYaml(obj: any): string {
    // Simple YAML conversion - would use js-yaml in real implementation
    return Object.entries(obj).map(([key, value]) => 
      `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
    ).join('\n');
  }

  getAllRules(): SigmaRule[] {
    return this.getRules();
  }

  updateRule(ruleId: string, updates: Partial<SigmaRule>): boolean {
    const existing = this.rules.get(ruleId);
    if (existing) {
      const updatedRule = { ...existing.rule, ...updates };
      const condition = this.compiler.compileRule(updatedRule);
      this.rules.set(ruleId, { rule: updatedRule, condition });
      return true;
    }
    return false;
  }

  deleteRule(ruleId: string): boolean {
    return this.removeRule(ruleId);
  }

  getCoverageReport(): any {
    const rules = this.getRules();
    const coverage = this.calculateCoverage(rules);
    
    return {
      total_rules: rules.length,
      tactics_covered: coverage.tacticsCovered,
      techniques_covered: coverage.techniquesCovered,
      coverage_percentage: coverage.coveragePercentage,
      rule_breakdown: {
        critical: rules.filter(r => r.level === 'critical').length,
        high: rules.filter(r => r.level === 'high').length,
        medium: rules.filter(r => r.level === 'medium').length,
        low: rules.filter(r => r.level === 'low').length,
      }
    };
  }

  private mapTechniqueToTactic(technique: string): string | null {
    // Simplified mapping - in real implementation, use full MITRE data
    const mappings: Record<string, string> = {
      'T1110': 'TA0006', // Credential Access
      'T1078': 'TA0003', // Persistence  
      'T1041': 'TA0010', // Exfiltration
      'T1565.001': 'TA0011', // Impact
      'T1059.001': 'TA0002', // Execution
      'T1567.002': 'TA0010', // Exfiltration
    };
    
    return mappings[technique] || null;
  }
}

// Export singleton instance
export const sigmaEngine = new SigmaRuleEngine();