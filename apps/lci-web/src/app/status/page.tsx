'use client';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          System Health Dashboard
        </h1>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Auto-Triage Agent
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-gray-700">Status: Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              System Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Services</span>
                <span className="font-bold text-gray-900">16</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Healthy</span>
                <span className="font-bold text-green-600">14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Warning</span>
                <span className="font-bold text-amber-600">2</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Performance Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="font-bold text-green-600">99.87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">P95 Latency</span>
                <span className="font-bold text-gray-900">847ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Incidents (24h)</span>
                <span className="font-bold text-amber-600">3</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Enterprise-Grade Monitoring
          </h2>
          <p className="text-blue-100">
            Real-time health checks, auto-triage, SLA tracking, and incident automation
          </p>
        </div>
      </div>
    </div>
  );
}
