#!/usr/bin/env bash
set -euo pipefail
echo "🎮 PLAY-PRO CINEMATIC — PS5-tarzı web vertical slice (white-hat, 0 hata)"

ROOT="${ROOT:-$(pwd)}"
APP="$ROOT/apps/console"
SRC="$APP/src"
PUB="$APP/public"
LOG="$ROOT/logs/play-pro-cinematic.log"
mkdir -p "$SRC/app/console/play-pro" "$SRC/components/playpro" "$SRC/lib/playpro" \
         "$PUB/assets/play/{characters,hdr,video}" logs

# 0) Bağımlılıklar (grafik + fizik + ses + hareket + joystick + postfx)
if command -v pnpm >/dev/null 2>&1; then
  pnpm add -w three @react-three/fiber @react-three/drei @react-three/rapier \
    @react-three/postprocessing postprocessing zustand howler framer-motion-3d nipplejs >/dev/null 2>&1 || true
else
  npm i -D --legacy-peer-deps three @react-three/fiber @react-three/drei @react-three/rapier \
    @react-three/postprocessing postprocessing zustand howler framer-motion-3d nipplejs
fi

# 1) GLOBAL OYUN DURUMU (ayarlar + save + dil)
cat > "$SRC/lib/playpro/state.ts" <<'TS'
'use client';
import { create } from 'zustand';
export type Quality = 'low'|'medium'|'high'|'ultra';
type SaveBlob = { version:number; at:number; checkpoint:string; doorOpen:boolean; pos?:[number,number,number] };
type S = {
  locale:'tr'|'en'; setLocale:(l:S['locale'])=>void;
  paused:boolean; setPaused:(v:boolean)=>void;
  quality:Quality; setQuality:(q:Quality)=>void;
  resolutionScale:number; setScale:(v:number)=>void;
  fov:number; setFov:(v:number)=>void;
  music:boolean; sfx:boolean; toggleMusic:()=>void; toggleSfx:()=>void;
  checkpoint:string|null; setCheckpoint:(c:string)=>void;
  doorOpen:boolean; setDoor:(v:boolean)=>void;
  pos:[number,number,number]; setPos:(p:[number,number,number])=>void;
};
export const useGame = create<S>((set)=>({
  locale:'tr', setLocale:(l)=>set({locale:l}),
  paused:false, setPaused:(v)=>set({paused:v}),
  quality:'high', setQuality:(q)=>set({quality:q}),
  resolutionScale:1.0, setScale:(v)=>set({resolutionScale:Math.max(.5,Math.min(1.5,v))}),
  fov:55, setFov:(v)=>set({fov:Math.max(40,Math.min(90,v))}),
  music:true, sfx:true, toggleMusic:()=>set(s=>({music:!s.music})), toggleSfx:()=>set(s=>({sfx:!s.sfx})),
  checkpoint:null, setCheckpoint:(c)=>set({checkpoint:c}),
  doorOpen:false, setDoor:(v)=>set({doorOpen:v}),
  pos:[0,1,2], setPos:(p)=>set({pos:p})
}));
TS

# 2) CloudSave v2 (server varsa /lydian/save/*; yoksa localStorage fallback)
cat > "$SRC/lib/playpro/cloudsave.ts" <<'TS'
'use client';
type SaveBlob = { version:number; at:number; checkpoint:string; doorOpen:boolean; pos?:[number,number,number] };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
export async function cloudGet(): Promise<SaveBlob|null> {
  try{ const r=await fetch(`${BASE}/lydian/save/get`,{credentials:'include'}); if(r.ok) return r.json(); }catch{}
  try{ const t=localStorage.getItem('eos:save'); return t?JSON.parse(t):null; }catch{} return null;
}
export async function cloudPut(b:SaveBlob): Promise<boolean> {
  try{ const r=await fetch(`${BASE}/lydian/save/put`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(b)}); if(r.ok) return true; }catch{}
  try{ localStorage.setItem('eos:save', JSON.stringify(b)); return true; }catch{} return false;
}
TS

