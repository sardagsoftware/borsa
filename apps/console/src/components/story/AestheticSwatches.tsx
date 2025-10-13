/**
 * Aesthetic Swatches Component
 * Displays visual color palette and audio design guidelines
 *
 * A11y: WCAG contrast ratios, ARIA labels, semantic structure
 */

'use client';

import { useState } from 'react';

interface ColorSwatch {
  hex: string;
  rgb: string;
  usage: string;
  symbolism: string;
}

interface Leitmotif {
  description: string;
  instruments: string[];
  emotional_function: string;
}

interface AestheticData {
  color_palette: Record<string, ColorSwatch>;
  lighting: {
    philosophy: string;
    zones: Record<string, { description: string; color_temp: string; intensity: string }>;
  };
  music: {
    instrumentation: string[];
    leitmotifs: Record<string, Leitmotif>;
  };
  soundscape: {
    ambient: Record<string, { description: string; reverb: string }>;
  };
}

export default function AestheticSwatches({ data }: { data: AestheticData }) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedLeitmotif, setSelectedLeitmotif] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'colors' | 'lighting' | 'music' | 'sound'>('colors');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'colors', label: 'Color Palette', icon: '🎨' },
          { id: 'lighting', label: 'Lighting', icon: '💡' },
          { id: 'music', label: 'Music', icon: '🎵' },
          { id: 'sound', label: 'Soundscape', icon: '🔊' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? 'border-lydian-gold text-lydian-gold'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Color Palette Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(data.color_palette).map(([key, color]) => {
              const isSelected = selectedColor === key;
              const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

              return (
                <button
                  key={key}
                  onClick={() => setSelectedColor(isSelected ? null : key)}
                  className={`group relative rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-lydian-gold ring-2 ring-lydian-gold/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  aria-label={`View ${title} color details`}
                  aria-pressed={isSelected}
                >
                  {/* Color Swatch */}
                  <div
                    className="h-32 rounded-t-lg"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />

                  {/* Color Info */}
                  <div className="p-3 bg-white dark:bg-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {title}
                    </h4>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="font-mono">{color.hex}</div>
                      <div className="font-mono text-[10px]">RGB({color.rgb})</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm rounded-lg">
                      <span className="text-2xl">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Color Details */}
          {selectedColor && data.color_palette[selectedColor] && (
            <div className="p-6 rounded-lg border-2 border-lydian-gold bg-lydian-gold/5">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedColor.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </h4>
                <button
                  onClick={() => setSelectedColor(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Close color details"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Usage:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {data.color_palette[selectedColor].usage}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Symbolism:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {data.color_palette[selectedColor].symbolism}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lighting Tab */}
      {activeTab === 'lighting' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold text-lydian-gold uppercase mb-2">Philosophy</h4>
            <p className="text-gray-700 dark:text-gray-300">{data.lighting.philosophy}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(data.lighting.zones).map(([key, zone]) => {
              const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

              return (
                <div
                  key={key}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                      <p className="text-gray-600 dark:text-gray-400">{zone.description}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Color Temp:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{zone.color_temp}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Intensity:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{zone.intensity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Music Tab */}
      {activeTab === 'music' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold text-lydian-gold uppercase mb-2">Instrumentation</h4>
            <div className="flex flex-wrap gap-2">
              {data.music.instrumentation.map((instrument, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-200 dark:border-gray-600"
                >
                  {instrument}
                </span>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(data.music.leitmotifs).map(([key, leitmotif]) => {
              const isSelected = selectedLeitmotif === key;
              const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

              return (
                <button
                  key={key}
                  onClick={() => setSelectedLeitmotif(isSelected ? null : key)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-lydian-gold bg-lydian-gold/5 ring-2 ring-lydian-gold/30'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-lydian-gold/50'
                  }`}
                  aria-label={`View ${title} leitmotif details`}
                  aria-pressed={isSelected}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {leitmotif.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {leitmotif.instruments.map((inst, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {inst}
                      </span>
                    ))}
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-semibold text-lydian-gold uppercase">Emotional Function</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {leitmotif.emotional_function}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Soundscape Tab */}
      {activeTab === 'sound' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(data.soundscape.ambient).map(([key, sound]) => {
              const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

              return (
                <div
                  key={key}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    🔊 {title}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{sound.description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Reverb:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{sound.reverb}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
