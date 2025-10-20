/**
 * Character Relationship Graph Component
 * Displays character profiles and their relationships
 *
 * A11y: Keyboard accessible cards, ARIA labels, semantic structure
 */

'use client';

import { useState } from 'react';

interface Character {
  id: string;
  name: string;
  role: string;
  age: number;
  nationality: string;
  motivation?: string;
  arc?: string;
  fatal_flaw?: string;
  voice_traits?: string[];
}

interface RelationshipEdge {
  source: string;
  target: string;
  type: 'ally' | 'antagonist' | 'mentor' | 'complex' | string;
  strength: number;
  label: string;
}

interface CharacterData {
  characters: Record<string, Character> | Character[];
  relationship_graph: {
    nodes: Array<{ id: string; type: string; size: number }>;
    edges: RelationshipEdge[];
  };
}

export default function CharacterRelGraph({ data }: { data: CharacterData }) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [hoveredRelationship, setHoveredRelationship] = useState<RelationshipEdge | null>(null);

  // Convert characters object to array if needed
  const charactersArray: Character[] = Array.isArray(data.characters)
    ? data.characters
    : Object.values(data.characters);

  // Get character by ID
  const getCharacter = (id: string) => charactersArray.find((c) => c.id === id);

  // Get relationships for a character
  const getRelationships = (characterId: string) => {
    return data.relationship_graph.edges.filter(
      (edge) => edge.source === characterId || edge.target === characterId
    );
  };

  return (
    <div className="space-y-6">
      {/* Character Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {charactersArray.map((character) => {
          const isSelected = selectedCharacter?.id === character.id;
          const relationships = getRelationships(character.id);

          return (
            <button
              key={character.id}
              onClick={() => setSelectedCharacter(isSelected ? null : character)}
              className={`text-left p-6 rounded-lg border transition-all ${
                isSelected
                  ? 'border-lydian-gold bg-lydian-gold/5 ring-2 ring-lydian-gold/50'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-lydian-gold/50'
              }`}
              aria-label={`View ${character.name}'s details`}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {character.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{character.role}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {character.archetype}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-semibold">Age:</span> {character.age}
                </div>
                <div>
                  <span className="font-semibold">Nationality:</span> {character.nationality}
                </div>
                <div>
                  <span className="font-semibold">Connections:</span> {relationships.length}
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-lydian-gold font-semibold mb-1">SELECTED</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    Click to view full details below
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Character Details */}
      {selectedCharacter && (
        <div className="p-8 bg-white dark:bg-gray-800 rounded-lg border-2 border-lydian-gold">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {selectedCharacter.name}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">{selectedCharacter.role}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                <span>{selectedCharacter.age} years old</span>
                <span>•</span>
                <span>{selectedCharacter.nationality}</span>
                <span>•</span>
                <span className="font-semibold">{selectedCharacter.archetype}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedCharacter(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              aria-label="Close character details"
            >
              ✕
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                  Core Motivation
                </h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedCharacter.motivation || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                  Fatal Flaw
                </h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedCharacter.fatal_flaw || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                  Voice Traits
                </h4>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  {Array.isArray(selectedCharacter.voice_traits)
                    ? selectedCharacter.voice_traits.join(', ')
                    : 'Not specified'}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h4 className="text-sm font-semibold text-lydian-gold uppercase mb-2">
                Character Arc
              </h4>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{selectedCharacter.arc || 'Not specified'}</p>

              <h4 className="text-sm font-semibold text-lydian-gold uppercase mb-3 mt-6">
                Relationships ({getRelationships(selectedCharacter.id).length})
              </h4>
              <div className="space-y-2">
                {getRelationships(selectedCharacter.id).map((rel, i) => {
                  const otherCharacterId = rel.source === selectedCharacter.id ? rel.target : rel.source;
                  const otherCharacter = getCharacter(otherCharacterId);
                  if (!otherCharacter) return null;

                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredRelationship(rel)}
                      onMouseLeave={() => setHoveredRelationship(null)}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {otherCharacter.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {rel.label}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getRelationshipTypeColor(
                              rel.type
                            )}`}
                          >
                            {rel.type}
                          </span>
                          <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {(rel.strength * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relationship Network Visualization (Simplified) */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Relationship Network
        </h4>
        <div className="grid md:grid-cols-2 gap-3">
          {data.relationship_graph.edges.map((edge, i) => {
            const source = getCharacter(edge.source);
            const target = getCharacter(edge.target);
            if (!source || !target) return null;

            return (
              <div
                key={i}
                className="p-3 bg-white dark:bg-gray-750 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{source.name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{target.name}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{edge.label}</div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRelationshipStrengthColor(edge.strength)}`}
                      style={{ width: `${edge.strength * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {(edge.strength * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Get relationship type color
 */
function getRelationshipTypeColor(type: string): string {
  switch (type) {
    case 'ally':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'antagonist':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'mentor':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'complex':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

/**
 * Get relationship strength color for progress bar
 */
function getRelationshipStrengthColor(strength: number): string {
  if (strength >= 0.7) return 'bg-green-500';
  if (strength >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
}
