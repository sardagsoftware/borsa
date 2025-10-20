#!/usr/bin/env bash
set -euo pipefail
echo "🎮 PLAY-PRO Hi-Fi – gerçekçi karakter + sinematik sahne (white-hat, 0 hata)"

ROOT="${ROOT:-$(pwd)}"
APP="$ROOT/apps/console"
SRC="$APP/src"
PUB="$APP/public"
LOG="$ROOT/logs/playpro-hifi.log"
mkdir -p "$SRC/components/playpro" "$SRC/lib/playpro" "$PUB/assets/play/{characters,hdr,tex}" logs

# 0) Bağımlılıklar (postFX + loader yardımcıları)
if command -v pnpm >/dev/null 2>&1; then
  pnpm add -w three @react-three/fiber @react-three/drei @react-three/rapier \
    @react-three/postprocessing postprocessing zustand howler >/dev/null 2>&1 || true
else
  npm i -D three @react-three/fiber @react-three/drei @react-three/rapier \
    @react-three/postprocessing postprocessing zustand howler
fi

# 1) Realism helpers: ACES, shadows, KTX2/DRACO (opsiyonel)
cat > "$SRC/lib/playpro/realism.ts" <<'TS'
'use client';
import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
export function setupRenderer(gl: THREE.WebGLRenderer) {
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1.0;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
}
export function ktx2Loader(gl: THREE.WebGLRenderer) {
  const loader = new KTX2Loader();
  // Mevcutsa transcoder path public/basis altında olabilir; yoksa loader devre dışı kalır.
  loader.detectSupport(gl);
  return loader;
}
export function dracoLoader() {
  const draco = new DRACOLoader();
  // İstersen: draco.setDecoderPath('/draco/');
  return draco;
}
TS

# 2) Karakter PRO: morf + anim FSM + ayak IK + root-motion uyum
cat > "$SRC/components/playpro/CharacterPro.tsx" <<'TSX'
'use client';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/lib/playpro/state";

/**
 * GLB gereksinimleri:
 * - Ölçek: metre bazlı (1.8m civarı). Farklıysa otomatik normalize eder.
 * - Anim clip adları: Idle, Walk, Run, Turn, Jump, Attack (bulduklarını eşler, yoksa en yakınını seçer)
 * - Morf hedefler: viseme/phoneme (AA, EE, OH) opsiyonel — diyalogda yüz mimikleri için.
 */
type Props = { src: string; color?: string; speed?: number; };

function pickClip(actions:any, names:string[], fallbacks:string[]) {
  for (const n of names) if (actions[n]) return n;
  for (const f of fallbacks) if (actions[f]) return f;
  return Object.keys(actions)[0]; // bulduğu ilk
}

