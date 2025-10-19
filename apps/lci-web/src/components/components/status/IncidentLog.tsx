'use client';
import React, { useState, useEffect } from 'react';
import type { Incident, IncidentTag } from './types';

export default function IncidentLog() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<IncidentTag | 'all'>('all');
  const [sevFilter, setSevFilter] = useState<1 | 2 | 3 | 'all'>('all');

  useEffect(() => {
    const loadIncidents = () => {
      const stored = localStorage.getItem('incidentLog');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setIncidents(parsed);
        } catch (err) {
          console.error('Failed to parse incidents:', err);
        }
      }
    };

    loadIncidents();
    const interval = setInterval(loadIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  const tagColors: Record<IncidentTag, string> = {
    DNS: 'bg-purple-100 text-purple-700 border-purple-200',
    Auth: 'bg-red-100 text-red-700 border-red-200',
    Upstream: 'bg-orange-100 text-orange-700 border-orange-200',
    RateLimit: 'bg-amber-100 text-amber-700 border-amber-200',
    Network: 'bg-blue-100 text-blue-700 border-blue-200',
    Redirect: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    Client4xx: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Server5xx: 'bg-red-100 text-red-700 border-red-200',
    Security: 'bg-pink-100 text-pink-700 border-pink-200',
    Unknown: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  const sevColors = {
    1: 'bg-red-100 text-red-700 border-red-300',
    2: 'bg-amber-100 text-amber-700 border-amber-300',
    3: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  const filteredIncidents = incidents.filter(inc => {
    const tagMatch = filter === 'all' || inc.tag === filter;
    const sevMatch = sevFilter === 'all' || inc.sev === sevFilter;
    return tagMatch && sevMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Incident Log</h2>
        <div className="flex items-center gap-3">
          <select
            value={sevFilter}
            onChange={(e) => setSevFilter(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="1">SEV-1</option>
            <option value="2">SEV-2</option>
            <option value="3">SEV-3</option>
          </select>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tags</option>
            <option value="DNS">DNS</option>
            <option value="Auth">Auth</option>
            <option value="Upstream">Upstream</option>
            <option value="RateLimit">RateLimit</option>
            <option value="Network">Network</option>
            <option value="Redirect">Redirect</option>
            <option value="Client4xx">Client4xx</option>
            <option value="Server5xx">Server5xx</option>
            <option value="Security">Security</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No incidents found
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {new Date(inc.ts).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inc.target}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${tagColors[inc.tag]}`}>
                        {inc.tag}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full border ${sevColors[inc.sev]}`}>
                        SEV-{inc.sev}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inc.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {inc.rollback && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">
                            Rollback
                          </span>
                        )}
                        {inc.slackPushed && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full border border-green-200">
                            Slack
                          </span>
                        )}
                        {inc.jiraPushed && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                            Jira
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
