#!/usr/bin/env bash
set -euo pipefail

echo "🎮 PLAYABLE PRO MAX - Creating full-featured WebGL demo..."

cd apps/console

# Install dependencies
echo "📦 Installing dependencies..."
npm install --save-dev --legacy-peer-deps \
  @react-three/postprocessing@latest \
  postprocessing@latest \
  @react-three/drei@latest \
  @react-three/fiber@latest \
  three@latest \
  @react-three/rapier@latest \
  zustand@latest \
  howler@latest

# Create lib/play directory
mkdir -p src/lib/play

# 1. CloudSave system
echo "☁️ Creating CloudSave system..."
cat > src/lib/play/cloudsave.ts <<'TS'
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
TS

# 2. Input system
echo "🎮 Creating input system..."
cat > src/lib/play/input.ts <<'TS'
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
TS

# 3. Game store
echo "🗂️ Creating game store..."
cat > src/lib/play/store.ts <<'TS'
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
TS

# Create components/play directory
mkdir -p src/components/play

# 4. CharacterController component
echo "🏃 Creating CharacterController..."
cat > src/components/play/CharacterController.tsx <<'TSX'
'use client';
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody, vec3 } from '@react-three/rapier';
import * as THREE from 'three';
import { useKeys, useGamepad } from '@/lib/play/input';
import { useGame } from '@/lib/play/store';

export default function CharacterController() {
  const rbRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const keys = useKeys();
  const pad = useGamepad();
  const { paused, setPos } = useGame();

  // Load GLB model (fallback to box if not available)
  const gltf = useGLTF('/assets/models/character.glb', true).catch(() => null);
  const { actions } = useAnimations(gltf?.animations || [], groupRef);

  useEffect(() => {
    if (actions?.Idle) actions.Idle.play();
  }, [actions]);

  useFrame((state, delta) => {
    if (paused || !rbRef.current) return;

    const rb = rbRef.current;
    const linvel = rb.linvel();

    // Input
    let moveX = 0;
    let moveZ = 0;
    if (keys.w || keys.arrowup) moveZ -= 1;
    if (keys.s || keys.arrowdown) moveZ += 1;
    if (keys.a || keys.arrowleft) moveX -= 1;
    if (keys.d || keys.arrowright) moveX += 1;

    // Gamepad
    moveX += pad.x;
    moveZ += pad.y;

    // Normalize
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 1) {
      moveX /= len;
      moveZ /= len;
    }

    // Apply movement
    const speed = 3;
    rb.setLinvel({ x: moveX * speed, y: linvel.y, z: moveZ * speed }, true);

    // Rotation
    if (moveX !== 0 || moveZ !== 0) {
      const angle = Math.atan2(moveX, moveZ);
      if (groupRef.current) {
        groupRef.current.rotation.y = angle;
      }
      if (actions?.Walk && !actions.Walk.isRunning()) {
        actions.Idle?.stop();
        actions.Walk.play();
      }
    } else {
      if (actions?.Walk?.isRunning()) {
        actions.Walk.stop();
        actions.Idle?.play();
      }
    }

    // Jump
    if ((keys[' '] || pad.jump) && Math.abs(linvel.y) < 0.1) {
      rb.applyImpulse({ x: 0, y: 5, z: 0 }, true);
    }

    // Update store position
    const pos = rb.translation();
    setPos([pos.x, pos.y, pos.z]);

    // Camera follow
    state.camera.position.lerp(
      new THREE.Vector3(pos.x, pos.y + 3, pos.z + 5),
      delta * 5
    );
    state.camera.lookAt(pos.x, pos.y + 1, pos.z);
  });

  return (
    <RigidBody ref={rbRef} position={[0, 1, 5]} colliders="ball" mass={1}>
      <group ref={groupRef}>
        {gltf ? (
          <primitive object={gltf.scene} scale={0.5} />
        ) : (
          <mesh castShadow>
            <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
            <meshStandardMaterial color="#4a9eff" />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}
TSX

# 5. SceneHD component
echo "🌅 Creating SceneHD..."
cat > src/components/play/SceneHD.tsx <<'TSX'
'use client';
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Environment, OrbitControls, StatsGl } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import CharacterController from './CharacterController';

function Ground() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#2d3748" />
    </mesh>
  );
}

