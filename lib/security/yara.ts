/**
 * 🛡️ AILYDIAN SOC++ - YARA Integration
 * Safe artifact scanning with pattern matching, threat detection, and malware analysis
 * Path restrictions and size limits for CI/runtime security
 * © Emrah Şardağ. All rights reserved.
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SocEvent } from './soc/schema';

export interface YaraRule {
  id: string;
  name: string;
  author?: string;
  description?: string;
  version?: string;
  date?: string;
  reference?: string[];
  tags: string[];
  meta: Record<string, any>;
  strings: YaraString[];
  condition: string;
  ruleText: string;
}

export interface YaraString {
  identifier: string;
  type: 'text' | 'hex' | 'regex';
  value: string;
  modifiers?: string[];
  encoding?: string;
}

export interface YaraScanResult {
  id: string;
  ruleId: string;
  ruleName: string;
  filePath: string;
  fileName: string;
  fileHash: string;
  fileSize: number;
  mimeType?: string;
  matches: YaraMatch[];
  riskScore: number;
  threatType?: string;
  scanTime: Date;
  scanDurationMs: number;
  metadata: {
    fileCreated?: Date;
    fileModified?: Date;
    fileAccessed?: Date;
    permissions?: string;
    owner?: string;
  };
}

export interface YaraMatch {
  stringId: string;
  stringValue: string;
  offset: number;
  length: number;
  context: string;
  matchType: 'exact' | 'partial' | 'regex';
}

export interface YaraScanOptions {
  maxFileSize?: number; // MB
  allowedExtensions?: string[];
  blockedExtensions?: string[];
  allowedPaths?: string[];
  blockedPaths?: string[];
  scanTimeout?: number; // seconds
  enableMetadata?: boolean;
  maxMatches?: number;
}

export interface YaraScanSession {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  filesScanned: number;
  filesMatched: number;
  totalMatches: number;
  errors: string[];
  results: YaraScanResult[];
}

/**
 * YARA Rule Parser - Parse YARA rules from text format
 */
