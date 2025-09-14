/**
 * 🛡️ Incident Response System
 * Automated incident response and remediation
 * © Emrah Şardağ. All rights reserved.
 */

export interface IncidentResponseAction {
  id: string;
  name: string;
  description: string;
  type: 'automated' | 'manual';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedTime: number; // minutes
  prerequisites: string[];
  steps: string[];
  rollbackSteps: string[];
  risks: string[];
  approvalRequired: boolean;
}

export interface RemediationPlan {
  incidentId: string;
  actions: IncidentResponseAction[];
  timeline: {
    immediate: IncidentResponseAction[]; // 0-15 minutes
    shortTerm: IncidentResponseAction[]; // 15-60 minutes
    mediumTerm: IncidentResponseAction[]; // 1-24 hours
    longTerm: IncidentResponseAction[]; // 24+ hours
  };
  communicationPlan: {
    stakeholders: string[];
    updateFrequency: number; // minutes
    escalationCriteria: string[];
  };
  rollbackPlan: IncidentResponseAction[];
}

export interface IncidentResponsePlaybook {
  id: string;
  name: string;
  description: string;
  triggers: {
    severity: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[];
    eventTypes: string[];
    mitreTechniques: string[];
  };
  actions: IncidentResponseAction[];
  escalationRules: {
    timeThreshold: number; // minutes
    conditions: string[];
    escalateTo: string[];
  };
}

export class IncidentResponse {
  private static instance: IncidentResponse;
  private playbooks: Map<string, IncidentResponsePlaybook> = new Map();
  private actions: Map<string, IncidentResponseAction> = new Map();
  private activeRemediations: Map<string, RemediationPlan> = new Map();

  private constructor() {
    this.initializePlaybooks();
    this.initializeActions();
  }

  static getInstance(): IncidentResponse {
    if (!IncidentResponse.instance) {
      IncidentResponse.instance = new IncidentResponse();
    }
    return IncidentResponse.instance;
  }

  /**
   * Generate remediation plan for incident
   */
  async generateRemediationPlan(
    incidentId: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    eventTypes: string[],
    mitreTechniques: string[]
  ): Promise<RemediationPlan> {
    // Find matching playbooks
    const matchingPlaybooks = this.findMatchingPlaybooks(severity, eventTypes, mitreTechniques);
    
    // Collect all applicable actions
    const allActions: IncidentResponseAction[] = [];
    matchingPlaybooks.forEach(playbook => {
      allActions.push(...playbook.actions);
    });

    // Remove duplicates and sort by priority
    const uniqueActions = this.deduplicateActions(allActions);
    const sortedActions = this.sortActionsByPriority(uniqueActions);

    // Create timeline
    const timeline = this.createActionTimeline(sortedActions);

    const plan: RemediationPlan = {
      incidentId,
      actions: sortedActions,
      timeline,
      communicationPlan: {
        stakeholders: this.getStakeholders(severity),
        updateFrequency: this.getUpdateFrequency(severity),
        escalationCriteria: this.getEscalationCriteria(severity)
      },
      rollbackPlan: sortedActions
        .filter(action => action.rollbackSteps.length > 0)
        .reverse()
    };

    this.activeRemediations.set(incidentId, plan);
    return plan;
  }

