'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  AlertTriangle,
  Bell,
  BellOff,
  Plus,
  Settings,
  TrendingUp,
  TrendingDown,
  Zap,
  MessageSquare,
  Send,
  Target,
  DollarSign,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  isActive: boolean;
  channel: 'slack' | 'telegram' | 'email';
  severity: 'info' | 'warning' | 'critical';
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  status: 'normal' | 'warning' | 'critical';
  timestamp: Date;
}

interface AlertsMetricsProps {
  alerts?: AlertRule[];
  metrics?: SystemMetric[];
  onCreateAlert?: (alert: Omit<AlertRule, 'id' | 'createdAt' | 'triggerCount'>) => void;
  onToggleAlert?: (id: string, active: boolean) => void;
  onDeleteAlert?: (id: string) => void;
  onTestAlert?: (id: string) => void;
}

const mockAlerts: AlertRule[] = [
  {
    id: '1',
    name: 'High Error Rate',
    condition: 'error_rate > threshold',
    threshold: 5,
    isActive: true,
    channel: 'slack',
    severity: 'critical',
    createdAt: new Date('2024-01-15'),
    lastTriggered: new Date(Date.now() - 3600000), // 1 hour ago
    triggerCount: 3
  },
  {
    id: '2',
    name: 'Portfolio Loss Alert',
    condition: 'portfolio_loss > threshold',
    threshold: 10,
    isActive: true,
    channel: 'telegram',
    severity: 'warning',
    createdAt: new Date('2024-01-20'),
    triggerCount: 0
  },
  {
    id: '3',
    name: 'Large Position Alert',
    condition: 'position_size > threshold',
    threshold: 50000,
    isActive: false,
    channel: 'email',
    severity: 'info',
    createdAt: new Date('2024-02-01'),
    lastTriggered: new Date(Date.now() - 86400000), // 1 day ago
    triggerCount: 12
  }
];

const mockMetrics: SystemMetric[] = [
  {
    name: 'API Response Time',
    value: 145,
    unit: 'ms',
    change: -12.5,
    status: 'normal',
    timestamp: new Date()
  },
  {
    name: 'Error Rate',
    value: 2.3,
    unit: '%',
    change: 15.7,
    status: 'warning',
    timestamp: new Date()
  },
  {
    name: 'Orders Per Minute',
    value: 247,
    unit: 'orders/min',
    change: 8.2,
    status: 'normal',
    timestamp: new Date()
  },
  {
    name: 'Memory Usage',
    value: 67.8,
    unit: '%',
    change: 3.1,
    status: 'normal',
    timestamp: new Date()
  },
  {
    name: 'CPU Usage',
    value: 23.5,
    unit: '%',
    change: -5.2,
    status: 'normal',
    timestamp: new Date()
  },
  {
    name: 'Active Connections',
    value: 158,
    unit: 'connections',
    change: 12.0,
    status: 'normal',
    timestamp: new Date()
  }
];

const ALERT_CONDITIONS = [
  { value: 'error_rate > threshold', label: 'Error Rate Above' },
  { value: 'response_time > threshold', label: 'Response Time Above' },
  { value: 'portfolio_loss > threshold', label: 'Portfolio Loss Above' },
  { value: 'position_size > threshold', label: 'Position Size Above' },
  { value: 'memory_usage > threshold', label: 'Memory Usage Above' },
  { value: 'cpu_usage > threshold', label: 'CPU Usage Above' }
];

const CHANNELS = [
  { value: 'slack', label: 'Slack', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'telegram', label: 'Telegram', icon: <Send className="h-4 w-4" /> },
  { value: 'email', label: 'Email', icon: <Bell className="h-4 w-4" /> }
];

const SEVERITIES = [
  { value: 'info', label: 'Info', color: 'blue' },
  { value: 'warning', label: 'Warning', color: 'yellow' },
  { value: 'critical', label: 'Critical', color: 'red' }
];

export function AlertsMetrics({
  alerts = mockAlerts,
  metrics = mockMetrics,
  onCreateAlert,
  onToggleAlert,
  onDeleteAlert,
  onTestAlert
}: AlertsMetricsProps) {
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    condition: '',
    threshold: 0,
    isActive: true,
    channel: 'slack' as const,
    severity: 'warning' as const
  });

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const recentAlerts = alerts.filter(alert => 
    alert.lastTriggered && 
    Date.now() - alert.lastTriggered.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
        colors[severity as keyof typeof colors]
      )}>
        {severity}
      </span>
    );
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'ms') {
      return `${Math.round(value)}ms`;
    } else if (unit.includes('/')) {
      return `${Math.round(value)} ${unit}`;
    } else {
      return `${Math.round(value)} ${unit}`;
    }
  };

  const handleCreateAlert = () => {
    if (newAlert.name && newAlert.condition && newAlert.threshold > 0) {
      onCreateAlert?.(newAlert);
      setNewAlert({
        name: '',
        condition: '',
        threshold: 0,
        isActive: true,
        channel: 'slack',
        severity: 'warning'
      });
      setIsCreatingAlert(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts & Metrics</h1>
            <p className="text-gray-600">System monitoring and alert management</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
          
          <Button 
            size="sm" 
            onClick={() => setIsCreatingAlert(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Alert</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{activeAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Triggered (24h)</p>
                <p className="text-2xl font-bold text-gray-900">{recentAlerts.length}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">
                  {metrics.filter(m => m.status === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">98.5%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Alert Form */}
      {isCreatingAlert && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Name</label>
                <input
                  type="text"
                  placeholder="e.g., High Error Rate Alert"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Condition</option>
                  {ALERT_CONDITIONS.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={newAlert.channel}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, channel: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CHANNELS.map(channel => (
                    <option key={channel.value} value={channel.value}>
                      {channel.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={newAlert.severity}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SEVERITIES.map(severity => (
                    <option key={severity.value} value={severity.value}>
                      {severity.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCreatingAlert(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAlert}>
                Create Alert
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{metric.name}</span>
                  {getStatusIcon(metric.status)}
                </div>
                
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(metric.value, metric.unit)}
                  </span>
                  <span className={cn(
                    "text-sm font-medium flex items-center",
                    metric.change >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(metric.change).toFixed(1)}%
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  Updated: {metric.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {alert.isActive ? (
                      <Bell className="h-5 w-5 text-blue-500" />
                    ) : (
                      <BellOff className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{alert.name}</h3>
                      {getSeverityBadge(alert.severity)}
                      {!alert.isActive && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {alert.condition.replace('threshold', alert.threshold.toString())}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Channel: {alert.channel}</span>
                      <span>Triggers: {alert.triggerCount}</span>
                      {alert.lastTriggered && (
                        <span>Last: {alert.lastTriggered.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTestAlert?.(alert.id)}
                  >
                    Test
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onToggleAlert?.(alert.id, !alert.isActive)}
                  >
                    {alert.isActive ? <Pause className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteAlert?.(alert.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            
            {alerts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alert rules configured</p>
                <p className="text-sm">Create your first alert to monitor system metrics</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
