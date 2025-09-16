'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button, Pill as Badge } from '@/components/ui';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Server,
  Database,
  Zap,
  Users,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: any;
  lastCheck: string; // Changed from Date to string
  responseTime?: number;
}

interface SystemMetrics {
  uptime: number;
  memoryUsage: number;
  activeConnections: number;
  errorRate: number;
  throughput: number;
}

interface AdminDashboardProps {
  health?: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, HealthCheckResult>;
    metrics: SystemMetrics;
  };
  onRefresh?: () => void;
  onAutoFix?: () => void;
  onExportConfig?: () => void;
  onCreateSnapshot?: () => void;
}

const StatusIcon = ({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'unhealthy':
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
};

const StatusBadge = ({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) => {
  const variants = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    unhealthy: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <Badge 
      variant="default" 
      className={cn(variants[status], 'font-medium')}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + sizes[i];
};

export function AdminDashboard({ 
  health, 
  onRefresh, 
  onAutoFix, 
  onExportConfig, 
  onCreateSnapshot 
}: AdminDashboardProps) {
  const mockHealth = {
    overall: 'healthy' as const,
    services: {
      vault: {
        service: 'vault',
        status: 'healthy' as const,
        details: { encryptionKeys: 'ok', storage: 'ok' },
        lastCheck: new Date().toISOString(), // Convert to string
        responseTime: 45
      },
      trading: {
        service: 'trading',
        status: 'healthy' as const,
        details: { exchanges: 3, activeOrders: 12 },
        lastCheck: new Date().toISOString(), // Convert to string
        responseTime: 123
      },
      portfolio: {
        service: 'portfolio',
        status: 'degraded' as const,
        details: { accounts: 5, syncDelay: '2m' },
        lastCheck: new Date().toISOString(), // Convert to string
        responseTime: 267
      },
      telemetry: {
        service: 'telemetry',
        status: 'healthy' as const,
        details: { metrics: 'collecting', alerts: 'active' },
        lastCheck: new Date().toISOString(), // Convert to string
        responseTime: 89
      }
    },
    metrics: {
      uptime: 86400 * 3 + 3600 * 5 + 60 * 23, // 3 days, 5 hours, 23 minutes
      memoryUsage: 456.7,
      activeConnections: 127,
      errorRate: 0.8,
      throughput: 1247
    }
  };

  const currentHealth = health || mockHealth;
  const services = Object.entries(currentHealth.services);
  const healthyServices = services.filter(([_, service]) => service.status === 'healthy').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System health and management tools</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportConfig}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Config</span>
          </Button>
          
          <Button 
            size="sm" 
            onClick={onCreateSnapshot}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            <span>Create Snapshot</span>
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StatusIcon status={currentHealth.overall} />
              <span>System Status</span>
            </div>
            <StatusBadge status={currentHealth.overall} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {healthyServices}/{services.length}
              </div>
              <div className="text-sm text-gray-600">Services Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatUptime(currentHealth.metrics.uptime)}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {currentHealth.metrics.errorRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {currentHealth.metrics.activeConnections}
              </div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatBytes(currentHealth.metrics.memoryUsage * 1024 * 1024)}</span>
                <span>65%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '65%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Throughput</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {currentHealth.metrics.throughput.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">requests/min</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Response Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">127ms</div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              12% vs last hour
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Services Health</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAutoFix}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Auto Fix</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map(([name, service]) => (
              <div key={name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <StatusIcon status={service.status} />
                  <div>
                    <div className="font-medium capitalize">{service.service}</div>
                    <div className="text-sm text-gray-600">
                      Last check: {new Date(service.lastCheck).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {service.responseTime && (
                    <div className="text-sm text-gray-600">
                      {service.responseTime}ms
                    </div>
                  )}
                  <StatusBadge status={service.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto space-y-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Security Scan</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto space-y-2">
              <Database className="h-5 w-5" />
              <span className="text-sm">DB Backup</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto space-y-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">User Audit</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto space-y-2">
              <Clock className="h-5 w-5" />
              <span className="text-sm">System Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
