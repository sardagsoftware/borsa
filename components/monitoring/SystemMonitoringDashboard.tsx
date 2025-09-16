/**
 * AILYDIAN System Monitoring Dashboard
 * Comprehensive monitoring for all microservices and system health
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Globe,
  RefreshCw
} from 'lucide-react';

// Types
interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastCheck: string;
  version?: string;
  details?: any;
}

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  active_connections: number;
  requests_per_minute: number;
  error_rate: number;
  uptime: number;
}

const SystemMonitoringDashboard: React.FC = () => {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Service endpoints to monitor
  const serviceEndpoints = [
    { name: 'Next.js App', url: '/api/health' },
    { name: 'Quantum-ML Service', url: '/api/quantum-ml/health' },
    { name: 'Social Sentiment Service', url: '/api/social-sentiment/health' },
    { name: 'News Intelligence Service', url: '/api/news-intelligence/health' },
    { name: 'Auto-Trader AI Service', url: '/api/auto-trader/health' }
  ];

  // Check service health
  const checkServiceHealth = async (service: { name: string; url: string }): Promise<ServiceHealth> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(service.url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      const responseTime = Date.now() - startTime;
      const data = response.ok ? await response.json() : null;
      
      return {
        name: service.name,
        url: service.url,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        version: data?.version || 'Unknown',
        details: data
      };
    } catch (error) {
      return {
        name: service.name,
        url: service.url,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  };

  // Check all services
  const checkAllServices = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const healthChecks = await Promise.all(
        serviceEndpoints.map(checkServiceHealth)
      );
      
      setServices(healthChecks);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error checking services:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Generate mock system metrics
  const generateSystemMetrics = useCallback((): SystemMetrics => {
    return {
      cpu_usage: Math.random() * 80 + 10,
      memory_usage: Math.random() * 70 + 20,
      disk_usage: Math.random() * 60 + 30,
      network_in: Math.random() * 100 + 50,
      network_out: Math.random() * 80 + 30,
      active_connections: Math.floor(Math.random() * 1000 + 100),
      requests_per_minute: Math.floor(Math.random() * 5000 + 1000),
      error_rate: Math.random() * 5,
      uptime: Math.floor(Math.random() * 86400 + 43200) // 12-24 hours
    };
  }, []);

  // Auto-refresh
  useEffect(() => {
    checkAllServices();
    setMetrics(generateSystemMetrics());
    
    const interval = setInterval(() => {
      checkAllServices();
      setMetrics(generateSystemMetrics());
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkAllServices, generateSystemMetrics]);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  // Get metric color
  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-400';
    if (value >= thresholds.warning) return 'text-yellow-400';
    return 'text-green-400';
  };

  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const totalServices = services.length;
  const avgResponseTime = services.length > 0 
    ? services.reduce((sum, s) => sum + s.responseTime, 0) / services.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              📊 System Monitoring
            </h1>
            <p className="text-slate-400 text-lg">AILYDIAN Global Trader - System Health Dashboard</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm text-slate-400">
              <p>Last Updated</p>
              <p className="font-mono">{lastUpdate.toLocaleTimeString()}</p>
            </div>
            
            <button
              onClick={checkAllServices}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Server className="w-8 h-8 text-blue-400" />
            <span className={`text-2xl font-bold ${healthyServices === totalServices ? 'text-green-400' : 'text-yellow-400'}`}>
              {healthyServices}/{totalServices}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Services Online</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-cyan-400">
              {avgResponseTime.toFixed(0)}ms
            </span>
          </div>
          <p className="text-slate-400 text-sm">Avg Response Time</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-green-400">
              {metrics?.requests_per_minute.toLocaleString() || '0'}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Requests/Min</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-8 h-8 text-purple-400" />
            <span className={`text-2xl font-bold ${getMetricColor(metrics?.error_rate || 0, { warning: 2, critical: 5 })}`}>
              {metrics?.error_rate.toFixed(1) || '0'}%
            </span>
          </div>
          <p className="text-slate-400 text-sm">Error Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Service Health */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Server className="w-6 h-6 mr-2 text-blue-400" />
            Service Health Status
          </h2>
          
          <div className="space-y-4">
            {services.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Loading service status...</p>
              </div>
            ) : (
              services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-600 bg-slate-700/50"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      <p className="text-sm text-slate-400">v{service.version}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-mono">
                        {service.responseTime}ms
                      </span>
                      {service.responseTime < 100 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Metrics */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-green-400" />
            System Metrics
          </h2>
          
          {metrics && (
            <div className="space-y-6">
              {/* CPU Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">CPU Usage</span>
                  </div>
                  <span className={`text-sm font-bold ${getMetricColor(metrics.cpu_usage, { warning: 70, critical: 85 })}`}>
                    {metrics.cpu_usage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.cpu_usage}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Memory Usage</span>
                  </div>
                  <span className={`text-sm font-bold ${getMetricColor(metrics.memory_usage, { warning: 75, critical: 90 })}`}>
                    {metrics.memory_usage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.memory_usage}%` }}
                  />
                </div>
              </div>

              {/* Network Activity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Wifi className="w-4 h-4 text-green-400" />
                    <span className="text-xs">Network In</span>
                  </div>
                  <p className="text-lg font-bold text-green-400">
                    {metrics.network_in.toFixed(1)} MB/s
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Globe className="w-4 h-4 text-orange-400" />
                    <span className="text-xs">Network Out</span>
                  </div>
                  <p className="text-lg font-bold text-orange-400">
                    {metrics.network_out.toFixed(1)} MB/s
                  </p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Active Connections</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {metrics.active_connections.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">System Uptime</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatUptime(metrics.uptime)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitoringDashboard;
