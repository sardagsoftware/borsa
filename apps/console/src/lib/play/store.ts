'use client';
import { create } from 'zustand';
import type { SaveBlob } from './cloudsave';

export type GameState = {
  paused: boolean;
  locale: string;
  checkpoint: string;
  doorOpen: boolean;
  pos: [number, number, number];
  puzzleOpen: boolean;
  columns: number[];

  setPaused: (p: boolean) => void;
  setCheckpoint: (c: string) => void;
  setDoorOpen: (d: boolean) => void;
  setPos: (p: [number, number, number]) => void;
  setPuzzleOpen: (p: boolean) => void;
  setColumns: (c: number[]) => void;
  loadSave: (s: SaveBlob) => void;
};

export const useGame = create<GameState>((set) => ({
  paused: false,
  locale: 'en',
  checkpoint: 'start',
  doorOpen: false,
  pos: [0, 1, 5],
  puzzleOpen: false,
  columns: [0, 0, 0],

  setPaused: (p) => set({ paused: p }),
  setCheckpoint: (c) => set({ checkpoint: c }),
  setDoorOpen: (d) => set({ doorOpen: d }),
  setPos: (p) => set({ pos: p }),
  setPuzzleOpen: (p) => set({ puzzleOpen: p }),
  setColumns: (c) => set({ columns: c }),
  loadSave: (s) => set({
    checkpoint: s.checkpoint,
    doorOpen: s.doorOpen,
    pos: s.pos || [0, 1, 5],
    columns: s.puzzleColumns || [0, 0, 0],
  }),
}));