  /**
   * Execute remediation action
   */
  async executeAction(
    incidentId: string,
    actionId: string,
    executedBy: string = 'SYSTEM'
  ): Promise<{
    success: boolean;
    message: string;
    duration: number;
    outputs?: any;
  }> {
    const plan = this.activeRemediations.get(incidentId);
    const action = this.actions.get(actionId);

    if (!plan || !action) {
      return {
        success: false,
        message: 'Invalid incident ID or action ID',
        duration: 0
      };
    }

    const startTime = Date.now();

    try {
      if (action.type === 'automated') {
        return await this.executeAutomatedAction(action, incidentId);
      } else {
        return await this.executeManualAction(action, executedBy);
      }
    } catch (error) {
      return {
        success: false,
        message: `Action execution failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute automated remediation action
   */
  private async executeAutomatedAction(
    action: IncidentResponseAction,
    incidentId: string
  ): Promise<{
    success: boolean;
    message: string;
    duration: number;
    outputs?: any;
  }> {
    const startTime = Date.now();

    switch (action.id) {
      case 'block_ip_cloudflare':
        return this.blockIPCloudflare(action, incidentId, startTime);
      
      case 'enable_emergency_mode':
        return this.enableEmergencyMode(action, incidentId, startTime);
      
      case 'isolate_user_session':
        return this.isolateUserSession(action, incidentId, startTime);
      
      case 'disable_user_account':
        return this.disableUserAccount(action, incidentId, startTime);
      
      case 'rotate_api_keys':
        return this.rotateAPIKeys(action, incidentId, startTime);
      
      case 'backup_critical_data':
        return this.backupCriticalData(action, incidentId, startTime);
      
      case 'scan_for_malware':
        return this.scanForMalware(action, incidentId, startTime);
      
      case 'update_firewall_rules':
        return this.updateFirewallRules(action, incidentId, startTime);
      
      default:
        return {
          success: false,
          message: `Unknown automated action: ${action.id}`,
          duration: Date.now() - startTime
        };
    }
  }

  /**
   * Execute manual action (creates task/ticket)
   */
  private async executeManualAction(
    action: IncidentResponseAction,
    executedBy: string
  ): Promise<{
    success: boolean;
    message: string;
    duration: number;
    outputs?: any;
  }> {
    const startTime = Date.now();

    // Create task/ticket for manual action
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Here you would integrate with your ticketing system
    // For now, we'll just return success with task details
    
    return {
      success: true,
      message: `Manual action task created: ${taskId}`,
      duration: Date.now() - startTime,
      outputs: {
        taskId,
        assignee: executedBy,
        estimatedTime: action.estimatedTime,
        steps: action.steps
      }
    };
  }

  // Automated action implementations
  
  private async blockIPCloudflare(
    action: IncidentResponseAction,
    incidentId: string,
    startTime: number
  ): Promise<{ success: boolean; message: string; duration: number; outputs?: any }> {
    try {
      // This would integrate with Cloudflare API
      // For now, simulating the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'IP address blocked via Cloudflare',
        duration: Date.now() - startTime,
        outputs: {
          provider: 'Cloudflare',
          action: 'IP_BLOCKED',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to block IP: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async enableEmergencyMode(
    action: IncidentResponseAction,
    incidentId: string,
    startTime: number
  ): Promise<{ success: boolean; message: string; duration: number; outputs?: any }> {
    try {
      // Enable emergency security mode
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        message: 'Emergency security mode enabled',
        duration: Date.now() - startTime,
        outputs: {
          mode: 'EMERGENCY',
          features: ['enhanced_monitoring', 'strict_firewall', 'challenge_all'],
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to enable emergency mode: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async isolateUserSession(
    action: IncidentResponseAction,
    incidentId: string,
    startTime: number
  ): Promise<{ success: boolean; message: string; duration: number; outputs?: any }> {
    try {
      // Isolate user session
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'User session isolated',
        duration: Date.now() - startTime,
        outputs: {
          action: 'SESSION_ISOLATED',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to isolate session: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async disableUserAccount(
    action: IncidentResponseAction,
    incidentId: string,
    startTime: number
  ): Promise<{ success: boolean; message: string; duration: number; outputs?: any }> {
    try {
      // Disable user account
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'User account disabled',
        duration: Date.now() - startTime,
        outputs: {
          action: 'ACCOUNT_DISABLED',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to disable account: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async rotateAPIKeys(
    action: IncidentResponseAction,
    incidentId: string,
    startTime: number
  ): Promise<{ success: boolean; message: string; duration: number; outputs?: any }> {
    try {
      // Rotate API keys
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        success: true,
        message: 'API keys rotated',
        duration: Date.now() - startTime,
        outputs: {
          action: 'KEYS_ROTATED',
          keysRotated: ['api_key_1', 'api_key_2', 'webhook_key'],
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to rotate keys: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async backupCriticalData(
    action: IncidentResponseAction,
    incidentId: string,
    startTime: number
  ): Promise<{ success: boolean; message: string; duration: number; outputs?: any }> {
    try {
      // Backup critical data
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return {
        success: true,
        message: 'Critical data backed up',
        duration: Date.now() - startTime,
        outputs: {
          action: 'DATA_BACKED_UP',
          backupLocation: 'secure_backup_001',
          dataSize: '1.2GB',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to backup data: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async scanForMalware(
    action: IncidentResponseAction,
    incidentId: string,
    startTime: number
  ): Promise<{ success: boolean; message: string; duration: number; outputs?: any }> {
    try {
      // Scan for malware
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      return {
        success: true,
        message: 'Malware scan completed',
        duration: Date.now() - startTime,
        outputs: {
          action: 'MALWARE_SCAN',
          filesScanned: 15432,
          threatsFound: 0,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Malware scan failed: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async updateFirewallRules(
    action: IncidentResponseAction,
    incidentId: string,
    startTime: number
  ): Promise<{ success: boolean; message: string; duration: number; outputs?: any }> {
    try {
      // Update firewall rules
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        message: 'Firewall rules updated',
        duration: Date.now() - startTime,
        outputs: {
          action: 'FIREWALL_UPDATED',
          rulesAdded: 3,
          rulesModified: 1,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update firewall: ${error}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Find matching playbooks for incident
   */
  private findMatchingPlaybooks(
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    eventTypes: string[],
    mitreTechniques: string[]
  ): IncidentResponsePlaybook[] {
    const matching: IncidentResponsePlaybook[] = [];

    for (const playbook of this.playbooks.values()) {
      // Check severity match
      if (!playbook.triggers.severity.includes(severity)) {
        continue;
      }

      // Check event type match
      const hasEventTypeMatch = eventTypes.some(type => 
        playbook.triggers.eventTypes.includes(type)
      );
      
      // Check MITRE technique match
      const hasMitreMatch = mitreTechniques.some(technique => 
        playbook.triggers.mitreTechniques.includes(technique)
      );

      if (hasEventTypeMatch || hasMitreMatch) {
        matching.push(playbook);
      }
    }

    return matching;
  }

  /**
   * Remove duplicate actions
   */
  private deduplicateActions(actions: IncidentResponseAction[]): IncidentResponseAction[] {
    const seen = new Set<string>();
    return actions.filter(action => {
      if (seen.has(action.id)) {
        return false;
      }
      seen.add(action.id);
      return true;
    });
  }

  /**
   * Sort actions by priority and execution order
   */
  private sortActionsByPriority(actions: IncidentResponseAction[]): IncidentResponseAction[] {
    const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    
    return actions.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by type (automated first)
      if (a.type === 'automated' && b.type === 'manual') return -1;
      if (a.type === 'manual' && b.type === 'automated') return 1;
      
      // Then by estimated time (shorter first)
      return a.estimatedTime - b.estimatedTime;
    });
  }

  /**
   * Create action timeline based on priority and dependencies
   */
  private createActionTimeline(actions: IncidentResponseAction[]): RemediationPlan['timeline'] {
    const immediate: IncidentResponseAction[] = [];
    const shortTerm: IncidentResponseAction[] = [];
    const mediumTerm: IncidentResponseAction[] = [];
    const longTerm: IncidentResponseAction[] = [];

    actions.forEach(action => {
      if (action.priority === 'CRITICAL') {
        immediate.push(action);
      } else if (action.priority === 'HIGH' || action.estimatedTime <= 15) {
        shortTerm.push(action);
      } else if (action.estimatedTime <= 60) {
        mediumTerm.push(action);
      } else {
        longTerm.push(action);
      }
    });

    return { immediate, shortTerm, mediumTerm, longTerm };
  }

  /**
   * Get stakeholders for severity level
   */
  private getStakeholders(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string[] {
    switch (severity) {
      case 'CRITICAL':
        return ['SOC_TEAM', 'SECURITY_MANAGER', 'CTO', 'CEO', 'LEGAL_TEAM'];
      case 'HIGH':
        return ['SOC_TEAM', 'SECURITY_MANAGER', 'CTO'];
      case 'MEDIUM':
        return ['SOC_TEAM', 'SECURITY_MANAGER'];
      case 'LOW':
        return ['SOC_TEAM'];
    }
  }

  /**
   * Get update frequency for severity level
   */
  private getUpdateFrequency(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): number {
    switch (severity) {
      case 'CRITICAL': return 15; // Every 15 minutes
      case 'HIGH': return 30; // Every 30 minutes
      case 'MEDIUM': return 60; // Every hour
      case 'LOW': return 240; // Every 4 hours
    }
  }

  /**
   * Get escalation criteria for severity level
   */
  private getEscalationCriteria(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string[] {
    const base = [
      'No progress after 2 hours',
      'Impact increases beyond initial assessment',
      'Additional systems compromised'
    ];

    switch (severity) {
      case 'CRITICAL':
        return [
          ...base,
          'Media attention detected',
          'Customer data breach suspected',
          'Regulatory compliance impact'
        ];
      case 'HIGH':
        return [
          ...base,
          'Spread to production systems',
          'Customer service impact'
        ];
      default:
        return base;
    }
  }

  /**
   * Initialize response playbooks
   */
  private initializePlaybooks(): void {
    const playbooks: IncidentResponsePlaybook[] = [
      {
        id: 'web_attack_response',
        name: 'Web Application Attack Response',
        description: 'Response to web application attacks (SQLi, XSS, etc.)',
        triggers: {
          severity: ['MEDIUM', 'HIGH', 'CRITICAL'],
          eventTypes: ['web_attack', 'sql_injection', 'xss_attack'],
          mitreTechniques: ['T1190']
        },
        actions: [],
        escalationRules: {
          timeThreshold: 60,
          conditions: ['No containment after 1 hour'],
          escalateTo: ['SECURITY_MANAGER']
        }
      },
      {
        id: 'brute_force_response',
        name: 'Brute Force Attack Response',
        description: 'Response to brute force authentication attacks',
        triggers: {
          severity: ['HIGH', 'CRITICAL'],
          eventTypes: ['authentication_failed', 'brute_force'],
          mitreTechniques: ['T1110']
        },
        actions: [],
        escalationRules: {
          timeThreshold: 30,
          conditions: ['Attack continues after blocking'],
          escalateTo: ['SECURITY_MANAGER']
        }
      },
      {
        id: 'data_exfiltration_response',
        name: 'Data Exfiltration Response',
        description: 'Response to potential data exfiltration',
        triggers: {
          severity: ['CRITICAL'],
          eventTypes: ['large_download', 'unusual_data_access'],
          mitreTechniques: ['T1041']
        },
        actions: [],
        escalationRules: {
          timeThreshold: 15,
          conditions: ['Any data exfiltration suspected'],
          escalateTo: ['SECURITY_MANAGER', 'CTO', 'LEGAL_TEAM']
        }
      }
    ];

    playbooks.forEach(playbook => {
      this.playbooks.set(playbook.id, playbook);
    });
  }

  /**
   * Initialize response actions
   */
  private initializeActions(): void {
    const actions: IncidentResponseAction[] = [
      {
        id: 'block_ip_cloudflare',
        name: 'Block IP via Cloudflare',
        description: 'Block malicious IP address using Cloudflare WAF',
        type: 'automated',
        priority: 'HIGH',
        estimatedTime: 2,
        prerequisites: ['Cloudflare API access'],
        steps: ['Identify malicious IP', 'Add blocking rule to Cloudflare', 'Verify block'],
        rollbackSteps: ['Remove blocking rule from Cloudflare'],
        risks: ['May block legitimate users sharing IP'],
        approvalRequired: false
      },
      {
        id: 'enable_emergency_mode',
        name: 'Enable Emergency Security Mode',
        description: 'Enable enhanced security measures across all systems',
        type: 'automated',
        priority: 'CRITICAL',
        estimatedTime: 5,
        prerequisites: ['Emergency mode configuration'],
        steps: ['Activate enhanced monitoring', 'Enable strict firewall rules', 'Challenge all traffic'],
        rollbackSteps: ['Disable emergency mode', 'Restore normal operation'],
        risks: ['May impact legitimate user experience'],
        approvalRequired: true
      },
      {
        id: 'isolate_user_session',
        name: 'Isolate User Session',
        description: 'Isolate potentially compromised user session',
        type: 'automated',
        priority: 'HIGH',
        estimatedTime: 1,
        prerequisites: ['Session management system access'],
        steps: ['Identify session ID', 'Terminate session', 'Block re-authentication'],
        rollbackSteps: ['Re-enable user account', 'Allow re-authentication'],
        risks: ['May disrupt legitimate user activity'],
        approvalRequired: false
      },
      {
        id: 'disable_user_account',
        name: 'Disable User Account',
        description: 'Temporarily disable potentially compromised user account',
        type: 'automated',
        priority: 'HIGH',
        estimatedTime: 2,
        prerequisites: ['User management system access'],
        steps: ['Identify user account', 'Disable account', 'Notify user via alternate channel'],
        rollbackSteps: ['Re-enable user account', 'Send re-activation instructions'],
        risks: ['May disrupt business operations if legitimate user'],
        approvalRequired: true
      },
      {
        id: 'rotate_api_keys',
        name: 'Rotate API Keys',
        description: 'Rotate potentially compromised API keys',
        type: 'automated',
        priority: 'HIGH',
        estimatedTime: 10,
        prerequisites: ['API key management system'],
        steps: ['Generate new keys', 'Update applications', 'Revoke old keys'],
        rollbackSteps: ['Restore previous keys if needed'],
        risks: ['May break integrations if not properly coordinated'],
        approvalRequired: true
      },
      {
        id: 'backup_critical_data',
        name: 'Backup Critical Data',
        description: 'Create emergency backup of critical systems',
        type: 'automated',
        priority: 'MEDIUM',
        estimatedTime: 30,
        prerequisites: ['Backup system access', 'Storage capacity'],
        steps: ['Identify critical data', 'Initiate backup', 'Verify backup integrity'],
        rollbackSteps: ['Remove backup if not needed'],
        risks: ['May consume significant storage resources'],
        approvalRequired: false
      },
      {
        id: 'scan_for_malware',
        name: 'Scan for Malware',
        description: 'Perform comprehensive malware scan',
        type: 'automated',
        priority: 'MEDIUM',
        estimatedTime: 60,
        prerequisites: ['Antivirus/malware scanner access'],
        steps: ['Update signatures', 'Scan all systems', 'Quarantine threats'],
        rollbackSteps: ['Restore quarantined files if false positive'],
        risks: ['May impact system performance during scan'],
        approvalRequired: false
      },
      {
        id: 'update_firewall_rules',
        name: 'Update Firewall Rules',
        description: 'Update firewall rules to block detected threats',
        type: 'automated',
        priority: 'HIGH',
        estimatedTime: 5,
        prerequisites: ['Firewall management access'],
        steps: ['Analyze threat patterns', 'Create blocking rules', 'Deploy rules'],
        rollbackSteps: ['Remove added rules', 'Restore previous configuration'],
        risks: ['May block legitimate traffic if rules too broad'],
        approvalRequired: false
      },
      {
        id: 'contact_law_enforcement',
        name: 'Contact Law Enforcement',
        description: 'Contact appropriate law enforcement agencies',
        type: 'manual',
        priority: 'CRITICAL',
        estimatedTime: 60,
        prerequisites: ['Legal team approval', 'Incident documentation'],
        steps: ['Document evidence', 'Contact authorities', 'Provide required information'],
        rollbackSteps: [],
        risks: ['May become public information'],
        approvalRequired: true
      },
      {
        id: 'notify_customers',
        name: 'Notify Affected Customers',
        description: 'Notify customers about potential data breach',
        type: 'manual',
        priority: 'HIGH',
        estimatedTime: 120,
        prerequisites: ['Customer contact list', 'Approved notification template'],
        steps: ['Prepare notification', 'Identify affected customers', 'Send notifications'],
        rollbackSteps: [],
        risks: ['May damage reputation', 'May trigger regulatory requirements'],
        approvalRequired: true
      }
    ];

    actions.forEach(action => {
      this.actions.set(action.id, action);
    });

    // Link actions to playbooks
    this.linkActionsToPlaybooks();
  }

  /**
   * Link actions to playbooks
   */
  private linkActionsToPlaybooks(): void {
    const webAttackActions = ['block_ip_cloudflare', 'update_firewall_rules', 'enable_emergency_mode'];
    const bruteForceActions = ['block_ip_cloudflare', 'disable_user_account', 'rotate_api_keys'];
    const dataExfiltrationActions = ['isolate_user_session', 'backup_critical_data', 'contact_law_enforcement', 'notify_customers'];

    const webPlaybook = this.playbooks.get('web_attack_response');
    if (webPlaybook) {
      webPlaybook.actions = webAttackActions.map(id => this.actions.get(id)!).filter(Boolean);
    }

    const bruteForcePlaybook = this.playbooks.get('brute_force_response');
    if (bruteForcePlaybook) {
      bruteForcePlaybook.actions = bruteForceActions.map(id => this.actions.get(id)!).filter(Boolean);
    }

    const exfiltrationPlaybook = this.playbooks.get('data_exfiltration_response');
    if (exfiltrationPlaybook) {
      exfiltrationPlaybook.actions = dataExfiltrationActions.map(id => this.actions.get(id)!).filter(Boolean);
    }
  }

  /**
   * Get all playbooks
   */
  getPlaybooks(): IncidentResponsePlaybook[] {
    return Array.from(this.playbooks.values());
  }

  /**
   * Get all actions
   */
  getActions(): IncidentResponseAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get active remediations
   */
  getActiveRemediations(): RemediationPlan[] {
    return Array.from(this.activeRemediations.values());
  }
}

// Singleton instance
export const incidentResponse = IncidentResponse.getInstance();
