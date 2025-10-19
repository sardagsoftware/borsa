'use client';
import React, { useState, useEffect } from 'react';
import type { Incident } from './types';

type PushTarget = 'slack' | 'jira';
type PushStatus = 'idle' | 'sending' | 'success' | 'error';

export default function BulkPush() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [slackStatus, setSlackStatus] = useState<PushStatus>('idle');
  const [jiraStatus, setJiraStatus] = useState<PushStatus>('idle');
  const [slackWebhook, setSlackWebhook] = useState('');
  const [jiraUrl, setJiraUrl] = useState('');

  useEffect(() => {
    const loadIncidents = () => {
      const stored = localStorage.getItem('incidentLog');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setIncidents(parsed.filter((inc: Incident) => !inc.slackPushed && !inc.jiraPushed));
        } catch (err) {
          console.error('Failed to parse incidents:', err);
        }
      }
    };

    loadIncidents();
    const interval = setInterval(loadIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(incidents.map(inc => inc.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const pushToSlack = async () => {
    if (selectedIds.size === 0 || !slackWebhook) return;

    setSlackStatus('sending');

    const selectedIncidents = incidents.filter(inc => selectedIds.has(inc.id));
    const message = formatSlackMessage(selectedIncidents);

    try {
      // Simulate Slack API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Slack message sent:', message);

      // Update incidents
      selectedIncidents.forEach(inc => {
        inc.slackPushed = true;
      });

      localStorage.setItem('incidentLog', JSON.stringify(incidents));

      setSlackStatus('success');
      setTimeout(() => setSlackStatus('idle'), 3000);
      clearSelection();
    } catch (err) {
      console.error('Slack push failed:', err);
      setSlackStatus('error');
      setTimeout(() => setSlackStatus('idle'), 3000);
    }
  };

  const pushToJira = async () => {
    if (selectedIds.size === 0 || !jiraUrl) return;

    setJiraStatus('sending');

    const selectedIncidents = incidents.filter(inc => selectedIds.has(inc.id));

    try {
      // Simulate Jira API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Jira tickets created for:', selectedIncidents);

      // Update incidents
      selectedIncidents.forEach(inc => {
        inc.jiraPushed = true;
      });

      localStorage.setItem('incidentLog', JSON.stringify(incidents));

      setJiraStatus('success');
      setTimeout(() => setJiraStatus('idle'), 3000);
      clearSelection();
    } catch (err) {
      console.error('Jira push failed:', err);
      setJiraStatus('error');
      setTimeout(() => setJiraStatus('idle'), 3000);
    }
  };

  const formatSlackMessage = (incs: Incident[]): string => {
    const sev1 = incs.filter(i => i.sev === 1).length;
    const sev2 = incs.filter(i => i.sev === 2).length;
    const sev3 = incs.filter(i => i.sev === 3).length;

    let msg = `🚨 *Bulk Incident Report* 🚨\n\n`;
    msg += `Total Incidents: ${incs.length}\n`;
    msg += `• SEV-1: ${sev1}\n`;
    msg += `• SEV-2: ${sev2}\n`;
    msg += `• SEV-3: ${sev3}\n\n`;
    msg += `*Details:*\n`;

    incs.forEach((inc, idx) => {
      msg += `${idx + 1}. [SEV-${inc.sev}] ${inc.target} - ${inc.tag}\n`;
      msg += `   ${inc.message}\n`;
      if (inc.rollback) {
        msg += `   ⚠️ *Rollback recommended*\n`;
      }
      msg += `\n`;
    });

    return msg;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Bulk Incident Push</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {selectedIds.size} / {incidents.length} selected
          </span>
          <button
            onClick={selectAll}
            disabled={incidents.length === 0}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Slack Configuration</h3>
          <input
            type="text"
            placeholder="Slack Webhook URL"
            value={slackWebhook}
            onChange={(e) => setSlackWebhook(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={pushToSlack}
            disabled={selectedIds.size === 0 || !slackWebhook || slackStatus === 'sending'}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {slackStatus === 'sending' ? 'Sending...' :
             slackStatus === 'success' ? '✓ Sent to Slack' :
             slackStatus === 'error' ? '✗ Failed' :
             `Push ${selectedIds.size} to Slack`}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Jira Configuration</h3>
          <input
            type="text"
            placeholder="Jira Project URL"
            value={jiraUrl}
            onChange={(e) => setJiraUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={pushToJira}
            disabled={selectedIds.size === 0 || !jiraUrl || jiraStatus === 'sending'}
            className="mt-4 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {jiraStatus === 'sending' ? 'Creating...' :
             jiraStatus === 'success' ? '✓ Created in Jira' :
             jiraStatus === 'error' ? '✗ Failed' :
             `Create ${selectedIds.size} Tickets`}
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === incidents.length && incidents.length > 0}
                    onChange={() => selectedIds.size === incidents.length ? clearSelection() : selectAll()}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
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
                  SEV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No unpushed incidents
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedIds.has(inc.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleSelect(inc.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(inc.id)}
                        onChange={() => toggleSelect(inc.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {new Date(inc.ts).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inc.target}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                        {inc.tag}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                        inc.sev === 1 ? 'bg-red-100 text-red-700 border-red-300' :
                        inc.sev === 2 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                        'bg-blue-100 text-blue-700 border-blue-300'
                      }`}>
                        SEV-{inc.sev}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inc.message}
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
