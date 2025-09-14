/**
 * 🛡️ Security Playbooks System
 * Automated security playbooks for incident response
 * © Emrah Şardağ. All rights reserved.
 */

export interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  type: 'automated' | 'manual' | 'decision';
  action?: string; // Action ID to execute
  condition?: string; // For decision steps
  timeout?: number; // seconds
  retries?: number;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Next step ID
  parameters?: Record<string, any>;
}

export interface SecurityPlaybook {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  triggers: {
    severity: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[];
    eventTypes: string[];
    mitreTechniques: string[];
    conditions?: string[];
  };
  variables: Record<string, any>;
  steps: PlaybookStep[];
  metadata: {
    created: string;
    updated: string;
    tags: string[];
    category: string;
  };
}

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  incidentId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELLED';
  startTime: string;
  endTime?: string;
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  variables: Record<string, any>;
  outputs: Record<string, any>;
  logs: {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    stepId?: string;
  }[];
}

export interface PlaybookResult {
  playbookName: string;
  automatedActions: string[];
  manualActions: string[];
  executionId?: string;
  success: boolean;
  message: string;
  outputs?: Record<string, any>;
}

export class Playbooks {
  private static instance: Playbooks;
  private playbooks: Map<string, SecurityPlaybook> = new Map();
  private executions: Map<string, PlaybookExecution> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): Playbooks {
    if (!Playbooks.instance) {
      Playbooks.instance = new Playbooks();
    }
    return Playbooks.instance;
  }

  /**
   * Initialize playbooks system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.loadDefaultPlaybooks();
    this.isInitialized = true;

    console.log('✅ Security playbooks initialized');
  }

  /**
   * Execute playbook for incident
   */
  async execute(
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    eventType: string,
    mitreTechniques: string[],
    incidentId?: string
  ): Promise<PlaybookResult> {
    // Find matching playbook
    const playbook = this.findMatchingPlaybook(severity, eventType, mitreTechniques);
    
    if (!playbook) {
      return {
        playbookName: 'No Matching Playbook',
        automatedActions: [],
        manualActions: [],
        success: false,
        message: 'No matching playbook found for incident parameters'
      };
    }

    // Create execution
    const execution: PlaybookExecution = {
      id: this.generateExecutionId(),
      playbookId: playbook.id,
      incidentId: incidentId || 'unknown',
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      currentStep: playbook.steps[0]?.id,
      completedSteps: [],
      failedSteps: [],
      variables: { ...playbook.variables },
      outputs: {},
      logs: []
    };

    this.executions.set(execution.id, execution);
    this.addLog(execution, 'INFO', `Starting playbook: ${playbook.name}`);

    try {
      const result = await this.executePlaybook(playbook, execution);
      execution.status = result.success ? 'COMPLETED' : 'FAILED';
      execution.endTime = new Date().toISOString();
      
      return {
        ...result,
        playbookName: playbook.name,
        executionId: execution.id
      };
    } catch (error) {
      execution.status = 'FAILED';
      execution.endTime = new Date().toISOString();
      this.addLog(execution, 'ERROR', `Playbook execution failed: ${error}`);
      
      return {
        playbookName: playbook.name,
        automatedActions: [],
        manualActions: [],
        executionId: execution.id,
        success: false,
        message: `Playbook execution failed: ${error}`
      };
    }
  }

  /**
   * Execute playbook steps
   */
  private async executePlaybook(
    playbook: SecurityPlaybook,
    execution: PlaybookExecution
  ): Promise<Omit<PlaybookResult, 'playbookName'>> {
    const automatedActions: string[] = [];
    const manualActions: string[] = [];
    let currentStepId: string | undefined = playbook.steps[0]?.id;
    let stepCount = 0;
    const maxSteps = 50; // Prevent infinite loops

    while (currentStepId && stepCount < maxSteps) {
      const step = playbook.steps.find(s => s.id === currentStepId);
      if (!step) {
        throw new Error(`Step not found: ${currentStepId}`);
      }

      execution.currentStep = currentStepId;
      this.addLog(execution, 'INFO', `Executing step: ${step.name}`);

      try {
        const result = await this.executeStep(step, execution);
        
        if (result.success) {
          execution.completedSteps.push(currentStepId);
          
          if (step.type === 'automated') {
            automatedActions.push(step.name);
          } else if (step.type === 'manual') {
            manualActions.push(step.name);
          }
          
          // Move to next step
          currentStepId = step.onSuccess || undefined;
          
          // Store step output
          if (result.output) {
            execution.outputs[step.id] = result.output;
          }
        } else {
          if (currentStepId) {
            execution.failedSteps.push(currentStepId);
            this.addLog(execution, 'ERROR', `Step failed: ${result.message}`);
          }
          
          // Move to failure step or stop
          currentStepId = step.onFailure || undefined;
          
          if (!step.onFailure) {
            throw new Error(`Step failed and no failure path defined: ${step.name}`);
          }
        }
      } catch (error) {
        if (currentStepId) {
          execution.failedSteps.push(currentStepId);
          this.addLog(execution, 'ERROR', `Step error: ${error}`);
        }
        throw error;
      }

      stepCount++;
    }

    if (stepCount >= maxSteps) {
      throw new Error('Playbook execution exceeded maximum step limit');
    }

    return {
      automatedActions,
      manualActions,
      success: true,
      message: `Playbook completed successfully. Executed ${execution.completedSteps.length} steps.`,
      outputs: execution.outputs
    };
  }

  /**
   * Execute individual step
   */
  private async executeStep(
    step: PlaybookStep,
    execution: PlaybookExecution
  ): Promise<{ success: boolean; message: string; output?: any }> {
    switch (step.type) {
      case 'automated':
        return this.executeAutomatedStep(step, execution);
      case 'manual':
        return this.executeManualStep(step, execution);
      case 'decision':
        return this.executeDecisionStep(step, execution);
      default:
        return { success: false, message: `Unknown step type: ${step.type}` };
    }
  }

  /**
   * Execute automated step
   */
  private async executeAutomatedStep(
    step: PlaybookStep,
    execution: PlaybookExecution
  ): Promise<{ success: boolean; message: string; output?: any }> {
    if (!step.action) {
      return { success: false, message: 'No action specified for automated step' };
    }

    const timeout = step.timeout || 60000; // 1 minute default
    const retries = step.retries || 0;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          this.executeAction(step.action, step.parameters || {}, execution),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Step timeout')), timeout * 1000)
          )
        ]) as { success: boolean; message: string; output?: any };

        if (result.success || attempt === retries) {
          return result;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      } catch (error) {
        if (attempt === retries) {
          return { success: false, message: `Step failed after ${retries + 1} attempts: ${error}` };
        }
      }
    }

    return { success: false, message: 'Unexpected error in automated step execution' };
  }

  /**
   * Execute manual step
   */
  private async executeManualStep(
    step: PlaybookStep,
    execution: PlaybookExecution
  ): Promise<{ success: boolean; message: string; output?: any }> {
    // Manual steps are always considered successful as they create tasks
    // In a real implementation, this would create tickets/tasks in your system
    
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.addLog(execution, 'INFO', `Manual task created: ${taskId} - ${step.description}`);
    
    return {
      success: true,
      message: `Manual task created: ${taskId}`,
      output: {
        taskId,
        description: step.description,
        estimatedTime: step.timeout || 3600, // 1 hour default
        instructions: step.parameters?.instructions || []
      }
    };
  }

  /**
   * Execute decision step
   */
  private async executeDecisionStep(
    step: PlaybookStep,
    execution: PlaybookExecution
  ): Promise<{ success: boolean; message: string; output?: any }> {
    if (!step.condition) {
      return { success: false, message: 'No condition specified for decision step' };
    }

    try {
      const result = this.evaluateCondition(step.condition, execution);
      
      return {
        success: true,
        message: `Decision: ${result ? 'TRUE' : 'FALSE'}`,
        output: { decision: result }
      };
    } catch (error) {
      return { success: false, message: `Decision evaluation failed: ${error}` };
    }
  }

  /**
   * Execute action
   */
  private async executeAction(
    actionId: string,
    parameters: Record<string, any>,
    execution: PlaybookExecution
  ): Promise<{ success: boolean; message: string; output?: any }> {
    // This would integrate with the incident response system
    // For now, simulating different actions
    
    switch (actionId) {
      case 'block_ip':
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          success: true,
          message: 'IP address blocked successfully',
          output: { blockedIP: parameters.ip || 'unknown', timestamp: new Date().toISOString() }
        };
        
      case 'isolate_user':
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          success: true,
          message: 'User session isolated',
          output: { user: parameters.user || 'unknown', timestamp: new Date().toISOString() }
        };
        
      case 'enable_monitoring':
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          success: true,
          message: 'Enhanced monitoring enabled',
          output: { level: parameters.level || 'high', timestamp: new Date().toISOString() }
        };
        
      case 'create_backup':
        await new Promise(resolve => setTimeout(resolve, 5000));
        return {
          success: true,
          message: 'Emergency backup created',
          output: { backupId: `backup_${Date.now()}`, timestamp: new Date().toISOString() }
        };
        
      case 'notify_team':
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          success: true,
          message: 'Team notification sent',
          output: { recipients: parameters.team || ['security'], timestamp: new Date().toISOString() }
        };
        
      default:
        return { success: false, message: `Unknown action: ${actionId}` };
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: string, execution: PlaybookExecution): boolean {
    // Simple condition evaluation
    // In a real implementation, you'd use a proper expression evaluator
    
    const variables = execution.variables;
    const outputs = execution.outputs;
    
    // Replace variables in condition
    let evaluatedCondition = condition;
    
    // Replace variable references like ${variable_name}
    evaluatedCondition = evaluatedCondition.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return variables[varName] || outputs[varName] || 'null';
    });
    
    // Simple boolean evaluation
    if (evaluatedCondition.includes('severity')) {
      const severity = variables.severity || 'LOW';
      if (evaluatedCondition.includes('HIGH') || evaluatedCondition.includes('CRITICAL')) {
        return severity === 'HIGH' || severity === 'CRITICAL';
      }
    }
    
    if (evaluatedCondition.includes('event_count')) {
      const count = variables.event_count || 0;
      if (evaluatedCondition.includes('>')) {
        const threshold = parseInt(evaluatedCondition.split('>')[1].trim()) || 0;
        return count > threshold;
      }
    }
    
    // Default to true for simple conditions
    return true;
  }

  /**
   * Find matching playbook
   */
  private findMatchingPlaybook(
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    eventType: string,
    mitreTechniques: string[]
  ): SecurityPlaybook | null {
    for (const playbook of this.playbooks.values()) {
      // Check severity match
      if (!playbook.triggers.severity.includes(severity)) {
        continue;
      }

      // Check event type match
      const hasEventMatch = playbook.triggers.eventTypes.includes(eventType) ||
                           playbook.triggers.eventTypes.includes('*');

      // Check MITRE technique match
      const hasMitreMatch = mitreTechniques.some(technique =>
        playbook.triggers.mitreTechniques.includes(technique)
      ) || playbook.triggers.mitreTechniques.includes('*');

      if (hasEventMatch || hasMitreMatch) {
        return playbook;
      }
    }

    return null;
  }

  /**
   * Add log entry
   */
  private addLog(
    execution: PlaybookExecution,
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    stepId?: string
  ): void {
    execution.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      stepId
    });

    // Keep log size reasonable
    if (execution.logs.length > 1000) {
      execution.logs = execution.logs.slice(-500);
    }
  }

  /**
   * Generate execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load default playbooks
   */
  private loadDefaultPlaybooks(): void {
    const defaultPlaybooks: SecurityPlaybook[] = [
      {
        id: 'web_attack_response',
        name: 'Web Application Attack Response',
        description: 'Automated response to web application attacks including SQL injection, XSS, and directory traversal',
        version: '1.0',
        author: 'AILYDIAN Security Team',
        triggers: {
          severity: ['MEDIUM', 'HIGH', 'CRITICAL'],
          eventTypes: ['web_attack', 'sql_injection', 'xss_attack', 'directory_traversal'],
          mitreTechniques: ['T1190']
        },
        variables: {
          block_duration: 3600,
          monitoring_level: 'high'
        },
        steps: [
          {
            id: 'step_1',
            name: 'Block Source IP',
            description: 'Block the attacking IP address via Cloudflare',
            type: 'automated',
            action: 'block_ip',
            timeout: 30,
            onSuccess: 'step_2',
            onFailure: 'step_manual_block',
            parameters: { duration: '${block_duration}' }
          },
          {
            id: 'step_2',
            name: 'Enable Enhanced Monitoring',
            description: 'Enable enhanced monitoring for the affected application',
            type: 'automated',
            action: 'enable_monitoring',
            timeout: 60,
            onSuccess: 'step_3',
            onFailure: 'step_notify',
            parameters: { level: '${monitoring_level}' }
          },
          {
            id: 'step_3',
            name: 'Create Emergency Backup',
            description: 'Create backup of critical application data',
            type: 'automated',
            action: 'create_backup',
            timeout: 300,
            onSuccess: 'step_notify',
            onFailure: 'step_notify',
            parameters: { priority: 'critical' }
          },
          {
            id: 'step_manual_block',
            name: 'Manual IP Block',
            description: 'Manually block IP address through firewall',
            type: 'manual',
            timeout: 900,
            onSuccess: 'step_2',
            parameters: {
              instructions: [
                'Access firewall management console',
                'Add blocking rule for source IP',
                'Verify rule is active'
              ]
            }
          },
          {
            id: 'step_notify',
            name: 'Notify Security Team',
            description: 'Send notification to security team',
            type: 'automated',
            action: 'notify_team',
            timeout: 10,
            parameters: { team: ['security', 'devops'] }
          }
        ],
        metadata: {
          created: '2024-01-01T00:00:00Z',
          updated: new Date().toISOString(),
          tags: ['web', 'attack', 'automated'],
          category: 'incident_response'
        }
      },
      {
        id: 'brute_force_response',
        name: 'Brute Force Attack Response',
        description: 'Automated response to brute force authentication attacks',
        version: '1.0',
        author: 'AILYDIAN Security Team',
        triggers: {
          severity: ['HIGH', 'CRITICAL'],
          eventTypes: ['brute_force', 'authentication_failed'],
          mitreTechniques: ['T1110']
        },
        variables: {
          lockout_duration: 1800,
          threshold: 5
        },
        steps: [
          {
            id: 'step_1',
            name: 'Check Attack Severity',
            description: 'Determine if attack meets critical threshold',
            type: 'decision',
            condition: 'event_count > ${threshold}',
            onSuccess: 'step_2',
            onFailure: 'step_monitor'
          },
          {
            id: 'step_2',
            name: 'Block Source IP',
            description: 'Block the attacking IP address',
            type: 'automated',
            action: 'block_ip',
            timeout: 30,
            onSuccess: 'step_3',
            onFailure: 'step_manual_response'
          },
          {
            id: 'step_3',
            name: 'Isolate Targeted User',
            description: 'Isolate the user account being targeted',
            type: 'automated',
            action: 'isolate_user',
            timeout: 60,
            onSuccess: 'step_notify',
            onFailure: 'step_notify'
          },
          {
            id: 'step_monitor',
            name: 'Monitor for Escalation',
            description: 'Continue monitoring for attack escalation',
            type: 'automated',
            action: 'enable_monitoring',
            timeout: 60,
            onSuccess: 'step_notify'
          },
          {
            id: 'step_manual_response',
            name: 'Manual Response Required',
            description: 'Automated response failed, manual intervention needed',
            type: 'manual',
            timeout: 1800,
            parameters: {
              instructions: [
                'Review attack patterns',
                'Implement manual blocking measures',
                'Coordinate with network team',
                'Consider emergency procedures'
              ]
            }
          },
          {
            id: 'step_notify',
            name: 'Notify Security Team',
            description: 'Send notification to security team with attack details',
            type: 'automated',
            action: 'notify_team',
            timeout: 10,
            parameters: { team: ['security', 'identity'] }
          }
        ],
        metadata: {
          created: '2024-01-01T00:00:00Z',
          updated: new Date().toISOString(),
          tags: ['authentication', 'brute_force', 'automated'],
          category: 'incident_response'
        }
      },
      {
        id: 'data_exfiltration_response',
        name: 'Data Exfiltration Response',
        description: 'Critical response to potential data exfiltration attempts',
        version: '1.0',
        author: 'AILYDIAN Security Team',
        triggers: {
          severity: ['CRITICAL'],
          eventTypes: ['data_exfiltration', 'large_download', 'unusual_data_access'],
          mitreTechniques: ['T1041', 'T1048']
        },
        variables: {
          critical_threshold: true
        },
        steps: [
          {
            id: 'step_1',
            name: 'Immediate User Isolation',
            description: 'Immediately isolate the user session',
            type: 'automated',
            action: 'isolate_user',
            timeout: 30,
            retries: 2,
            onSuccess: 'step_2',
            onFailure: 'step_emergency'
          },
          {
            id: 'step_2',
            name: 'Emergency Data Backup',
            description: 'Create immediate backup of affected systems',
            type: 'automated',
            action: 'create_backup',
            timeout: 600,
            onSuccess: 'step_3',
            onFailure: 'step_3'
          },
          {
            id: 'step_3',
            name: 'Legal Team Notification',
            description: 'Immediately notify legal and compliance teams',
            type: 'manual',
            timeout: 600,
            onSuccess: 'step_4',
            parameters: {
              instructions: [
                'Contact legal team immediately',
                'Prepare breach notification documentation',
                'Review regulatory requirements',
                'Coordinate with compliance officer'
              ]
            }
          },
          {
            id: 'step_4',
            name: 'Executive Notification',
            description: 'Notify executive team of critical incident',
            type: 'manual',
            timeout: 300,
            onSuccess: 'step_5',
            parameters: {
              instructions: [
                'Notify CTO and CEO immediately',
                'Prepare executive briefing',
                'Schedule emergency response meeting'
              ]
            }
          },
          {
            id: 'step_5',
            name: 'Forensic Analysis Preparation',
            description: 'Prepare systems for forensic analysis',
            type: 'manual',
            timeout: 1800,
            parameters: {
              instructions: [
                'Preserve system state for forensics',
                'Contact external forensic team',
                'Document all evidence',
                'Maintain chain of custody'
              ]
            }
          },
          {
            id: 'step_emergency',
            name: 'Emergency Manual Response',
            description: 'Critical manual response when automation fails',
            type: 'manual',
            timeout: 900,
            parameters: {
              instructions: [
                'Manually disconnect affected systems',
                'Contact emergency response team',
                'Implement emergency containment procedures',
                'Escalate to highest priority'
              ]
            }
          }
        ],
        metadata: {
          created: '2024-01-01T00:00:00Z',
          updated: new Date().toISOString(),
          tags: ['data_breach', 'critical', 'legal'],
          category: 'critical_response'
        }
      }
    ];

    defaultPlaybooks.forEach(playbook => {
      this.playbooks.set(playbook.id, playbook);
    });
  }

  /**
   * Get all playbooks
   */
  getPlaybooks(): SecurityPlaybook[] {
    return Array.from(this.playbooks.values());
  }

  /**
   * Get playbook by ID
   */
  getPlaybook(id: string): SecurityPlaybook | null {
    return this.playbooks.get(id) || null;
  }

  /**
   * Get execution by ID
   */
  getExecution(id: string): PlaybookExecution | null {
    return this.executions.get(id) || null;
  }

  /**
   * Get all executions
   */
  getExecutions(): PlaybookExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Cancel execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'RUNNING') {
      return false;
    }

    execution.status = 'CANCELLED';
    execution.endTime = new Date().toISOString();
    this.addLog(execution, 'INFO', 'Playbook execution cancelled by user');
    
    return true;
  }

  /**
   * Add custom playbook
   */
  addPlaybook(playbook: SecurityPlaybook): void {
    this.playbooks.set(playbook.id, playbook);
  }

  /**
   * Remove playbook
   */
  removePlaybook(id: string): boolean {
    return this.playbooks.delete(id);
  }
}

// Singleton instance
export const playbooks = Playbooks.getInstance();