function Door() {
  return (
    <mesh castShadow position={[0, 1.5, -5]}>
      <boxGeometry args={[2, 3, 0.2]} />
      <meshStandardMaterial color="#8b4513" />
    </mesh>
  );
}

export default function SceneHD() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 3, 8], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100vh', background: '#1a202c' }}
    >
      <Suspense fallback={null}>
        <Environment preset="sunset" background={false} />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        <Physics gravity={[0, -9.81, 0]}>
          <Ground />
          <Door />
          <CharacterController />
        </Physics>

        <EffectComposer>
          <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} intensity={0.5} />
          <SSAO intensity={10} radius={0.1} />
        </EffectComposer>

        <StatsGl className="stats" />
      </Suspense>
    </Canvas>
  );
}
TSX

# 6. PuzzlePanel component
echo "🧩 Creating PuzzlePanel..."
cat > src/components/play/PuzzlePanel.tsx <<'TSX'
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
TSX

# 7. HUD component
echo "📊 Creating HUD..."
cat > src/components/play/HUD.tsx <<'TSX'
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
TSX

# 8. Main Play page
echo "🎮 Creating main Play page..."
cat > src/app/console/play/page.tsx <<'TSX'
'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import HUD from '@/components/play/HUD';
import PuzzlePanel from '@/components/play/PuzzlePanel';

const SceneHD = dynamic(() => import('@/components/play/SceneHD'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white/70">Loading 3D scene...</p>
      </div>
    </div>
  ),
});

export default function PlayPage() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <SceneHD />
      <HUD />
      <PuzzlePanel />
    </div>
  );
}
TSX

# 9. CloudSave API endpoint
echo "☁️ Creating CloudSave API endpoint..."
mkdir -p ../../api/cloudsave
cat > ../../api/cloudsave/index.js <<'JS'
/**
 * CloudSave API - Persist game state
 * GET  /api/cloudsave → { save: SaveBlob | null }
 * POST /api/cloudsave → { ok: boolean }
 */

const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'ailydian.db');

function getDb() {
  return new sqlite3.Database(DB_PATH);
}

// Ensure table exists
function ensureTable() {
  const db = getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS game_saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      save_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  db.close();
}

ensureTable();

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = req.headers['x-user-id'] || 'guest';

  if (req.method === 'GET') {
    const db = getDb();
    db.get(
      'SELECT save_data FROM game_saves WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
      [userId],
      (err, row) => {
        db.close();
        if (err) {
          console.error('CloudSave GET error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        const save = row ? JSON.parse(row.save_data) : null;
        res.status(200).json({ save });
      }
    );
  } else if (req.method === 'POST') {
    const blob = req.body;
    if (!blob || typeof blob !== 'object') {
      return res.status(400).json({ error: 'Invalid save data' });
    }

    const now = Date.now();
    const db = getDb();
    db.run(
      'INSERT INTO game_saves (user_id, save_data, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [userId, JSON.stringify(blob), now, now],
      (err) => {
        db.close();
        if (err) {
          console.error('CloudSave POST error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ ok: true });
      }
    );
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
JS

# 10. Create placeholder GLB model directory
echo "📦 Creating assets directory..."
mkdir -p ../../public/assets/models
cat > ../../public/assets/models/README.md <<'MD'
# 3D Models

Place your character GLB model here as `character.glb`.

If no model is found, the system will fall back to a simple capsule mesh.

Recommended:
- Character GLB with Idle and Walk animations
- Size: ~500KB optimized
- Format: GLB (binary GLTF)

Free models:
- Mixamo: https://www.mixamo.com/
- Sketchfab: https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount
MD

echo "✅ PLAYABLE PRO MAX setup complete!"
echo ""
echo "🎮 Next steps:"
echo "1. cd apps/console"
echo "2. npm run dev"
echo "3. Open http://localhost:3100/console/play"
echo ""
echo "📝 Optional: Add character.glb to public/assets/models/ for 3D character"
echo ""
echo "🎉 Ready to play!"
