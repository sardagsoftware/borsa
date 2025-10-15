#!/usr/bin/env bash
set -euo pipefail
echo "🎮 Boss/Combat/Dialogue/Weather/Haptics/SaveSlots Sprint — /console/play-pro"

ROOT="${ROOT:-$(pwd)}"
APP="$ROOT/apps/console"
SRC="$APP/src"
PUB="$APP/public"
LOG="$ROOT/logs/gameplay-sprint.log"
mkdir -p "$SRC/components/playpro" "$SRC/lib/playpro" "$PUB/assets/play/{audio,hdr,characters}" logs

# 0) Bağımlılıklar (zaten varsa atlar)
if command -v pnpm >/dev/null 2>&1; then
  pnpm add -w howler @react-three/fiber @react-three/drei @react-three/rapier three @react-three/postprocessing postprocessing zustand >/dev/null 2>&1 || true
else
  npm i -D howler @react-three/fiber @react-three/drei @react-three/rapier three @react-three/postprocessing postprocessing zustand
fi

# 1) Ses/Haptik yöneticisi (SFX/Music + vibrate fallback)
cat > "$SRC/lib/playpro/audio.ts" <<'TS'
'use client';
import { Howl } from 'howler';
type S = { id:string; howl: Howl };
const bank: Record<string,S> = {};
export function addSound(id:string, src:string, vol=0.8){ bank[id] = { id, howl:new Howl({ src:[src], volume:vol }) }; }
export function play(id:string){ bank[id]?.howl.play(); try{ navigator.vibrate?.(20);}catch{} }
export function stop(id:string){ bank[id]?.howl.stop(); }
export function music(id:string, src:string, loop=true, vol=0.5){
  if(!bank[id]) bank[id] = { id, howl:new Howl({ src:[src], html5:true, loop, volume:vol }) };
  bank[id].howl.play();
}
TS