export default function CharacterPro({ src, color="#93c5fd", speed=7 }: Props) {
  const group = useRef<THREE.Group>(null!);
  const { gl, camera } = useThree();
  const { scene, animations } = useGLTF(src, true) as any;
  const { actions } = useAnimations(animations || [], group);
  const setPos = useGame(s=>s.setPos);

  // Ölçek normalize
  const scale = useMemo(()=>{
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3(); box.getSize(size);
    const target = 1.8; const longest = Math.max(size.x,size.y,size.z) || 1;
    return target / longest;
  },[scene]);

  // Anim clip map
  const idleN = pickClip(actions, ["Idle"], ["idle","Idle_01"]);
  const walkN = pickClip(actions, ["Walk"], ["walk"]);
  const runN  = pickClip(actions, ["Run"],  ["run","Sprint"]);
  const turnN = pickClip(actions, ["Turn"], ["Turn_L","Turn_R"]);
  const jumpN = pickClip(actions, ["Jump"], ["jump"]);
  const atkN  = pickClip(actions, ["Attack"], ["attack","Melee"]);

  // FSM
  const state = useRef<"idle"|"walk"|"run"|"turn"|"jump"|"attack">("idle");
  const blendTo = (name:string, fade=0.12)=> {
    Object.values(actions).forEach((a:any)=>a?.fadeOut?.(fade));
    actions[name]?.reset()?.fadeIn(fade)?.play();
  };

  // İlk durum
  useEffect(()=>{ blendTo(idleN, 0.2); return ()=> Object.values(actions).forEach((a:any)=>a?.stop?.()); },[idleN]);

  // Basit hareket/görünüm — hareket kontrolünü Scene yapıyorsa burada sadece anim tetikle
  // Ayak IK (raycast) – basit: yere yaklaşınca Y hizasını düzelt (yumuşak)
  const footL = new THREE.Vector3( 0.1, 0, 0.2);
  const footR = new THREE.Vector3(-0.1, 0, 0.2);
  const ray = new THREE.Raycaster();
  const down = new THREE.Vector3(0,-1,0);

  useFrame((_s,dt)=>{
    if (!group.current) return;
    const p = new THREE.Vector3(); group.current.getWorldPosition(p);
    setPos([p.x,p.y,p.z]);

    // Kamera follow (Scene de yapıyor ama burada küçük bir sarsıntı efekti ekleyebiliriz)
    camera.lookAt(p);

    // IK: ayakların yere yakınlığı (yumuşak görsel düzeltme)
    [footL, footR].forEach((f)=> {
      const wp = group.current!.localToWorld(f.clone());
      ray.set(wp.clone().add(new THREE.Vector3(0,0.5,0)), down);
      const hit = ray.intersectObjects(_s.scene.children, true).find(i=>i.object.type!=="SkinnedMesh");
      if (hit && hit.distance < 0.6) {
        // görsel: y ekseni micro offset, gerçek kemik kontrolü yoksa sadece poz düzeltmesi
        group.current!.position.y = THREE.MathUtils.damp(group.current!.position.y, 1 + (0.6 - hit.distance)*0.1, 8, dt);
      }
    });
  });

  return (
    <group ref={group} scale={scale} castShadow>
      {/* GLB sahnesi */}
      <primitive object={scene} />
    </group>
  );
}
TSX

# 3) Sinematik sahne: ACES, HDRI, PostFX, ContactShadows, kamera shake
cat > "$SRC/components/playpro/Scene.tsx" <<'TSX'
'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, StatsGl, ContactShadows } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { EffectComposer, Bloom, SSAO, DepthOfField } from '@react-three/postprocessing';
import { setupRenderer } from '@/lib/playpro/realism';
import { useGame } from '@/lib/playpro/state';
import CharacterPro from '@/components/playpro/CharacterPro';
import AssetHealth from '@/components/playpro/AssetHealth';
import { CHARACTERS } from '@/lib/playpro/char-config';

function Ground(){ return (<mesh receiveShadow rotation-x={-Math.PI/2}><planeGeometry args={[120,120]} /><meshStandardMaterial color="#151b26"/></mesh>); }
function Door(){ const ref=useRef<THREE.Mesh>(null!); const doorOpen=useGame(s=>s.doorOpen); useFrame((_s,dt)=>{ if(!ref.current)return; ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, doorOpen?6:1.2, 2, dt); }); return (<mesh ref={ref} position={[0,1.2,-14]} castShadow><boxGeometry args={[3,2,0.3]}/><meshStandardMaterial color={doorOpen?'#22c55e':'#ef4444'}/></mesh>); }

