'use client';
import React, { useState, useEffect } from 'react';
import { useGame } from '@/lib/play/store';
import { cloudGet, cloudPut } from '@/lib/play/cloudsave';

const TARGETS = [220, 330, 440]; // Hz

export default function PuzzlePanel() {
  const { puzzleOpen, setPuzzleOpen, columns, setColumns, setDoorOpen } = useGame();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cloudGet().then((save) => {
      if (save && save.puzzleColumns) {
        setColumns(save.puzzleColumns);
      }
    });
  }, [setColumns]);

  const handleSolve = () => {
    const solved = columns.every((c, i) => Math.abs(c - TARGETS[i]) < 5);
    if (solved) {
      setDoorOpen(true);
      alert('🎉 Puzzle solved! Door opened!');
      setPuzzleOpen(false);
    } else {
      alert('❌ Not quite right. Keep tuning...');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await cloudPut({
      version: 1,
      at: Date.now(),
      checkpoint: 'puzzle',
      doorOpen: false,
      puzzleColumns: columns,
    });
    setSaving(false);
    alert('💾 Progress saved!');
  };

  const handleLoad = async () => {
    const save = await cloudGet();
    if (save && save.puzzleColumns) {
      setColumns(save.puzzleColumns);
      alert('📂 Progress loaded!');
    } else {
      alert('⚠️ No save found.');
    }
  };

  if (!puzzleOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">🎵 Harmonic Puzzle</h2>
        <p className="text-sm text-white/70 mb-4">
          Tune each column to match the target frequencies: {TARGETS.join(', ')} Hz
        </p>

        <div className="space-y-4 mb-6">
          {columns.map((val, i) => (
            <div key={i}>
              <label className="block text-sm mb-1">
                Column {i + 1}: {val} Hz (Target: {TARGETS[i]} Hz)
              </label>
              <input
                type="range"
                min={100}
                max={500}
                step={5}
                value={val}
                onChange={(e) => {
                  const newCols = [...columns];
                  newCols[i] = parseInt(e.target.value);
                  setColumns(newCols);
                }}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSolve}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
          >
            ✅ Solve
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50"
          >
            {saving ? '💾 Saving...' : '💾 Save'}
          </button>
          <button
            onClick={handleLoad}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
          >
            📂 Load
          </button>
          <button
            onClick={() => setPuzzleOpen(false)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