export class YaraRuleParser {
  /**
   * Parse YARA rule from text content
   */
  parseRule(ruleContent: string, filePath?: string): YaraRule {
    const lines = ruleContent.split('\n').map(line => line.trim());
    
    let currentSection = 'header';
    const rule: Partial<YaraRule> = {
      meta: {},
      strings: [],
      tags: [],
      ruleText: ruleContent
    };

    let ruleName = '';
    let metaLines: string[] = [];
    let stringsLines: string[] = [];
    let conditionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (!line || line.startsWith('//')) continue;

      // Parse rule declaration
      if (line.match(/^rule\s+\w+/)) {
        const match = line.match(/^rule\s+(\w+)(\s+:\s*(.+))?\s*\{?/);
        if (match) {
          ruleName = match[1];
          if (match[3]) {
            rule.tags = match[3].split(/\s+/).filter(Boolean);
          }
        }
        continue;
      }

      // Detect sections
      if (line === 'meta:') {
        currentSection = 'meta';
        continue;
      }
      if (line === 'strings:') {
        currentSection = 'strings';
        continue;
      }
      if (line === 'condition:') {
        currentSection = 'condition';
        continue;
      }
      if (line === '}') {
        break;
      }

      // Collect lines for each section
      switch (currentSection) {
        case 'meta':
          if (line && !line.startsWith('//')) {
            metaLines.push(line);
          }
          break;
        case 'strings':
          if (line && !line.startsWith('//')) {
            stringsLines.push(line);
          }
          break;
        case 'condition':
          if (line && !line.startsWith('//')) {
            conditionLines.push(line);
          }
          break;
      }
    }

    // Parse meta section
    for (const line of metaLines) {
      const match = line.match(/^(\w+)\s*=\s*(.+)/);
      if (match) {
        let value: any = match[2].replace(/"/g, '');
        
        // Try to parse as number or boolean
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value))) value = Number(value);
        
        rule.meta![match[1]] = value;

        // Extract standard meta fields
        switch (match[1].toLowerCase()) {
          case 'author': rule.author = value; break;
          case 'description': rule.description = value; break;
          case 'version': rule.version = value; break;
          case 'date': rule.date = value; break;
          case 'reference': 
            if (!rule.reference) rule.reference = [];
            rule.reference.push(value);
            break;
        }
      }
    }

    // Parse strings section
    for (const line of stringsLines) {
      const stringMatch = line.match(/^(\$\w+)\s*=\s*(.+)/);
      if (stringMatch) {
        const identifier = stringMatch[1];
        let value = stringMatch[2];
        let type: 'text' | 'hex' | 'regex' = 'text';
        let modifiers: string[] = [];

        // Determine string type and extract modifiers
        if (value.startsWith('"') && value.includes('"')) {
          type = 'text';
          const parts = value.split('"');
          value = parts[1];
          if (parts[2]) {
            modifiers = parts[2].trim().split(/\s+/).filter(Boolean);
          }
        } else if (value.startsWith('{') && value.endsWith('}')) {
          type = 'hex';
          value = value.slice(1, -1).trim();
        } else if (value.startsWith('/') && value.includes('/')) {
          type = 'regex';
          const parts = value.split('/');
          value = parts[1];
          if (parts[2]) {
            modifiers = parts[2].split('').filter(Boolean);
          }
        }

        rule.strings!.push({
          identifier,
          type,
          value,
          modifiers
        });
      }
    }

    // Parse condition
    rule.condition = conditionLines.join(' ').trim();

    // Generate ID and set name
    rule.id = this.generateRuleId(ruleName, filePath);
    rule.name = ruleName;

    this.validateRule(rule as YaraRule);
    return rule as YaraRule;
  }

  /**
   * Parse multiple rules from text content
   */
  parseRules(content: string, filePath?: string): YaraRule[] {
    const rules: YaraRule[] = [];
    
    // Split by rule boundaries
    const ruleBlocks = content.split(/\n(?=rule\s+\w+)/);
    
    for (const block of ruleBlocks) {
      if (block.trim() && block.includes('rule ')) {
        try {
          const rule = this.parseRule(block.trim(), filePath);
          rules.push(rule);
        } catch (error) {
          console.warn(`Failed to parse YARA rule: ${error}`);
        }
      }
    }

    return rules;
  }

  /**
   * Generate rule ID
   */
  private generateRuleId(ruleName: string, filePath?: string): string {
    const hash = crypto.createHash('sha256')
      .update(ruleName + (filePath || ''))
      .digest('hex')
      .substring(0, 12);
    return `yara_${hash}`;
  }

  /**
   * Validate rule structure
   */
  private validateRule(rule: YaraRule): void {
    if (!rule.name) {
      throw new Error('Rule must have a name');
    }
    if (!rule.condition) {
      throw new Error('Rule must have a condition');
    }
    if (!rule.strings || rule.strings.length === 0) {
      throw new Error('Rule must have at least one string');
    }
  }
}

/**
 * YARA Pattern Matcher - Simple pattern matching engine
 */
export class YaraPatternMatcher {
  /**
   * Match strings against file content
   */
  matchStrings(content: Buffer | string, strings: YaraString[]): YaraMatch[] {
    const matches: YaraMatch[] = [];
    const textContent = Buffer.isBuffer(content) ? content.toString('utf8') : content;
    const binaryContent = Buffer.isBuffer(content) ? content : Buffer.from(content);

    for (const yaraString of strings) {
      const stringMatches = this.matchSingleString(
        yaraString.type === 'hex' ? binaryContent : textContent,
        yaraString
      );
      matches.push(...stringMatches);
    }

    return matches;
  }

