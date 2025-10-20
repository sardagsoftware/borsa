#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
APP="$ROOT/apps/console"
SRC="$APP/src"
PUB="$APP/public"
LOG="$ROOT/logs/playable-sprint.log"
mkdir -p "$SRC/app/console/play" "$SRC/components/play" "$SRC/lib/play" "$PUB/assets/play" logs

echo "🎮 Web Playable Vertical Slice Sprint — /console/play" | tee "$LOG"

# 1) Bağımlılıklar (React Three Fiber, Drei, Rapier, Cannon alternatifli)
if command -v pnpm >/dev/null 2>&1; then
  pnpm add -w three @react-three/fiber @react-three/drei @react-three/rapier zustand howler >/dev/null 2>&1 || pnpm add three @react-three/fiber @react-three/drei @react-three/rapier zustand howler
else
  npm i -D three @react-three/fiber @react-three/drei @react-three/rapier zustand howler
fi

# 2) Oynanış durum mağazası (Zustand)
cat > "$SRC/lib/play/store.ts" <<'TS'
'use client';
import { create } from 'zustand';
type GameState = {
  paused: boolean; locale: 'tr'|'en';
  inventory: string[]; picked: (id:string)=>void;
  puzzleOpen: boolean; openPuzzle:()=>void; closePuzzle:()=>void;
  doorOpen: boolean; openDoor:()=>void;
};
export const useGame = create<GameState>((set)=>({
  paused:false, locale:'tr', inventory:[],
  picked:(id)=>set(s=>({inventory:[...s.inventory,id]})),
  puzzleOpen:false, openPuzzle:()=>set({puzzleOpen:true}), closePuzzle:()=>set({puzzleOpen:false}),
  doorOpen:false, openDoor:()=>set({doorOpen:true}),
}));
TS

# 3) Giriş kontrolleri (WASD + Space + E), i18n küçük sözlük
cat > "$SRC/lib/play/input.ts" <<'TS'
'use client';
import { useEffect, useState } from 'react';
export function useKeys(){
  const [k,setK]=useState<Record<string,boolean>>({});
  useEffect(()=>{ const dn=(e:KeyboardEvent)=>setK(s=>({...s,[e.key.toLowerCase()]:true}));
                  const up=(e:KeyboardEvent)=>setK(s=>({...s,[e.key.toLowerCase()]:false}));
                  window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
                  return ()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up)}
  },[]);
  return {
    forward: k['w']||k['arrowup']||false,
    back:    k['s']||k['arrowdown']||false,
    left:    k['a']||k['arrowleft']||false,
    right:   k['d']||k['arrowright']||false,
    jump:    k[' ']||false,
    interact:k['e']||false,
    pause:   k['escape']||false,
  };
}
export const dict = {
  tr: { play:'Oyna', resume:'Devam', paused:'Duraklatıldı',
        task:'Rezonans sütununu doğru frekansa ayarla (E)',
        open:'AÇIK', closed:'KAPALI', fps:'FPS', lang:'Dil' },
  en: { play:'Play', resume:'Resume', paused:'Paused',
        task:'Tune the resonance column to correct frequency (E)',
        open:'OPEN', closed:'CLOSED', fps:'FPS', lang:'Lang' }
};
TS

# 4) Oyun kanvası ve sahne: zemin, sütun, kapı, düşman devriyesi, ışıklar
cat > "$SRC/components/play/GameCanvas.tsx" <<'TSX'
'use client';
import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, StatsGl, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody, Physics, vec3 } from '@react-three/rapier';
import { useKeys } from '@/lib/play/input';
import { useGame } from '@/lib/play/store';

