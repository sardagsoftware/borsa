'use client';

export type SaveBlob = {
  version: number;
  at: number;
  checkpoint: string;
  doorOpen: boolean;
  pos?: [number, number, number];
  puzzleColumns?: number[];
};

export async function cloudGet(): Promise<SaveBlob | null> {
  try {
    const resp = await fetch('/api/cloudsave', { method: 'GET', credentials: 'include' });
    if (!resp.ok) throw new Error('Failed to fetch save');
    const data = await resp.json();
    return data.save || null;
  } catch (err) {
    console.warn('CloudSave GET failed, checking localStorage:', err);
    const local = localStorage.getItem('game_save');
    return local ? JSON.parse(local) : null;
  }
}

export async function cloudPut(blob: SaveBlob): Promise<boolean> {
  try {
    const resp = await fetch('/api/cloudsave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(blob),
    });
    if (!resp.ok) throw new Error('Failed to save');
    localStorage.setItem('game_save', JSON.stringify(blob));
    return true;
  } catch (err) {
    console.warn('CloudSave PUT failed, using localStorage only:', err);
    localStorage.setItem('game_save', JSON.stringify(blob));
    return false;
  }
}
