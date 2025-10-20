/**
 * Theme Board Component
 * Displays themes, symbols, and ethical dilemmas
 *
 * A11y: Expandable sections with ARIA, semantic HTML
 */

'use client';

import { useState } from 'react';

interface Theme {
  central_question: string;
  perspectives: Record<string, string>;
  resolution: string;
  philosophical_framework: string;
}

interface Symbol {
  meaning: string;
  usage: string;
  evolution: string;
}

interface EthicalDilemma {
  scenario: string;
  choices: Array<{
    option: string;
    consequence: string;
    moral_weight: number;
  }>;
  philosophical_lens: string;
}

interface ThemeData {
  primary_themes: Record<string, Theme>;
  symbols: Record<string, Symbol>;
  ethical_dilemmas: EthicalDilemma[];
  archetypal_patterns: {
    hero_journey: {
      stages: Array<{ stage: string; description: string; game_moment: string }>;
    };
  };
}

export default function ThemeBoard({ data }: { data: ThemeData }) {
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [selectedDilemma, setSelectedDilemma] = useState<number | null>(null);

  // Convert ethical_dilemmas to array if it's an object
  const dilemmasArray = Array.isArray(data.ethical_dilemmas)
    ? data.ethical_dilemmas
    : data.ethical_dilemmas
    ? Object.values(data.ethical_dilemmas)
    : [];

  return (
    <div className="space-y-8">
      {/* Primary Themes */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Primary Themes
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(data.primary_themes).map(([key, theme]) => {
            const isExpanded = expandedTheme === key;
            const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            return (
              <div
                key={key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedTheme(isExpanded ? null : key)}
                  className="w-full text-left p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                  aria-expanded={isExpanded}
                  aria-controls={`theme-${key}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {title}
                    </h4>
                    <span className="text-2xl text-gray-400">
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {theme.central_question}
                  </p>
                </button>

                {isExpanded && (
                  <div
                    id={`theme-${key}`}
                    className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                          Perspectives
                        </h5>
                        <div className="space-y-2">
                          {Object.entries(theme.perspectives).map(([character, view]) => (
                            <div key={character} className="text-sm">
                              <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                {character}:
                              </span>
                              <span className="ml-2 text-gray-700 dark:text-gray-300">{view}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                          Resolution
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{theme.resolution}</p>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                          Philosophical Framework
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                          {theme.philosophical_framework}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Symbols */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Symbols & Motifs
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(data.symbols).map(([key, symbol]) => {
            const isExpanded = expandedSymbol === key;
            const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            return (
              <div
                key={key}
                className={`p-4 rounded-lg border transition-all ${
                  isExpanded
                    ? 'border-lydian-gold bg-lydian-gold/5'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <button
                  onClick={() => setExpandedSymbol(isExpanded ? null : key)}
                  className="w-full text-left"
                  aria-expanded={isExpanded}
                  aria-controls={`symbol-${key}`}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {getSymbolIcon(key)} {title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {symbol.meaning}
                  </p>
                </button>

                {isExpanded && (
                  <div id={`symbol-${key}`} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Usage:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{symbol.usage}</p>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Evolution:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{symbol.evolution}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Ethical Dilemmas */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Ethical Dilemmas
        </h3>
        <div className="space-y-4">
          {dilemmasArray.map((dilemma, index) => {
            const isSelected = selectedDilemma === index;

            return (
              <div
                key={index}
                className={`border rounded-lg overflow-hidden transition-all ${
                  isSelected
                    ? 'border-lydian-gold ring-2 ring-lydian-gold/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <button
                  onClick={() => setSelectedDilemma(isSelected ? null : index)}
                  className="w-full text-left p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                  aria-expanded={isSelected}
                  aria-controls={`dilemma-${index}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-lydian-gold uppercase mb-1">
                        Dilemma {index + 1}
                      </div>
                      <p className="text-gray-900 dark:text-gray-100">{dilemma.scenario}</p>
                    </div>
                    <span className="text-2xl text-gray-400 ml-4">
                      {isSelected ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {isSelected && (
                  <div
                    id={`dilemma-${index}`}
                    className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-semibold text-lydian-gold uppercase mb-3">
                          Player Choices ({dilemma.choices.length})
                        </h5>
                        <div className="space-y-3">
                          {dilemma.choices.map((choice, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  Option {String.fromCharCode(65 + i)}: {choice.option}
                                </div>
                                <span
                                  className={`px-2 py-1 text-xs font-bold rounded ${getMoralWeightColor(
                                    choice.moral_weight
                                  )}`}
                                >
                                  {choice.moral_weight > 0 ? '+' : ''}{choice.moral_weight.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">Consequence:</span> {choice.consequence}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                          Philosophical Lens
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                          {dilemma.philosophical_lens}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Hero's Journey */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Hero's Journey (Campbell's Monomyth)
        </h3>
        <div className="p-6 bg-gradient-to-br from-lydian-gold/5 to-transparent rounded-lg border border-lydian-gold/20">
          <div className="space-y-3">
            {data.archetypal_patterns.hero_journey.stages.map((stage, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-lydian-gold text-gray-900 flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {stage.stage}
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {stage.description}
                  </p>
                  <p className="text-xs text-lydian-gold font-medium">
                    Game Moment: {stage.game_moment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Get symbol icon based on key
 */
function getSymbolIcon(key: string): string {
  const icons: Record<string, string> = {
    echo: '🔊',
    resonance: '〰️',
    lydian_stone: '🪨',
    lydian_gold: '✨',
    water_pool: '💧',
    memory: '🧠',
    light: '💡',
    silence: '🔇'
  };
  return icons[key] || '⚫';
}

/**
 * Get moral weight color
 */
function getMoralWeightColor(weight: number): string {
  if (weight > 0.5) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
  if (weight > 0) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
  if (weight > -0.5) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
  return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
}
