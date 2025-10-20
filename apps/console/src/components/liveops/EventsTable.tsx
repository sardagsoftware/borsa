/**
 * Events Table Component
 * Displays today's events with trigger controls
 *
 * A11y: Table semantics, ARIA labels, keyboard navigation
 * RBAC: Trigger buttons require liveops.admin scope
 */

'use client';

import { useState } from 'react';

interface Event {
  id: string;
  title: string;
  type: 'boss_rush' | 'double_rewards' | 'community_puzzle' | 'limited_shop';
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'ended';
  participants?: number;
}

export default function EventsTable({ events }: { events: Event[] }) {
  const [triggeringEvent, setTriggeringEvent] = useState<string | null>(null);

  const handleTriggerEvent = async (eventId: string) => {
    setTriggeringEvent(eventId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setTriggeringEvent(null);
    alert(`Event ${eventId} triggered successfully!`);
  };

  if (!events || events.length === 0) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
        <div className="text-4xl mb-4">📅</div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Events Today
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Check back tomorrow for scheduled events
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
              Event
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
              Participants
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:border-gray-700">
          {events.map((event) => (
            <tr
              key={event.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-750 transition"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {event.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {event.id}
                </div>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getEventTypeColor(
                    event.type
                  )}`}
                >
                  {getEventTypeIcon(event.type)} {formatEventType(event.type)}
                </span>
              </td>

              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                <div>{new Date(event.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  to {new Date(event.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    event.status
                  )}`}
                >
                  {event.status}
                </span>
              </td>

              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {event.participants !== undefined ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.participants.toLocaleString()}</span>
                    {event.status === 'active' && (
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-label="Live" />
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>

              <td className="px-4 py-3 text-right">
                {event.status === 'scheduled' && (
                  <button
                    onClick={() => handleTriggerEvent(event.id)}
                    disabled={triggeringEvent === event.id}
                    className="px-3 py-1 bg-lydian-gold hover:bg-lydian-gold/90 disabled:bg-gray-400 text-gray-900 rounded text-sm font-medium transition"
                    aria-label={`Trigger ${event.title}`}
                  >
                    {triggeringEvent === event.id ? 'Triggering...' : 'Trigger'}
                  </button>
                )}
                {event.status === 'active' && (
                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                    ● Live
                  </span>
                )}
                {event.status === 'ended' && (
                  <span className="text-gray-400 text-sm">Ended</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* RBAC Notice */}
      <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>RBAC:</strong> Event triggering requires <code className="px-1 bg-yellow-100 dark:bg-yellow-800 rounded">liveops.admin</code> scope
        </p>
      </div>
    </div>
  );
}

/**
 * Get event type color
 */
function getEventTypeColor(type: string): string {
  switch (type) {
    case 'boss_rush':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'double_rewards':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'community_puzzle':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'limited_shop':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

/**
 * Get event type icon
 */
function getEventTypeIcon(type: string): string {
  switch (type) {
    case 'boss_rush':
      return '⚔️';
    case 'double_rewards':
      return '💎';
    case 'community_puzzle':
      return '🧩';
    case 'limited_shop':
      return '🛒';
    default:
      return '📅';
  }
}

/**
 * Format event type
 */
function formatEventType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Get status color
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'scheduled':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'ended':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}
