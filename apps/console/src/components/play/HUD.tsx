'use client';
import React, { useState, useEffect } from 'react';
import { useGame } from '@/lib/play/store';

export default function HUD() {
  const { setPuzzleOpen, doorOpen, pos } = useGame();
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    const interval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      setFps(Math.round((frames * 1000) / delta));
      frames = 0;
      lastTime = now;
    }, 1000);

    const tick = () => {
      frames++;
      requestAnimationFrame(tick);
    };
    tick();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Top-left: FPS */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-sm font-mono">
        FPS: {fps}
      </div>

      {/* Top-right: Status */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-2 rounded-lg text-sm">
        {doorOpen ? '🚪 Door: OPEN' : '🚪 Door: LOCKED'}
      </div>

      {/* Bottom-center: Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-2 rounded-lg text-sm">
        <div className="text-center mb-1 font-semibold">Controls</div>
        <div className="flex gap-4 text-xs">
          <span>WASD / Arrows: Move</span>
          <span>Space: Jump</span>
          <span>P: Puzzle</span>
        </div>
      </div>

      {/* Bottom-left: Puzzle trigger */}
      <button
        onClick={() => setPuzzleOpen(true)}
        className="absolute bottom-4 left-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold pointer-events-auto"
      >
        🧩 Open Puzzle
      </button>
    </div>
  );
}
