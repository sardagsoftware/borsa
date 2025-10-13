/**
 * Dialogue Panel Component
 * Displays dialogue samples with character voice guidelines
 *
 * A11y: Semantic HTML, readable contrast, markdown parsing
 */

'use client';

import { useState } from 'react';

interface DialoguePanelProps {
  markdown: string;
}

export default function DialoguePanel({ markdown }: DialoguePanelProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  // Parse markdown sections (simple parser for demo)
  const sections = parseMarkdownSections(markdown);

  return (
    <div className="space-y-6">
      {/* Character Voice Selector */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setSelectedCharacter(selectedCharacter === section.id ? null : section.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCharacter === section.id
                ? 'bg-lydian-gold text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-label={`View ${section.title}'s dialogue`}
            aria-pressed={selectedCharacter === section.id}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Dialogue Content */}
      <div className="space-y-4">
        {sections
          .filter((s) => !selectedCharacter || s.id === selectedCharacter)
          .map((section) => (
            <div
              key={section.id}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {section.title}
                </h4>
                {section.subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {section.subtitle}
                  </p>
                )}
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="space-y-3"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }}
                />
              </div>
            </div>
          ))}
      </div>

      {/* Voice Guidelines Legend */}
      <div className="p-4 bg-lydian-gold/5 rounded-lg border border-lydian-gold/20">
        <h4 className="text-sm font-semibold text-lydian-gold uppercase mb-3">
          Voice Guidelines
        </h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold">Tone:</span> Formal, casual, technical, poetic
          </div>
          <div>
            <span className="font-semibold">Pacing:</span> Quick, measured, hesitant
          </div>
          <div>
            <span className="font-semibold">Metaphors:</span> Nature, archaeology, technology
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Parse markdown into sections
 * Simplified parser for demonstration
 */
function parseMarkdownSections(markdown: string): Array<{
  id: string;
  title: string;
  subtitle?: string;
  content: string;
}> {
  const sections: Array<{
    id: string;
    title: string;
    subtitle?: string;
    content: string;
  }> = [];

  // Split by ### headers (character sections)
  const parts = markdown.split(/\n### /);

  parts.forEach((part, index) => {
    if (index === 0 && !part.startsWith('###')) {
      // Skip intro content
      return;
    }

    const lines = part.split('\n');
    const title = lines[0].replace(/^#+\s*/, '').trim();

    // Extract subtitle if exists (usually in **Voice Traits** format)
    let subtitle = '';
    const subtitleMatch = part.match(/\*\*Voice Traits\*\*:\s*(.+)/);
    if (subtitleMatch) {
      subtitle = subtitleMatch[1];
    }

    const id = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const content = lines.slice(1).join('\n').trim();

    sections.push({ id, title, subtitle, content });
  });

  return sections;
}

/**
 * Simple markdown to HTML renderer
 * Supports: bold, italic, blockquotes, code
 */
function renderMarkdown(markdown: string): string {
  let html = markdown;

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-lydian-gold pl-4 italic text-gray-700 dark:text-gray-300 my-2">$1</blockquote>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">$1</code>');

  // Dialogue indicators (ELIF:, FERHAT:, etc.)
  html = html.replace(/^([A-Z]+):/gm, '<span class="font-bold text-lydian-gold">$1:</span>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="mb-2">');
  html = '<p class="mb-2">' + html + '</p>';

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  return html;
}