  /**
   * Match single string pattern
   */
  private matchSingleString(content: Buffer | string, yaraString: YaraString): YaraMatch[] {
    const matches: YaraMatch[] = [];
    
    try {
      switch (yaraString.type) {
        case 'text':
          matches.push(...this.matchText(content as string, yaraString));
          break;
        case 'hex':
          matches.push(...this.matchHex(content as Buffer, yaraString));
          break;
        case 'regex':
          matches.push(...this.matchRegex(content as string, yaraString));
          break;
      }
    } catch (error) {
      console.warn(`Failed to match string ${yaraString.identifier}: ${error}`);
    }

    return matches;
  }

  /**
   * Match text patterns
   */
  private matchText(content: string, yaraString: YaraString): YaraMatch[] {
    const matches: YaraMatch[] = [];
    let searchString = yaraString.value;
    let flags = '';

    // Apply modifiers
    if (yaraString.modifiers) {
      if (yaraString.modifiers.includes('nocase')) {
        flags += 'i';
      }
      if (yaraString.modifiers.includes('wide')) {
        // Simple wide character simulation
        searchString = yaraString.value.split('').join('\u0000');
      }
    }

    const regex = new RegExp(this.escapeRegExp(searchString), flags + 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
      const contextStart = Math.max(0, match.index - 20);
      const contextEnd = Math.min(content.length, match.index + match[0].length + 20);
      
      matches.push({
        stringId: yaraString.identifier,
        stringValue: yaraString.value,
        offset: match.index,
        length: match[0].length,
        context: content.substring(contextStart, contextEnd),
        matchType: 'exact'
      });
    }

    return matches;
  }

  /**
   * Match hex patterns
   */
  private matchHex(content: Buffer, yaraString: YaraString): YaraMatch[] {
    const matches: YaraMatch[] = [];
    
    // Convert hex string to buffer for matching
    const hexPattern = yaraString.value.replace(/\s+/g, '');
    if (hexPattern.length % 2 !== 0) {
      return matches; // Invalid hex pattern
    }

    const patternBuffer = Buffer.from(hexPattern, 'hex');
    let offset = 0;

    while (offset < content.length) {
      const index = content.indexOf(patternBuffer, offset);
      if (index === -1) break;

      const contextStart = Math.max(0, index - 20);
      const contextEnd = Math.min(content.length, index + patternBuffer.length + 20);
      
      matches.push({
        stringId: yaraString.identifier,
        stringValue: yaraString.value,
        offset: index,
        length: patternBuffer.length,
        context: content.subarray(contextStart, contextEnd).toString('hex'),
        matchType: 'exact'
      });

      offset = index + 1;
    }

    return matches;
  }

  /**
   * Match regex patterns
   */
  private matchRegex(content: string, yaraString: YaraString): YaraMatch[] {
    const matches: YaraMatch[] = [];
    
    try {
      const flags = yaraString.modifiers?.join('') || '';
      const regex = new RegExp(yaraString.value, flags + 'g');
      let match;

      while ((match = regex.exec(content)) !== null) {
        const contextStart = Math.max(0, match.index - 20);
        const contextEnd = Math.min(content.length, match.index + match[0].length + 20);
        
        matches.push({
          stringId: yaraString.identifier,
          stringValue: yaraString.value,
          offset: match.index,
          length: match[0].length,
          context: content.substring(contextStart, contextEnd),
          matchType: 'regex'
        });
      }
    } catch (error) {
      console.warn(`Invalid regex pattern: ${yaraString.value}`);
    }

    return matches;
  }

