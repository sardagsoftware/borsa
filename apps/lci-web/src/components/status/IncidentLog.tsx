'use client';

import React from 'react';
import useHealth from '../ui/useHealth';

export default function IncidentLog() {
  const { rows } = useHealth(60000);

  // Only show incidents (down or warn)
  const incidents = rows
    .filter(r => r.status === 'down' || r.status === 'warn')
    .slice(0, 10);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Incidents</h3>

      {incidents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✨</div>
          <div>No incidents detected</div>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident, i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    incident.status === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {incident.status === 'down' ? 'SEV-1' : 'SEV-3'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{incident.name}</span>
                </div>
                <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="text-sm text-gray-600">
                {incident.err || `High latency: ${incident.ms}ms`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