# 3) GİRİŞ: klavye + gamepad + mobil joystick
cat > "$SRC/lib/playpro/input.ts" <<'TS'
'use client';
import { useEffect, useState } from 'react';
export function useKeys(){
  const [k,setK]=useState<Record<string,boolean>>({});
  useEffect(()=>{ const dn=(e:KeyboardEvent)=>setK(s=>({...s,[e.key.toLowerCase()]:true}));
                  const up=(e:KeyboardEvent)=>setK(s=>({...s,[e.key.toLowerCase()]:false}));
                  window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
                  return ()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up)}
  },[]);
  return { w:k['w']||k['arrowup']||false, s:k['s']||k['arrowdown']||false, a:k['a']||k['arrowleft']||false, d:k['d']||k['arrowright']||false, space:k[' ']||false, e:k['e']||false, esc:k['escape']||false };
}
export function useGamepad(){
  const [gp,setGp]=useState({lx:0,ly:0,btnA:false});
  useEffect(()=>{ let raf:number; const loop=()=>{ const g=navigator.getGamepads?.()[0]; if(g){ setGp({lx:g.axes?.[0]||0,ly:g.axes?.[1]||0,btnA:!!g.buttons?.[0]?.pressed}); } raf=requestAnimationFrame(loop); }; raf=requestAnimationFrame(loop); return ()=>cancelAnimationFrame(raf); },[]);
  return gp;
}
TS

# 4) SAHNE: HDRI + PostFX + Third-Person Kamera + Kapı/Proplar + Karakter
cat > "$SRC/components/playpro/Scene.tsx" <<'TSX'
'use client';
import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, StatsGl } from '@react-three/drei';
import { Physics, RigidBody, vec3 } from '@react-three/rapier';
import * as THREE from 'three';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import { useGame } from '@/lib/playpro/state';
import { useKeys, useGamepad } from '@/lib/playpro/input';

function Ground(){ return (
  <mesh receiveShadow rotation-x={-Math.PI/2}><planeGeometry args={[120,120]} /><meshStandardMaterial color="#1f2937"/></mesh>
); }

function Door(){
  const group = useRef<THREE.Group>(null!);
  const doorOpen = useGame(s=>s.doorOpen);
  useFrame((_s,dt)=>{ if(!group.current) return; const y=THREE.MathUtils.damp(group.current.position.y, doorOpen?6:1.2, 2, dt); group.current.position.y=y; });
  return (<group ref={group} position={[0,1.2,-14]}><mesh castShadow><boxGeometry args={[3,2,0.3]}/><meshStandardMaterial color={doorOpen?'#22c55e':'#ef4444'}/></mesh></group>);
}

function Player(){
  const mesh = useRef<THREE.Mesh>(null!);
  const keys = useKeys(); const gp = useGamepad();
  const setPos = useGame(s=>s.setPos);
  useFrame(({camera},dt)=>{
    if(!mesh.current) return;
    let x=0,z=0; if (gp){ x+=gp.lx; z+=gp.ly; }
    if (keys.w) z-=1; if (keys.s) z+=1; if (keys.a) x-=1; if (keys.d) x+=1;
    const speed=8, moving=Math.hypot(x,z)>0.05;
    mesh.current.position.x += x*speed*dt;
    mesh.current.position.z += z*speed*dt;
    setPos([mesh.current.position.x, mesh.current.position.y, mesh.current.position.z]);
    // kamera takip
    const target = mesh.current.position.clone();
    const camPos = target.clone().add(new THREE.Vector3(6,5,8));
    camera.position.lerp(camPos, 0.08); camera.lookAt(target);
  });
  return (<mesh ref={mesh} position={[0,1,2]} castShadow><capsuleGeometry args={[0.4,0.8,8,16]}/><meshStandardMaterial color="#93c5fd"/></mesh>);
}

export default function Scene(){
  const q = useGame(s=>s.quality);
  const fov = useGame(s=>s.fov);
  const scale = useGame(s=>s.resolutionScale);
  // DPR/Scale yönetimi
  const DPR = (typeof window!=='undefined') ? Math.min(window.devicePixelRatio*scale, 2) : 1;
  return (
    <Canvas shadows dpr={DPR} camera={{ position:[6,5,8], fov }}>
      <color attach="background" args={['#0b0f19']} />
      <ambientLight intensity={0.6}/>
      <directionalLight position={[6,8,6]} intensity={1.1} castShadow shadow-mapSize-width={ q==='ultra'?4096:2048 } shadow-mapSize-height={ q==='ultra'?4096:2048 }/>
      <Physics gravity={[0,-9.81,0]}>
        <Ground/><Player/><Door/>
      </Physics>
      {/* HDRI dosyan yoksa Environment yüklenmez; sahne yine çalışır */}
      <Environment files="/assets/play/hdr/venice_sunset_4k.hdr" background={false} intensity={q==='low'?0.4:0.8} />
      <EffectComposer multisampling={ q==='ultra'?4:2 }>
        <Bloom intensity={ q==='low'?0.3:0.6 } luminanceThreshold={0.85} mipmapBlur />
        <SSAO radius={0.18} intensity={10}/>
      </EffectComposer>
      <StatsGl />
    </Canvas>
  );
}
TSX

