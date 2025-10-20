/**
 * Telemetry Tags Component
 * Displays LiveOps integration data, quest IDs, analytics schemas
 *
 * A11y: Semantic HTML, ARIA labels, keyboard navigation
 */

'use client';

import { useState } from 'react';

interface TelemetryData {
  quest_ids: Record<string, string[]>;
  emotion_moral_indices: {
    emotion_scale: string;
    moral_scale: string;
  };
  analytics_schema: Record<string, {
    event_name: string;
    properties: Record<string, string>;
  }>;
  ab_testing_hooks: {
    puzzle_difficulty: Record<string, any>;
    economy_tuning: Record<string, any>;
  };
  compliance: {
    kvkk: string[];
    gdpr: string[];
    pdpl: string[];
  };
}

export default function TelemetryTags({ data }: { data: TelemetryData }) {
  const [activeSection, setActiveSection] = useState<'quests' | 'analytics' | 'ab' | 'compliance'>('quests');
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [expandedAnalytic, setExpandedAnalytic] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'quests', label: 'Quest IDs', icon: '🎯' },
          { id: 'analytics', label: 'Analytics Schema', icon: '📊' },
          { id: 'ab', label: 'A/B Testing', icon: '🧪' },
          { id: 'compliance', label: 'Compliance', icon: '🔒' }
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeSection === section.id
                ? 'border-lydian-gold text-lydian-gold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            aria-label={section.label}
            aria-current={activeSection === section.id ? 'page' : undefined}
          >
            <span className="mr-2">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Quest IDs Section */}
      {activeSection === 'quests' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Quest IDs</strong> are used to track player progress through the narrative.
              Each act has multiple quests that correspond to story events.
            </p>
          </div>

          {Object.entries(data.quest_ids).map(([act, quests]) => {
            const isExpanded = expandedQuest === act;
            const title = act.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            return (
              <div
                key={act}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedQuest(isExpanded ? null : act)}
                  className="w-full text-left p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center justify-between"
                  aria-expanded={isExpanded}
                  aria-controls={`quests-${act}`}
                >
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {quests.length} quest{quests.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-2xl text-gray-400">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    id={`quests-${act}`}
                    className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid md:grid-cols-2 gap-2">
                      {quests.map((quest, i) => (
                        <div
                          key={i}
                          className="px-3 py-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm text-gray-700 dark:text-gray-300"
                        >
                          {quest}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Emotion & Moral Indices */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Emotion & Moral Indices
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                  Emotion Scale
                </h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {data.emotion_moral_indices.emotion_scale}
                </p>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                  Moral Scale
                </h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {data.emotion_moral_indices.moral_scale}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Schema Section */}
      {activeSection === 'analytics' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Analytics events</strong> track player interactions with the story.
              All events include anonymized user IDs and follow KVKK/GDPR/PDPL compliance.
            </p>
          </div>

          {Object.entries(data.analytics_schema).map(([key, schema]) => {
            const isExpanded = expandedAnalytic === key;
            const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            return (
              <div
                key={key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedAnalytic(isExpanded ? null : key)}
                  className="w-full text-left p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center justify-between"
                  aria-expanded={isExpanded}
                  aria-controls={`analytic-${key}`}
                >
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {schema.event_name}
                    </p>
                  </div>
                  <span className="text-2xl text-gray-400">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    id={`analytic-${key}`}
                    className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700"
                  >
                    <h5 className="text-sm font-semibold text-lydian-gold uppercase mb-3">
                      Properties
                    </h5>
                    <div className="space-y-2">
                      {Object.entries(schema.properties).map(([prop, type]) => (
                        <div
                          key={prop}
                          className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            {prop}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                            {type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* A/B Testing Section */}
      {activeSection === 'ab' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>A/B testing hooks</strong> allow for dynamic tuning of game mechanics
              without code changes. Tests are segmented and tracked through analytics.
            </p>
          </div>

          {/* Puzzle Difficulty */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🎯 Puzzle Difficulty Tuning
            </h4>
            <div className="space-y-3">
              {Object.entries(data.ab_testing_hooks.puzzle_difficulty).map(([key, config]) => {
                const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                return (
                  <div
                    key={key}
                    className="p-3 bg-gray-50 dark:bg-gray-750 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
                        {config.segment || 'All Users'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(config)
                        .filter(([k]) => k !== 'segment')
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{k}:</span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Economy Tuning */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              💰 Economy Tuning
            </h4>
            <div className="space-y-3">
              {Object.entries(data.ab_testing_hooks.economy_tuning).map(([key, config]) => {
                const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                return (
                  <div
                    key={key}
                    className="p-3 bg-gray-50 dark:bg-gray-750 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
                        {config.cohort || 'All Cohorts'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(config)
                        .filter(([k]) => k !== 'cohort')
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">{k}:</span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Compliance Section */}
      {activeSection === 'compliance' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Compliance requirements</strong> ensure all telemetry follows
              KVKK (Turkey), GDPR (EU), and PDPL (Turkey Personal Data Protection Law).
            </p>
          </div>

          {/* KVKK */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🇹🇷 KVKK (Kişisel Verilerin Korunması Kanunu)
            </h4>
            <ul className="space-y-2">
              {data.compliance.kvkk.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* GDPR */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🇪🇺 GDPR (General Data Protection Regulation)
            </h4>
            <ul className="space-y-2">
              {data.compliance.gdpr.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PDPL */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🔒 PDPL (Personal Data Protection Law)
            </h4>
            <ul className="space-y-2">
              {data.compliance.pdpl.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
