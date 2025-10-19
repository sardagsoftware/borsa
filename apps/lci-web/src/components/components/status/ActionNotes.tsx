'use client';
import React, { useState } from 'react';
import { getActionNotes } from './IncidentClassifier';
import type { IncidentTag } from './types';

type ActionNotesProps = {
  tag: IncidentTag;
  onCopyToClipboard?: () => void;
};

export default function ActionNotes({ tag, onCopyToClipboard }: ActionNotesProps) {
  const [copied, setCopied] = useState(false);
  const notes = getActionNotes(tag);

  const copyToClipboard = () => {
    const text = `${tag} Incident - Action Notes:\n\n${notes.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopyToClipboard?.();
  };

  const tagColors: Record<IncidentTag, string> = {
    DNS: 'from-purple-500 to-purple-600',
    Auth: 'from-red-500 to-red-600',
    Upstream: 'from-orange-500 to-orange-600',
    RateLimit: 'from-amber-500 to-amber-600',
    Network: 'from-blue-500 to-blue-600',
    Redirect: 'from-cyan-500 to-cyan-600',
    Client4xx: 'from-yellow-500 to-yellow-600',
    Server5xx: 'from-red-500 to-red-600',
    Security: 'from-pink-500 to-pink-600',
    Unknown: 'from-gray-500 to-gray-600'
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${tagColors[tag]} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{tag} Incident</h3>
              <p className="text-sm text-white/80 mt-0.5">Troubleshooting Action Notes</p>
            </div>
          </div>

          <button
            onClick={copyToClipboard}
            className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white text-sm font-medium transition-all"
          >
            {copied ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Action Items */}
      <div className="p-6">
        <div className="space-y-3">
          {notes.map((note, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors group"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 text-sm text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                {note}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Bu notları kopyalayıp Slack/Jira\'ya yapıştırabilirsiniz
          </span>
        </div>
      </div>
    </div>
  );
}
