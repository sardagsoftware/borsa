'use client';
import { useEffect, useState } from 'react';

export function useKeys() {
  const [keys, setKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.key.toLowerCase()]: true }));
    const up = (e: KeyboardEvent) => setKeys((k) => ({ ...k, [e.key.toLowerCase()]: false }));
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return keys;
}

export function useGamepad() {
  const [pad, setPad] = useState<{ x: number; y: number; jump: boolean }>({ x: 0, y: 0, jump: false });

  useEffect(() => {
    const interval = setInterval(() => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (!gp) return;

      const x = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
      const y = Math.abs(gp.axes[1]) > 0.15 ? -gp.axes[1] : 0;
      const jump = gp.buttons[0]?.pressed || false;

      setPad({ x, y, jump });
    }, 16);
    return () => clearInterval(interval);
  }, []);

  return pad;
}