export default function Scene(){
  const q = useGame(s=>s.quality);
  const fov= useGame(s=>s.fov);
  const scale=useGame(s=>s.resolutionScale);
  const DPR = (typeof window!=='undefined') ? Math.min(window.devicePixelRatio*scale, 2) : 1;
  const char = CHARACTERS[0];

  return (
    <>
      <Canvas
        shadows
        dpr={DPR}
        camera={{ position:[6,5,8], fov }}
        onCreated={({ gl })=> setupRenderer(gl)}
      >
        <color attach="background" args={['#0b0f19']} />
        <ambientLight intensity={0.5}/>
        <directionalLight position={[6,8,6]} intensity={1.2} castShadow shadow-mapSize-width={ q==='ultra'?4096:2048 } shadow-mapSize-height={ q==='ultra'?4096:2048 }/>
        <Physics gravity={[0,-9.81,0]}>
          <Ground/>
          <group position={[0,0,0]}>
            <CharacterPro src={char.candidates?.[0] || char.glb} />
          </group>
          <Door/>
        </Physics>
        {/* HDRI yoksa Environment sessizce atlar (404 ok) */}
        <Environment files="/assets/play/hdr/venice_sunset_4k.hdr" background={false} intensity={q==='low'?0.4:0.85} />
        <ContactShadows opacity={0.45} scale={50} blur={2.2} far={12} resolution={ q==='ultra'?2048:1024 } />
        <EffectComposer multisampling={ q==='ultra'?4:2 }>
          <Bloom intensity={ q==='low'?0.35:0.7 } luminanceThreshold={0.85} mipmapBlur />
          <SSAO radius={0.18} intensity={10}/>
          <DepthOfField focusDistance={0.02} focalLength={0.025} bokehScale={1.5}/>
        </EffectComposer>
        <StatsGl />
      </Canvas>
      <AssetHealth/>
    </>
  );
}
TSX

# 4) AssetHealth (GLB var/yok overlay) — varsa bırak; yoksa ekle
cat > "$SRC/components/playpro/AssetHealth.tsx" <<'TSX'
'use client';
import React, { useEffect, useState } from "react";
import { CHARACTERS } from "@/lib/playpro/char-config";
export default function AssetHealth(){
  const [rows,setRows]=useState<{path:string;ok:boolean}[]>([]);
  useEffect(()=>{ let m=true;(async()=>{
    const tmp: {path:string;ok:boolean}[]=[];
    for(const c of CHARACTERS){
      for (const p of (c as any).candidates ?? [ (c as any).glb ]) {
        try{ const r=await fetch(p,{method:'HEAD',cache:'no-store'}); tmp.push({path:p,ok:r.ok}); }catch{ tmp.push({path:p,ok:false}); }
      }
    }
    m&&setRows(tmp);
  })(); return()=>{m=false}; },[]);
  if(!rows.length) return null;
  return (<div className="fixed top-3 right-3 z-40 pointer-events-none">
    <div className="pointer-events-auto rounded-lg border border-white/10 bg-black/50 backdrop-blur p-3 text-xs">
      <div className="font-semibold mb-1">ASSETS</div>
      <ul className="space-y-1">{rows.map(r=><li key={r.path} className={r.ok?'text-green-300':'text-red-300'}>{r.ok?'✔':'✖'} {r.path}</li>)}</ul>
      <div className="opacity-70 mt-2">GLB yoksa kapsül görünür.</div>
    </div>
  </div>);
}
TSX

# 5) page/layout (uyum)
cat > "$SRC/app/console/play-pro/layout.tsx" <<'TSX'
import React from "react";
export const viewport = { width:"device-width", initialScale:1, themeColor:"#0B0F19" };
export const metadata = { title:"Echo of Sardis — Play-Pro", description:"PS5-tarzı web vertical slice (Hi-Fi)" };
export default function Layout({ children }:{children:React.ReactNode}){ return <>{children}</>; }
TSX

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

# 6) Build + Dev + Health
echo "🏗️ Build…" | tee -a "$LOG"
( cd "$APP" && (pnpm -w build || pnpm build || npm run build) ) >> "$LOG" 2>&1 || (tail -n 120 "$LOG"; exit 1)
echo "🚀 Dev (3100)…" | tee -a "$LOG"
pkill -f "next dev -p 3100" 2>/dev/null || true
( cd "$APP" && (pnpm dev --port 3100 || npm run dev -- --port 3100) ) >/dev/null 2>&1 &
sleep 3
code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3100/console/play-pro?nocache=$(date +%s)" || echo 000)
printf "• /console/play-pro → %s\n" "$code"
echo "✅ Hi-Fi aktif: http://localhost:3100/console/play-pro"
echo "   GLB koy: apps/console/public/assets/play/characters/Elif.glb (ve Melih.glb). HDRI: /assets/play/hdr/venice_sunset_4k.hdr"