  /**
   * Escape string for regex
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * YARA Condition Evaluator - Evaluate rule conditions
 */
export class YaraConditionEvaluator {
  /**
   * Evaluate rule condition against matches
   */
  evaluateCondition(condition: string, matches: YaraMatch[], strings: YaraString[]): boolean {
    try {
      // Simple condition evaluation
      return this.parseAndEvaluate(condition, matches, strings);
    } catch (error) {
      console.warn(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Parse and evaluate condition
   */
  private parseAndEvaluate(condition: string, matches: YaraMatch[], strings: YaraString[]): boolean {
    // Create match map
    const matchMap = new Map<string, YaraMatch[]>();
    matches.forEach(match => {
      const existing = matchMap.get(match.stringId) || [];
      existing.push(match);
      matchMap.set(match.stringId, existing);
    });

    // Simple evaluation - replace string identifiers with boolean values
    let evaluableCondition = condition;

    // Replace string references
    strings.forEach(yaraString => {
      const hasMatches = matchMap.has(yaraString.identifier);
      evaluableCondition = evaluableCondition.replace(
        new RegExp(`\\${yaraString.identifier}\\b`, 'g'),
        hasMatches ? 'true' : 'false'
      );
    });

    // Replace operators
    evaluableCondition = evaluableCondition
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\b/g, '!')
      .replace(/\ball\s+of\s+them/g, this.getAllOfThem(strings, matchMap))
      .replace(/\bany\s+of\s+them/g, this.getAnyOfThem(strings, matchMap));

    // Handle count conditions (simplified)
    const countMatch = evaluableCondition.match(/#(\w+)\s*([><=!]+)\s*(\d+)/);
    if (countMatch) {
      const stringId = `$${countMatch[1]}`;
      const operator = countMatch[2];
      const threshold = parseInt(countMatch[3]);
      const count = matchMap.get(stringId)?.length || 0;
      
      let result = false;
      switch (operator) {
        case '>': result = count > threshold; break;
        case '<': result = count < threshold; break;
        case '>=': result = count >= threshold; break;
        case '<=': result = count <= threshold; break;
        case '==': result = count === threshold; break;
        case '!=': result = count !== threshold; break;
      }
      
      return result;
    }

    // Evaluate the final boolean expression
    try {
      return this.safeBooleanEval(evaluableCondition);
    } catch {
      return false;
    }
  }

  /**
   * Get "all of them" result
   */
  private getAllOfThem(strings: YaraString[], matchMap: Map<string, YaraMatch[]>): string {
    const allMatch = strings.every(s => matchMap.has(s.identifier));
    return allMatch ? 'true' : 'false';
  }

  /**
   * Get "any of them" result
   */
  private getAnyOfThem(strings: YaraString[], matchMap: Map<string, YaraMatch[]>): string {
    const anyMatch = strings.some(s => matchMap.has(s.identifier));
    return anyMatch ? 'true' : 'false';
  }

  /**
   * Safe boolean evaluation
   */
  private safeBooleanEval(expression: string): boolean {
    // Only allow safe boolean operations
    const safeExpression = expression.replace(/[^true|false|&|!|(|)|\s]/g, '');
    if (safeExpression !== expression) {
      throw new Error('Unsafe expression');
    }
    
    return Function(`"use strict"; return (${safeExpression})`)();
  }
}

/**
 * YARA Scanner Engine - Main scanning engine
 */
export class YaraScannerEngine {
  private parser = new YaraRuleParser();
  private matcher = new YaraPatternMatcher();
  private evaluator = new YaraConditionEvaluator();
  private rules: Map<string, YaraRule> = new Map();

  private readonly defaultOptions: Required<YaraScanOptions> = {
    maxFileSize: parseInt(process.env.YARA_MAX_MB || '25'),
    allowedExtensions: ['.exe', '.dll', '.bin', '.dat', '.tmp', '.log', '.js', '.php', '.py'],
    blockedExtensions: ['.mp4', '.avi', '.mp3', '.wav', '.jpg', '.png', '.gif'],
    allowedPaths: ['/tmp', '/var/tmp', './uploads', './scans'],
    blockedPaths: ['/etc', '/usr', '/bin', '/sbin', '/system', '/windows'],
    scanTimeout: 30,
    enableMetadata: true,
    maxMatches: 1000
  };

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default YARA rules
   */
  private initializeDefaultRules(): void {
    const defaultRules = [
      // Suspicious executable detection
      `
rule SuspiciousExecutable {
    meta:
        author = "AILYDIAN SOC++"
        description = "Detects suspicious executable patterns"
        version = "1.0"
        date = "2024-01-01"
    
    strings:
        $mz = { 4D 5A }
        $pe = "PE" nocase
        $shell = "cmd.exe" nocase
        $powershell = "powershell" nocase
        $suspicious = "WScript.Shell" nocase
    
    condition:
        $mz at 0 and $pe and ($shell or $powershell or $suspicious)
}
      `,
      
      // Malicious script detection
      `
rule MaliciousScript {
    meta:
        author = "AILYDIAN SOC++"
        description = "Detects malicious script patterns"
        version = "1.0"
    
    strings:
        $eval = "eval(" nocase
        $exec = "exec(" nocase  
        $shell_exec = "shell_exec" nocase
        $system = "system(" nocase
        $base64 = /[A-Za-z0-9+\/]{20,}={0,2}/
        
    condition:
        2 of them
}
      `,

      // Cryptocurrency miner detection
      `
rule CryptoMiner {
    meta:
        author = "AILYDIAN SOC++"
        description = "Detects cryptocurrency mining patterns"
        version = "1.0"
        
    strings:
        $stratum = "stratum+" nocase
        $mining = "mining" nocase
        $hashrate = "hashrate" nocase
        $worker = "worker" nocase
        $pool = "pool" nocase
        
    condition:
        3 of them
}
      `
    ];

    defaultRules.forEach(ruleText => {
      try {
        this.loadRule(ruleText);
      } catch (error) {
        console.warn(`Failed to load default YARA rule: ${error}`);
      }
    });
  }

  /**
   * Load YARA rule from text
   */
  loadRule(ruleContent: string, filePath?: string): string {
    const rule = this.parser.parseRule(ruleContent, filePath);
    this.rules.set(rule.id, rule);
    return rule.id;
  }

  /**
   * Load multiple rules
   */
  loadRules(rulesContent: string, filePath?: string): string[] {
    const rules = this.parser.parseRules(rulesContent, filePath);
    const ids: string[] = [];
    
    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
      ids.push(rule.id);
    });
    
    return ids;
  }

  /**
   * Scan file with YARA rules
   */
  async scanFile(
    filePath: string, 
    options: Partial<YaraScanOptions> = {}
  ): Promise<YaraScanResult[]> {
    const opts = { ...this.defaultOptions, ...options };
    const results: YaraScanResult[] = [];

    // Security checks
    if (!this.isPathAllowed(filePath, opts)) {
      throw new Error(`Path not allowed: ${filePath}`);
    }

    if (!this.isExtensionAllowed(filePath, opts)) {
      throw new Error(`File extension not allowed: ${path.extname(filePath)}`);
    }

    // File stats and size check
    const stats = await fs.stat(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > opts.maxFileSize) {
      throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB > ${opts.maxFileSize}MB`);
    }

    // Read file content
    const content = await fs.readFile(filePath);
    const fileHash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Scan with each rule
    for (const rule of this.rules.values()) {
      const startTime = Date.now();
      
      try {
        const matches = this.matcher.matchStrings(content, rule.strings);
        
        if (matches.length > 0) {
          // Evaluate condition
          const conditionMet = this.evaluator.evaluateCondition(
            rule.condition,
            matches,
            rule.strings
          );

          if (conditionMet) {
            const scanResult: YaraScanResult = {
              id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ruleId: rule.id,
              ruleName: rule.name,
              filePath,
              fileName: path.basename(filePath),
              fileHash,
              fileSize: stats.size,
              matches: matches.slice(0, opts.maxMatches),
              riskScore: this.calculateRiskScore(rule, matches),
              threatType: this.determineThreatType(rule),
              scanTime: new Date(),
              scanDurationMs: Date.now() - startTime,
              metadata: opts.enableMetadata ? {
                fileCreated: stats.birthtime,
                fileModified: stats.mtime,
                fileAccessed: stats.atime,
                permissions: stats.mode.toString(8),
                owner: stats.uid.toString()
              } : {}
            };

            results.push(scanResult);
          }
        }
      } catch (error) {
        console.warn(`Failed to scan with rule ${rule.name}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Scan multiple files
   */
  async scanFiles(
    filePaths: string[],
    options: Partial<YaraScanOptions> = {}
  ): Promise<YaraScanSession> {
    const session: YaraScanSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'running',
      startTime: new Date(),
      filesScanned: 0,
      filesMatched: 0,
      totalMatches: 0,
      errors: [],
      results: []
    };

    try {
      for (const filePath of filePaths) {
        try {
          const results = await this.scanFile(filePath, options);
          session.filesScanned++;
          
          if (results.length > 0) {
            session.filesMatched++;
            session.totalMatches += results.reduce((sum, r) => sum + r.matches.length, 0);
            session.results.push(...results);
          }
        } catch (error) {
          session.errors.push(`${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      session.status = 'completed';
    } catch (error) {
      session.status = 'failed';
      session.errors.push(`Scan session failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      session.endTime = new Date();
    }

    return session;
  }

  /**
   * Check if path is allowed
   */
  private isPathAllowed(filePath: string, options: Required<YaraScanOptions>): boolean {
    const normalizedPath = path.resolve(filePath);
    
    // Check blocked paths
    for (const blockedPath of options.blockedPaths) {
      if (normalizedPath.startsWith(path.resolve(blockedPath))) {
        return false;
      }
    }

    // Check allowed paths
    if (options.allowedPaths.length > 0) {
      return options.allowedPaths.some(allowedPath =>
        normalizedPath.startsWith(path.resolve(allowedPath))
      );
    }

    return true;
  }

  /**
   * Check if extension is allowed
   */
  private isExtensionAllowed(filePath: string, options: Required<YaraScanOptions>): boolean {
    const ext = path.extname(filePath).toLowerCase();
    
    // Check blocked extensions
    if (options.blockedExtensions.includes(ext)) {
      return false;
    }

    // Check allowed extensions
    if (options.allowedExtensions.length > 0) {
      return options.allowedExtensions.includes(ext);
    }

    return true;
  }

  /**
   * Calculate risk score for matches
   */
  private calculateRiskScore(rule: YaraRule, matches: YaraMatch[]): number {
    let score = 30; // Base score

    // Adjust based on rule tags
    if (rule.tags.includes('malware')) score += 40;
    if (rule.tags.includes('trojan')) score += 35;
    if (rule.tags.includes('virus')) score += 35;
    if (rule.tags.includes('ransomware')) score += 50;
    if (rule.tags.includes('rootkit')) score += 45;
    if (rule.tags.includes('suspicious')) score += 20;

    // Adjust based on match count
    const matchCount = matches.length;
    if (matchCount > 10) score += 20;
    else if (matchCount > 5) score += 10;

    // Adjust based on match types
    const hasHexMatches = matches.some(m => m.matchType === 'exact' && m.stringId.includes('hex'));
    const hasRegexMatches = matches.some(m => m.matchType === 'regex');
    
    if (hasHexMatches) score += 15;
    if (hasRegexMatches) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine threat type from rule
   */
  private determineThreatType(rule: YaraRule): string {
    // Check tags for threat type
    const threatTypes = ['malware', 'trojan', 'virus', 'ransomware', 'rootkit', 'adware', 'spyware'];
    
    for (const threatType of threatTypes) {
      if (rule.tags.includes(threatType)) {
        return threatType;
      }
    }

    // Check rule name
    const ruleName = rule.name.toLowerCase();
    for (const threatType of threatTypes) {
      if (ruleName.includes(threatType)) {
        return threatType;
      }
    }

    return 'suspicious';
  }

  /**
   * Get loaded rules
   */
  getRules(): YaraRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): YaraRule | undefined {
    return this.rules.get(ruleId);
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

  // Legacy compatibility methods for backward compatibility
  scanContent(content: string, metadata: any = {}): any {
    // Convert string to Buffer for scanning
    const buffer = Buffer.from(content);
    const results: any[] = [];

    for (const rule of this.rules.values()) {
      try {
        const matches = this.matcher.matchStrings(buffer, rule.strings);
        
        if (matches.length > 0) {
          const conditionMet = this.evaluator.evaluateCondition(
            rule.condition,
            matches,
            rule.strings
          );

          if (conditionMet) {
            results.push({
              rule_id: rule.id,
              rule_name: rule.name,
              description: rule.description,
              severity: this.getLegacySeverity(rule),
              yara_rule: rule.ruleText,
              detection_time: new Date().toISOString(),
              content_snippet: this.extractSnippet(content, 200),
              metadata: metadata
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to scan with rule ${rule.name}: ${error}`);
      }
    }

    return {
      scan_results: {
        total_rules: this.rules.size,
        matched_rules: results.length,
        detections: results,
        risk_score: this.calculateLegacyRiskScore(results),
        scan_timestamp: new Date().toISOString()
      }
    };
  }

  scanBatch(items: Array<{ content: string; metadata: any }>): any {
    const batchResults = items.map(item => this.scanContent(item.content, item.metadata));
    
    const aggregated = {
      total_scans: items.length,
      total_detections: batchResults.reduce((sum, result) => sum + result.scan_results.detections.length, 0),
      highest_risk_score: Math.max(...batchResults.map(r => r.scan_results.risk_score)),
      severity_breakdown: { critical: 0, high: 0, medium: 0, low: 0 },
      batch_timestamp: new Date().toISOString(),
      individual_results: batchResults
    };

    // Calculate severity breakdown
    batchResults.forEach(result => {
      result.scan_results.detections.forEach((detection: any) => {
        aggregated.severity_breakdown[detection.severity as keyof typeof aggregated.severity_breakdown]++;
      });
    });

    return aggregated;
  }

  addCustomRule(rule: any): void {
    const yamlRule = typeof rule === 'string' ? rule : this.objectToYaml(rule);
    this.loadRule(yamlRule);
  }

  exportYARARules(): string {
    return Array.from(this.rules.values())
      .map(rule => rule.ruleText)
      .join('\n\n');
  }

  updateRule(ruleId: string, updates: any): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      // Update rule properties
      const updatedRule = { ...rule, ...updates };
      this.rules.set(ruleId, updatedRule);
      return true;
    }
    return false;
  }

  deleteRule(ruleId: string): boolean {
    return this.removeRule(ruleId);
  }

  getAllRules(): YaraRule[] {
    return this.getRules();
  }

  private getLegacySeverity(rule: YaraRule): string {
    // Map YARA rule to legacy severity
    const riskScore = this.calculateRiskScore(rule, []);
    if (riskScore >= 90) return 'critical';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 50) return 'medium';
    return 'low';
  }

  private calculateLegacyRiskScore(detections: any[]): number {
    if (detections.length === 0) return 0;

    const severityWeights = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };

    const totalScore = detections.reduce((score, detection) => {
      return score + (severityWeights[detection.severity as keyof typeof severityWeights] || 0);
    }, 0);

    return Math.min(100, totalScore / detections.length);
  }

  private extractSnippet(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  private objectToYaml(obj: any): string {
    // Simple YAML conversion
    return Object.entries(obj).map(([key, value]) => 
      `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
    ).join('\n');
  }

  getStatistics(): any {
    const rules = this.getRules();
    
    return {
      total_rules: rules.length,
      severity_distribution: {
        critical: rules.filter(r => this.getLegacySeverity(r) === 'critical').length,
        high: rules.filter(r => this.getLegacySeverity(r) === 'high').length,
        medium: rules.filter(r => this.getLegacySeverity(r) === 'medium').length,
        low: rules.filter(r => this.getLegacySeverity(r) === 'low').length,
      },
      categories: {
        malware: rules.filter(r => r.name.toLowerCase().includes('malicious')).length,
        phishing: rules.filter(r => r.name.toLowerCase().includes('phishing')).length,
        mining: rules.filter(r => r.name.toLowerCase().includes('miner')).length,
        defi: rules.filter(r => r.name.toLowerCase().includes('defi')).length,
      },
      last_updated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const yaraScanner = new YaraScannerEngine();
