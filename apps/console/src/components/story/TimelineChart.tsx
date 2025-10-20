/**
 * Timeline Chart Component
 * Visualizes story timeline with acts, events, and emotional arcs
 *
 * A11y: ARIA labels, keyboard navigation, color contrast
 */

'use client';

import { useState } from 'react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  emotion_index: number;
  moral_index: number;
  quest_id?: string;
}

interface Act {
  id: string;
  title: string;
  duration_hours: number;
  emotional_arc: string;
  central_conflict: string;
  events: TimelineEvent[];
}

interface TimelineData {
  acts: Act[];
}

export default function TimelineChart({ data }: { data: TimelineData }) {
  const [selectedAct, setSelectedAct] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Calculate total duration
  const totalDuration = data.acts.reduce((sum, act) => sum + act.duration_hours, 0);

  return (
    <div className="space-y-6">
      {/* Acts Timeline Bar */}
      <div className="relative">
        <div className="flex items-stretch h-24 gap-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {data.acts.map((act, index) => {
            const widthPercent = (act.duration_hours / totalDuration) * 100;
            const isSelected = selectedAct === act.id;

            return (
              <button
                key={act.id}
                onClick={() => setSelectedAct(selectedAct === act.id ? null : act.id)}
                className={`relative flex flex-col justify-center px-4 transition-all ${
                  isSelected
                    ? 'bg-lydian-gold text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={{ width: `${widthPercent}%` }}
                aria-label={`Act ${index + 1}: ${act.title}`}
                aria-pressed={isSelected}
              >
                <div className="text-xs font-semibold uppercase opacity-75">
                  {act.id === 'prologue' ? 'Prologue' : act.id === 'finale' ? 'Finale' : `Act ${index}`}
                </div>
                <div className="text-sm font-bold">{act.title}</div>
                <div className="text-xs opacity-75">{act.duration_hours}h</div>
              </button>
            );
          })}
        </div>

        {/* Duration Legend */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-2 px-2">
          <span>0h</span>
          <span>{totalDuration}h total</span>
        </div>
      </div>

      {/* Selected Act Details */}
      {selectedAct && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {data.acts
            .filter((act) => act.id === selectedAct)
            .map((act) => (
              <div key={act.id} className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {act.title}
                  </h3>
                  <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-semibold">Duration:</span> {act.duration_hours} hours
                    </div>
                    <div>
                      <span className="font-semibold">Emotional Arc:</span> {act.emotional_arc}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    <span className="font-semibold">Central Conflict:</span> {act.central_conflict}
                  </p>
                </div>

                {/* Events List */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Key Events ({act.events.length})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {act.events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {event.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {event.timestamp} • Quest: {event.quest_id || 'N/A'}
                            </div>
                          </div>

                          {/* Emotion/Moral Indicators */}
                          <div className="flex gap-2 ml-4">
                            <div
                              className="w-12 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                backgroundColor: getEmotionColor(event.emotion_index),
                                color: '#000'
                              }}
                              title={`Emotion: ${event.emotion_index.toFixed(2)}`}
                            >
                              E
                            </div>
                            <div
                              className="w-12 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{
                                backgroundColor: getMoralColor(event.moral_index),
                                color: '#fff'
                              }}
                              title={`Moral: ${event.moral_index.toFixed(2)}`}
                            >
                              M
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="p-6 bg-lydian-gold/5 rounded-lg border border-lydian-gold/20">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {selectedEvent.title}
            </h4>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close event details"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Timestamp:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedEvent.timestamp}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Quest ID:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedEvent.quest_id || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Emotion Index:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedEvent.emotion_index.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Moral Index:</span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedEvent.moral_index.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="font-semibold">Indices:</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#90EE90' }} />
          <span>E: Emotion (0-1, calm to intense)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#4169E1' }} />
          <span>M: Moral (-1 to +1, dark to light)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Get emotion color based on intensity (0-1)
 * Calm (green) → Tense (yellow) → Intense (red)
 */
function getEmotionColor(value: number): string {
  if (value <= 0.3) return '#90EE90'; // Light green
  if (value <= 0.6) return '#FFD700'; // Gold
  return '#FF6B6B'; // Coral red
}

/**
 * Get moral color based on alignment (-1 to +1)
 * Dark/Morally Complex (red) → Neutral (purple) → Light/Heroic (blue)
 */
function getMoralColor(value: number): string {
  if (value <= -0.3) return '#DC143C'; // Crimson
  if (value <= 0.3) return '#9370DB'; // Medium purple
  return '#4169E1'; // Royal blue
}