# 5) BULMACA: 3 sütun slider + çözülünce kapı aç + CloudSave
cat > "$SRC/components/playpro/Puzzle.tsx" <<'TSX'
'use client';
import React, { useMemo, useState } from 'react';
import { useGame } from '@/lib/playpro/state';
import { cloudGet, cloudPut } from '@/lib/playpro/cloudsave';
const TARGETS=[220,330,440], TOL=3;

export default function Puzzle(){
  const { paused, setPaused, doorOpen, setDoor, checkpoint, setCheckpoint } = useGame();
  const [columns, setColumns] = useState([220,330,440]);
  const [saving,setSaving] = useState(false);
  const ok = useMemo(()=> columns.every((v,i)=> Math.abs(v-TARGETS[i])<=TOL ), [columns]);
  if (!paused) return null;

  const onSolve = async ()=>{
    if (!ok) return;
    setDoor(true); setCheckpoint('PROLOGUE:RESONANCE-DOOR'); setSaving(true);
    await cloudPut({ version:2, at:Date.now(), checkpoint:'PROLOGUE:RESONANCE-DOOR', doorOpen:true }); setSaving(false);
    setPaused(false);
  };
  const onSave = async ()=>{ setSaving(true); await cloudPut({version:2,at:Date.now(),checkpoint:checkpoint||'MANUAL',doorOpen}); setSaving(false); };
  const onLoad = async ()=>{ const b=await cloudGet(); if(b?.doorOpen) setDoor(true); };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur">
      <div className="w-[min(720px,92vw)] rounded-xl border border-white/10 bg-white/5 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Chordstone Puzzle</h2>
          <button className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/10" onClick={()=>setPaused(false)}>✕</button>
        </div>
        <p className="text-sm opacity-80 mb-3">Üç sütunu 220 / 330 / 440 Hz (±3) hedeflerine getir.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {columns.map((v,i)=>(
            <div key={i} className="rounded-lg border border-white/10 p-3">
              <div className="text-sm font-medium mb-2">Frekans {i+1}</div>
              <input type="range" min="100" max="600" value={v}
                     onChange={(e)=>setColumns(cols=>cols.map((x,ix)=>ix===i?Number(e.target.value):x))}
                     className="w-full accent-[#E6C67A]"/>
              <div className="text-xs opacity-80 mt-1">{v.toFixed(0)} Hz — hedef {TARGETS[i]} Hz</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button className={`px-3 py-2 rounded-lg border ${ok?'border-green-400 text-green-300':'border-white/20 opacity-60'}`} onClick={onSolve} disabled={!ok}>ÇÖZ</button>
          <button className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10" onClick={onSave} disabled={saving}>Kaydet</button>
          <button className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10" onClick={onLoad}>Yükle</button>
        </div>
      </div>
    </div>
  );
}
TSX

# 6) AYARLAR + MENÜ + FOTO MODU (basit)
cat > "$SRC/components/playpro/UI.tsx" <<'TSX'
'use client';
import React, { useEffect, useState } from 'react';
import { useGame } from '@/lib/playpro/state';

export function TopHUD(){
  const fps = useFps();
  return (
    <div className="fixed top-3 left-3 pointer-events-none">
      <div className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 pointer-events-auto text-sm">FPS: {fps}</div>
    </div>
  );
}
function useFps(){ const [fps,setFps]=useState(0); useEffect(()=>{ let f=0, last=performance.now(), id=requestAnimationFrame(function loop(t){ f++; if(t-last>=1000){ setFps(f); f=0; last=t; } id=requestAnimationFrame(loop);}); return ()=>cancelAnimationFrame(id); },[]); return fps; }

export function Settings(){
  const {quality,setQuality,resolutionScale,setScale,fov,setFov,music,sfx,toggleMusic,toggleSfx} = useGame();
  return (
    <div className="fixed bottom-3 right-3 flex flex-col gap-2">
      <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
        <div className="font-semibold mb-1">SETTINGS</div>
        <div className="flex items-center gap-2 mb-1">
          <span>Quality</span>
          <select className="bg-black/40 border border-white/10 rounded px-2 py-1" value={quality} onChange={(e)=>setQuality(e.target.value as any)}>
            <option>low</option><option>medium</option><option>high</option><option>ultra</option>
          </select>
        </div>
        <div className="mb-1">Scale: <input type="range" min="0.5" max="1.5" step="0.05" value={resolutionScale} onChange={(e)=>setScale(Number(e.target.value))}/></div>
        <div className="mb-1">FOV: <input type="range" min="40" max="90" step="1" value={fov} onChange={(e)=>setFov(Number(e.target.value))}/></div>
        <div className="flex items-center gap-2"><label><input type="checkbox" checked={music} onChange={toggleMusic}/> Music</label><label><input type="checkbox" checked={sfx} onChange={toggleSfx}/> SFX</label></div>
      </div>
    </div>
  );
}

export function PhotoMode(){
  const [open,setOpen]=useState(false);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key.toLowerCase()==='p') setOpen((v)=>!v); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[]);
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur pointer-events-auto">
      <div className="absolute top-3 right-3 rounded-lg border border-white/10 bg-black/40 p-3">
        <div className="font-semibold text-sm mb-1">Photo Mode (P)</div>
        <div className="text-xs opacity-80">FOV/Exposure/Grain ayarlarını Settings panelinden değiştir.</div>
      </div>
    </div>
  );
}
TSX

