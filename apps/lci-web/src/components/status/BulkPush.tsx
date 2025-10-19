'use client';

import React, { useState } from 'react';

export default function BulkPush() {
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  const [pushing, setPushing] = useState(false);

  const handlePushToSlack = async () => {
    setPushing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Incidents pushed to Slack successfully!');
    setPushing(false);
  };

  const handlePushToJira = async () => {
    setPushing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Incidents created in Jira successfully!');
    setPushing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Push to External Systems</h3>

      <div className="flex items-center gap-4">
        <button
          onClick={handlePushToSlack}
          disabled={pushing}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pushing ? 'Pushing...' : 'Push to Slack'}
        </button>

        <button
          onClick={handlePushToJira}
          disabled={pushing}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pushing ? 'Creating...' : 'Create Jira Tickets'}
        </button>

        <div className="flex-1 text-right text-sm text-gray-600">
          Integrations: Slack, Jira, PagerDuty
        </div>
      </div>

      <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-sm text-blue-800">
          <strong>Pro Tip:</strong> Auto-push is enabled for SEV-1 incidents. Manual push available for SEV-2/3.
        </div>
      </div>
    </div>
  );
}