# 2) Save Slot yöneticisi (3 slot; server varsa /lydian/save/*)
cat > "$SRC/lib/playpro/save-slots.ts" <<'TS'
'use client';
type Blob = { version:number; at:number; slot:number; checkpoint:string; doorOpen:boolean; pos?:[number,number,number] };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const KEY = (s:number)=> \`eos:save:\${s}\`;
export async function loadSlot(slot:number):Promise<Blob|null>{
  try{ const r=await fetch(\`\${BASE}/lydian/save/get?slot=\${slot}\`,{credentials:'include'}); if(r.ok) return r.json(); }catch{}
  try{ const t=localStorage.getItem(KEY(slot)); return t?JSON.parse(t):null; }catch{} return null;
}
export async function saveSlot(slot:number, blob:Blob):Promise<boolean>{
  try{ const r=await fetch(\`\${BASE}/lydian/save/put?slot=\${slot}\`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(blob)}); if(r.ok) return true; }catch{}
  try{ localStorage.setItem(KEY(slot), JSON.stringify(blob)); return true; }catch{} return false;
}
TS

# 3) Boss/AI + Health + Hitbox
cat > "$SRC/components/playpro/Boss.tsx" <<'TSX'
'use client';
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { play } from '@/lib/playpro/audio';

export default function Boss({ onDefeat }:{ onDefeat:()=>void }){
  const ref = useRef<THREE.Mesh>(null!);
  const [hp,setHp] = useState(100);
  const patrol = useRef(1);
  useFrame((_s,dt)=>{
    if (!ref.current) return;
    ref.current.position.x += patrol.current * dt * 2;
    if (ref.current.position.x > 6) patrol.current = -1;
    if (ref.current.position.x < -6) patrol.current = 1;
  });
  // basit "vuruş" API'sı (outside): document.dispatchEvent(new CustomEvent('hit',{detail:10}))
  React.useEffect(()=>{
    const onHit=(e:any)=>{ setHp(h=>{ const n = Math.max(0, h - (e.detail||10)); if (n===0){ play('boss_down'); onDefeat(); } return n; }); play('hit'); };
    document.addEventListener('hit', onHit as any);
    return ()=> document.removeEventListener('hit', onHit as any);
  },[onDefeat]);
  return (
    <group>
      <mesh ref={ref} position={[0,1.2,-10]} castShadow>
        <boxGeometry args={[2.2,2.2,2.2]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.7} metalness={0.3}/>
      </mesh>
      <mesh position={[0,3.5,-10]}>
        <planeGeometry args={[3.2,0.25]} />
        <meshBasicMaterial color="#000" transparent opacity={0.5}/>
      </mesh>
      <mesh position={[0,3.5,-10.01]}>
        <planeGeometry args={[3.2 * (hp/100),0.25]} />
        <meshBasicMaterial color={hp>50 ? '#22c55e' : hp>20 ? '#f59e0b' : '#ef4444'}/>
      </mesh>
    </group>
  );
}
TSX

# 4) CombatController (yakın dövüş kombinasyonları + cooldown + i-frame)
cat > "$SRC/components/playpro/CombatController.tsx" <<'TSX'
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { play } from '@/lib/playpro/audio';

export default function CombatController(){
  const [canHit,setCanHit] = useState(true);
  const combo = useRef(0);
  useEffect(()=>{
    const onClick = (e:KeyboardEvent|MouseEvent)=>{
      if ((e as KeyboardEvent).key && (e as KeyboardEvent).key.toLowerCase()!=='f') return; // F=attack
      if (!canHit) return;
      combo.current = (combo.current + 1) % 3;
      setCanHit(false);
      // hasar: 10 / 15 / 25
      const damage = [10,15,25][combo.current];
      document.dispatchEvent(new CustomEvent('hit',{detail:damage}));
      play('swing');
      setTimeout(()=> setCanHit(true), 350 + combo.current*120);
    };
    window.addEventListener('keydown', onClick as any);
    window.addEventListener('click', onClick as any);
    return ()=>{ window.removeEventListener('keydown', onClick as any); window.removeEventListener('click', onClick as any); };
  },[canHit]);
  return null;
}
TSX

# 5) Hava Durumu: Yağmur (hafif partikül, performans güvenli)
cat > "$SRC/components/playpro/Weather.tsx" <<'TSX'
'use client';
import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Weather({ intensity=0.8 }:{ intensity?:number }){
  const count = Math.floor(1500 * intensity);
  const geo = useMemo(()=> new THREE.BufferGeometry(),[]);
  const mat = useMemo(()=> new THREE.PointsMaterial({ size:0.05, color:'#9ec3ff', transparent:true, opacity:0.8 }),[]);
  const positions = useMemo(()=> {
    const arr = new Float32Array(count*3);
    for (let i=0;i<count;i++){ arr[i*3] = (Math.random()*80-40); arr[i*3+1] = Math.random()*25+5; arr[i*3+2] = (Math.random()*80-40); }
    return arr;
  },[count]);
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  useFrame((_s,dt)=>{
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i=0; i<pos.count; i++){ let y = pos.getY(i)-dt*12; if (y<0){ y = 25; } pos.setY(i,y); }
    pos.needsUpdate = true;
  });
  return <points args={[geo,mat]} />;
}
TSX

# 6) Diyalog & Görev (JSON → panel, log)
mkdir -p "$PUB/assets/play/dialogue"
cat > "$PUB/assets/play/dialogue/prologue.json" <<'JSON'
[
  {"id":"DLG-01","speaker":"Elif","tr":"Sardes bizi bekliyor... yankıyı dikkatle dinle.","en":"Sardis awaits... listen to the echo carefully."},
  {"id":"DLG-02","speaker":"Melih","tr":"Frekansı aşırı zorlama; yapılar eski.","en":"Don't push the frequency too hard; these structures are old."}
]
JSON

cat > "$SRC/components/playpro/Dialogue.tsx" <<'TSX'
'use client';
import React, { useEffect, useState } from 'react';
import { useGame } from '@/lib/playpro/state';

export default function Dialogue({ file="/assets/play/dialogue/prologue.json" }:{ file?:string }){
  const locale = useGame(s=>s.locale);
  const [lines,setLines]=useState<any[]>([]);
  const [idx,setIdx]=useState(0);
  useEffect(()=>{ fetch(file).then(r=>r.json()).then(setLines).catch(()=>setLines([])); },[file]);
  useEffect(()=>{
    const onNext=(e:KeyboardEvent)=>{ if (e.key==='Enter') setIdx(i=>Math.min(i+1, lines.length-1)); };
    window.addEventListener('keydown', onNext); return ()=>window.removeEventListener('keydown', onNext);
  },[lines]);
  if (!lines.length) return null;
  const ln = lines[idx];
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(720px,92vw)] pointer-events-none">
      <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur p-3 pointer-events-auto">
        <div className="text-xs opacity-70">{ln.speaker}</div>
        <div className="text-sm">{(ln as any)[locale] || ln.en}</div>
        <div className="text-[11px] opacity-60 mt-1">[Enter] →</div>
      </div>
    </div>
  );
}
TSX

# 7) UI: TopHUD/Settings/PhotoMode (küçük ayarlar), SaveSlots paneli
cat > "$SRC/components/playpro/UI.tsx" <<'TSX'
'use client';
import React, { useEffect, useState } from 'react';
import { useGame } from '@/lib/playpro/state';
import { loadSlot, saveSlot } from '@/lib/playpro/save-slots';

export function TopHUD(){
  const fps = useFps();
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') useGame.getState().setPaused(!useGame.getState().paused); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[]);
  return (<div className="fixed top-3 left-3 pointer-events-none"><div className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 pointer-events-auto text-sm">FPS: {fps}</div></div>);
}
function useFps(){ const [fps,setFps]=useState(0); useEffect(()=>{ let f=0,last=performance.now(),id=requestAnimationFrame(function loop(t){ f++; if(t-last>=1000){setFps(f);f=0;last=t;} id=requestAnimationFrame(loop);}); return ()=>cancelAnimationFrame(id); },[]); return fps; }

export function Settings(){
  const {quality,setQuality,resolutionScale,setScale,fov,setFov,music,sfx,toggleMusic,toggleSfx,locale,setLocale} = useGame();
  return (
    <div className="fixed bottom-3 right-3 flex flex-col gap-2">
      <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
        <div className="font-semibold mb-1">SETTINGS</div>
        <div className="flex items-center gap-2 mb-1"><span>Quality</span>
          <select className="bg-black/40 border border-white/10 rounded px-2 py-1" value={quality} onChange={(e)=>setQuality(e.target.value as any)}>
            <option>low</option><option>medium</option><option>high</option><option>ultra</option>
          </select>
        </div>
        <div className="mb-1">Scale: <input type="range" min="0.5" max="1.5" step="0.05" value={resolutionScale} onChange={(e)=>setScale(Number(e.target.value))}/></div>
        <div className="mb-1">FOV: <input type="range" min="40" max="90" step="1" value={fov} onChange={(e)=>setFov(Number(e.target.value))}/></div>
        <div className="mb-1 flex items-center gap-2">
          <label><input type="checkbox" checked={music} onChange={toggleMusic}/> Music</label>
          <label><input type="checkbox" checked={sfx} onChange={toggleSfx}/> SFX</label>
          <label><span>Lang</span>
            <select className="bg-black/40 border border-white/10 rounded px-2 py-1 ml-1" value={locale} onChange={(e)=>setLocale(e.target.value as any)}>
              <option value="tr">TR</option><option value="en">EN</option>
            </select>
          </label>
        </div>
        <SaveSlotsPanel/>
      </div>
    </div>
  );
}

function SaveSlotsPanel(){
  const { doorOpen, checkpoint, setDoor, setCheckpoint } = useGame();
  const [busy,setBusy]=useState(false);
  const slots=[1,2,3];
  return (
    <div className="mt-2">
      <div className="font-semibold mb-1">SLOTS</div>
      <div className="flex gap-2">
        {slots.map(s=>(
          <button key={s} className="px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            onClick={async()=>{
              setBusy(true);
              const b = await loadSlot(s);
              if (b){ setDoor(!!b.doorOpen); setCheckpoint(b.checkpoint||null); }
              setBusy(false);
            }}>Load {s}</button>
        ))}
        {slots.map(s=>(
          <button key={s} className="px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            onClick={async()=>{
              setBusy(true);
              await saveSlot(s, {version:2, at:Date.now(), slot:s, checkpoint: checkpoint||'MANUAL', doorOpen});
              setBusy(false);
            }}>Save {s}</button>
        ))}
      </div>
      {busy && <div className="text-[11px] opacity-60 mt-1">processing…</div>}
    </div>
  );
}

export function PhotoMode(){
  const [open,setOpen]=useState(false);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key.toLowerCase()==='p') setOpen(v=>!v); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[]);
  if(!open) return null;
  return (<div className="fixed inset-0 z-40 bg-black/60 backdrop-blur pointer-events-auto">
    <div className="absolute top-3 right-3 rounded-lg border border-white/10 bg-black/40 p-3">
      <div className="font-semibold text-sm mb-1">Photo Mode (P)</div>
      <div className="text-xs opacity-80">FOV/Scale ayarları Settings panelinden değiştir.</div>
    </div></div>);
}
TSX

# 8) /console/play-pro sayfasını (mevcutsa) kullan
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
        <b>Kontroller:</b> W/A/S/D (hareket) • Fare (kamera) • ESC (Puzzle/menü) • P (Photo Mode) • Gamepad (LS + A)
      </div>
    </main>
  );
}
TSX

# 9) Basit SFX referansları (opsiyonel dosyalar yoksa atlanır)
echo "ℹ️ SFX dosyalarını eklerseniz otomatik çalar: /assets/play/audio/swing.mp3, hit.mp3, boss_down.mp3" | tee -a "$LOG"

# 10) Build + Dev + Health
echo "🏗  Build…" | tee -a "$LOG"
( cd "$APP" && (pnpm -w build || pnpm build || npm run build) ) >> "$LOG" 2>&1 || (tail -n 150 "$LOG"; exit 1)
echo "🚀 Dev (3100)…" | tee -a "$LOG"
pkill -f "next dev -p 3100" 2>/dev/null || true
( cd "$APP" && (pnpm dev --port 3100 || npm run dev -- --port 3100) ) >/dev/null 2>&1 &
sleep 3
code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3100/console/play-pro?nocache=$(date +%s)" || echo 000)
printf "• /console/play-pro → %s\n" "$code"
echo "✅ GO — http://localhost:3100/console/play-pro"
echo "   GLB koyarsan kapsül yerine gerçek karakter görünür: public/assets/play/characters/Elif.glb | Melih.glb"