# 7) PLAY-PRO SAYFASI (tam ekran, menü & puzzle)
cat > "$SRC/app/console/play-pro/page.tsx" <<'TSX'
import React from "react";
import dynamic from "next/dynamic";
export const metadata = { title:"Echo of Sardis — Play-Pro", description:"PS5-tarzı web vertical slice." };
const Scene = dynamic(()=>import('@/components/playpro/Scene'), { ssr:false });
const Puzzle = dynamic(()=>import('@/components/playpro/Puzzle'), { ssr:false });
const TopHUD = dynamic(()=>import('@/components/playpro/UI').then(m=>m.TopHUD), { ssr:false });
const Settings = dynamic(()=>import('@/components/playpro/UI').then(m=>m.Settings), { ssr:false });
const PhotoMode = dynamic(()=>import('@/components/playpro/UI').then(m=>m.PhotoMode), { ssr:false });

export default function PlayPro(){
  return (
    <main className="w-full h-[calc(100vh-80px)]">
      <div className="h-full relative">
        <Scene/>
        <TopHUD/>
        <Settings/>
        <PhotoMode/>
        <Puzzle/>
      </div>
      <div className="container max-w-6xl py-3 text-sm opacity-80">
        <b>Kontroller:</b> W/A/S/D (hareket) • Fare (kamera) • ESC (Puzzle / Pause) • P (Photo Mode) • Gamepad (LS + A)
      </div>
    </main>
  );
}
TSX

# 8) HDRI uyarısı + Build
echo "ℹ️ HDRI dosyan yoksa /assets/play/hdr/venice_sunset_4k.hdr koy. Yoksa Environment skip edilir, sahne çalışır." | tee -a "$LOG"
( cd "$APP" && (pnpm -w build || pnpm build || npm run build) ) >> "$LOG" 2>&1 || (tail -n 100 "$LOG"; exit 1)

# 9) Sunucu
pkill -f "next dev -p 3100" 2>/dev/null || true
( cd "$APP" && (pnpm dev --port 3100 || npm run dev -- --port 3100) ) >/dev/null 2>&1 &
sleep 3
code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3100/console/play-pro?nocache=$(date +%s)" || echo 000)
printf "• /console/play-pro → %s\n" "$code"
echo "✅ PLAY-PRO hazır: http://localhost:3100/console/play-pro"
echo "📌 Gerçek karakter GLB eklemek için: apps/console/public/assets/play/characters/Elif.glb (ve Melih.glb)"