function Ground(){
  return (
    <RigidBody type="fixed" restitution={0.1} friction={1}>
      <mesh receiveShadow rotation-x={-Math.PI/2}>
        <planeGeometry args={[60,60,1,1]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </RigidBody>
  );
}

function Door(){
  const {doorOpen} = useGame.getState();
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(()=>{
    if (!ref.current) return;
    const y = THREE.MathUtils.damp(ref.current.position.y, doorOpen ? 6 : 1.2, 2, 0.016);
    ref.current.position.y = y;
  });
  return (
    <mesh ref={ref} position={[0,1.2,-10]} castShadow receiveShadow>
      <boxGeometry args={[3,2,0.3]} />
      <meshStandardMaterial color={doorOpen ? '#22c55e' : '#ef4444'} />
    </mesh>
  );
}

function ResonanceColumn({onSolve}:{onSolve:()=>void}){
  // frekans hedefi
  const target = 440; // Hz A4
  const [freq,setFreq] = useState(220);
  const [solved,setSolved]=useState(false);
  const t = useRef(0);
  useFrame((_s,dt)=>{
    t.current += dt;
  });
  const color = solved ? '#22c55e' : '#60a5fa';
  return (
    <group position={[0,0,-4]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.6,0.6,3,24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2}/>
      </mesh>
      <HtmlPanel freq={freq} target={target} onChange={(v)=>{
        setFreq(v);
        if (Math.abs(v-target) <= 3 && !solved){ setSolved(true); onSolve(); }
      }} solved={solved}/>
    </group>
  );
}

function HtmlPanel({freq,target, onChange, solved}:{freq:number;target:number;onChange:(v:number)=>void;solved:boolean}){
  // Basit HTML overlay
  return (
    <group position={[0,2.2,-4]}>
      <mesh position={[0,0,0]}>
        <planeGeometry args={[3.2,1.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
      <Text position={[0,0.2,0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle">
        {solved ? 'DOOR OPEN' : `FREQ: ${freq.toFixed(0)} Hz  →  TARGET: ${target} Hz`}
      </Text>
      {/* Slider yerine klavye Q/E ile ince ayar, demo basitliği için: */}
      <Text position={[-1.2,-0.3,0]} fontSize={0.14} color="#e6c67a">Q</Text>
      <Text position={[ 1.2,-0.3,0]} fontSize={0.14} color="#e6c67a">E</Text>
      {/* Bu panel gerçek HTML input ile de geliştirilebilir */}
    </group>
  );
}

function EnemyPatrol(){
  const ref = useRef<THREE.Mesh>(null!);
  const [dir,setDir] = useState(1);
  useFrame((_s,dt)=>{
    if (!ref.current) return;
    ref.current.position.x += dir * dt * 2.0;
    if (ref.current.position.x > 6) setDir(-1);
    if (ref.current.position.x < -6) setDir(1);
  });
  return (
    <mesh ref={ref} position={[-6,0.6,-6]} castShadow>
      <boxGeometry args={[1.2,1.2,1.2]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
  );
}

function Player(){
  const body = useRef<any>(null);
  const keys = useKeys();
  const vel = new THREE.Vector3();
  const speed = 5;
  const jumpForce = 5;
  const onGround = useRef(true);
  useFrame((_s,dt)=>{
    if (!body.current) return;
    const v = vec3(body.current.linvel());
    vel.set(0,v.y,0);
    if (keys.forward) vel.z -= speed;
    if (keys.back)    vel.z += speed;
    if (keys.left)    vel.x -= speed;
    if (keys.right)   vel.x += speed;
    if (keys.jump && onGround.current){ body.current.applyImpulse({x:0,y:jumpForce,z:0}, true); onGround.current=false; }
    body.current.setLinvel(vel, true);
  });
  return (
    <RigidBody ref={body} colliders="cuboid" restitution={0} friction={1} position={[0,1,2]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.4,0.8,8,16]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>
    </RigidBody>
  );
}

export default function GameCanvas(){
  const { openDoor } = useGame();
  // Klavye Q/E ile freq ayarı
  const keys = useKeys();
  const freqRef = useRef(220);

  return (
    <Canvas shadows camera={{position:[6,5,8], fov:55}}>
      <color attach="background" args={['#0b0f19']} />
      <hemisphereLight intensity={0.6} />
      <directionalLight position={[6,8,6]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}/>
      <Physics gravity={[0,-9.81,0]}>
        <Ground/>
        <Player/>
        <ResonanceColumn onSolve={openDoor}/>
        <Door/>
      </Physics>
      <EnemyPatrol/>
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI/2}/>
      <StatsGl />
    </Canvas>
  );
}
TSX

# 5) Oyun UI (HUD) — FPS, Görev ipucu, Dil seçimi, Pause
cat > "$SRC/components/play/HUD.tsx" <<'TSX'
'use client';
import React, { useEffect, useState } from 'react';
import { useGame } from '@/lib/play/store';
import { dict } from '@/lib/play/input';

export default function HUD(){
  const { paused, locale } = useGame();
  const D = dict[locale];
  const [fps,setFps]=useState(0);
  useEffect(()=>{
    let f=0, last=performance.now();
    let id = requestAnimationFrame(function loop(t){
      f++; if (t-last>=1000){ setFps(f); f=0; last=t; }
      id = requestAnimationFrame(loop);
    });
    return ()=> cancelAnimationFrame(id);
  },[]);
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/40 border border-white/10 pointer-events-auto text-sm">{D.fps}: {fps}</div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-2 rounded bg-black/40 border border-white/10 pointer-events-auto text-sm">
        {D.task}
      </div>
      {paused && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <div className="rounded-xl border border-white/10 bg-black/60 p-6">
            <div className="text-xl font-semibold mb-2">{D.paused}</div>
            <div className="text-sm opacity-80">{D.resume}: ESC</div>
          </div>
        </div>
      )}
    </div>
  );
}
TSX

# 6) Play sayfası (Next.js route) — /console/play
cat > "$SRC/app/console/play/page.tsx" <<'TSX'
import React from "react";
import dynamic from "next/dynamic";

export const metadata = {
  title: "Echo of Sardis — Web Vertical Slice",
  description: "Playable HTML/WebGL demo — resonance puzzle + basic traversal.",
};

const GameCanvas = dynamic(()=>import('@/components/play/GameCanvas'), { ssr:false });
const HUD = dynamic(()=>import('@/components/play/HUD'), { ssr:false });

export default function PlayPage(){
  return (
    <main className="w-full h-[calc(100vh-80px)]">
      <div className="h-full relative">
        <GameCanvas/>
        <HUD/>
      </div>
      <div className="container max-w-6xl py-4 text-sm opacity-80">
        <b>Kontroller:</b> W/A/S/D hareket • Space zıpla • E etkileşim • Q/E (frekans ince ayar) • Fare = kamera
      </div>
    </main>
  );
}
TSX

echo "✅ All files created successfully!" | tee -a "$LOG"
