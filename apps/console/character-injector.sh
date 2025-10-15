#!/usr/bin/env bash
set -euo pipefail
echo "👤 Character Injector — GLB dedektör + canlı uyarı + gerçek model yükleme"

ROOT="${ROOT:-$(pwd)}"
APP="$ROOT/apps/console"
SRC="$APP/src"
PUB="$APP/public"
LOG="$ROOT/logs/character-injector.log"
mkdir -p "$SRC/components/playpro" "$SRC/lib/playpro" "$PUB/assets/play/{characters,hdr}" logs

# 1) Karakter yapılandırması: nerede arayalım?
cat > "$SRC/lib/playpro/char-config.ts" <<'TS'
export type CharConfig = {
  name: string;
  glb: string;             // public altındaki yol (örn /assets/play/characters/Elif.glb)
  anims?: { idle?: string; walk?: string; run?: string; interact?: string };
};
export const CHARACTERS: CharConfig[] = [
  { name: "Elif Melisa Sarı", glb: "/assets/play/characters/Elif.glb",  anims: { idle: "Idle", walk: "Walk", run: "Run" } },
  { name: "Melih Sarı",       glb: "/assets/play/characters/Melih.glb", anims: { idle: "Idle", walk: "Walk", run: "Run" } }
];
TS

# 2) GLB var mı? — client-side sağlık denetimi + overlay
cat > "$SRC/components/playpro/AssetHealth.tsx" <<'TSX'
'use client';
import React, { useEffect, useState } from "react";
import { CHARACTERS } from "@/lib/playpro/char-config";

export default function AssetHealth(){
  const [health,setHealth] = useState<{path:string; ok:boolean}[]>([]);
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      const checks: {path:string; ok:boolean}[] = [];
      for (const c of CHARACTERS){
        try{
          const r = await fetch(c.glb, { method:'HEAD', cache:'no-store' });
          checks.push({ path: c.glb, ok: r.ok });
        }catch{ checks.push({ path:c.glb, ok:false }); }
      }
      if (mounted) setHealth(checks);
    })();
    return ()=>{ mounted = false; }
  },[]);
  if (!health.length) return null;
  return (
    <div className="fixed top-3 right-3 z-40 pointer-events-none">
      <div className="pointer-events-auto rounded-lg border border-white/10 bg-black/50 backdrop-blur p-3 text-xs">
        <div className="font-semibold mb-1">ASSETS</div>
        <ul className="space-y-1">
          {health.map(h=>(
            <li key={h.path} className={h.ok ? "text-green-300" : "text-red-300"}>
              {h.ok ? "✔" : "✖"} {h.path}
            </li>
          ))}
        </ul>
        <div className="opacity-70 mt-2">GLB bulunmazsa sahne kapsül ile açılır.</div>
      </div>
    </div>
  );
}
TSX

# 3) GLB yükleyici + animasyon (varsa) + fallback kapsül
cat > "$SRC/components/playpro/CharacterGLB.tsx" <<'TSX'
'use client';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/lib/playpro/state";
import { useKeys, useGamepad } from "@/lib/playpro/input";

type Props = { src: string; idle?: string; walk?: string; run?: string; color?: string };

export default function CharacterGLB({ src, idle="Idle", walk="Walk", run="Run", color="#93c5fd" }: Props){
  const ref = useRef<THREE.Group>(null!);
  const [hasModel, setHasModel] = useState(false);
  const setPos = useGame(s=>s.setPos);
  const keys = useKeys();
  const gp = useGamepad();

  // Try to load GLB, fallback to capsule on error
  let scene: any = null;
  let animations: any[] = [];
  try {
    const loaded = useGLTF(src, true) as any;
    scene = loaded.scene;
    animations = loaded.animations || [];
    if (scene && !hasModel) setHasModel(true);
  } catch {
    if (hasModel) setHasModel(false);
  }

  const { actions } = useAnimations(animations, ref);

  // Animation handling
  useEffect(()=>{ 
    if (!hasModel || !actions || !idle) return;
    actions[idle]?.reset()?.fadeIn(0.2)?.play();
    return ()=> actions[idle]?.fadeOut(0.1);
  },[hasModel, actions, idle]);

  // Movement and camera follow
  useFrame(({camera}, dt)=>{ 
    if (!ref.current) return;
    let x=0, z=0;
    if (gp) { x += gp.lx; z += gp.ly; }
    if (keys.w) z -= 1;
    if (keys.s) z += 1;
    if (keys.a) x -= 1;
    if (keys.d) x += 1;
    
    const speed = 7;
    ref.current.position.x += x * speed * dt;
    ref.current.position.z += z * speed * dt;
    
    const target = ref.current.position.clone();
    setPos([target.x, target.y, target.z]);
    camera.position.lerp(target.clone().add(new THREE.Vector3(6, 5, 8)), 0.08);
    camera.lookAt(target);
  });

  if (!hasModel || !scene){
    return (
      <mesh ref={ref as any} position={[0,1,2]} castShadow>
        <capsuleGeometry args={[0.4,0.8,8,16]}/>
        <meshStandardMaterial color={color}/>
      </mesh>
    );
  }

  // Auto-scale GLB to reasonable size
  const scale = useMemo(()=> {
    try {
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const target = 1.8; // ~human height
      const longest = Math.max(size.x, size.y, size.z) || 1;
      return target / longest;
    } catch {
      return 1;
    }
  },[scene]);

  return (
    <group ref={ref} position={[0,1,2]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}
TSX

# 4) Sahneyi gerçek karakteri yükleyecek şekilde güncelle (fallback kapsül)
cat > "$SRC/components/playpro/Scene.tsx" <<'TSX'
'use client';
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, StatsGl } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import { useGame } from '@/lib/playpro/state';
import AssetHealth from '@/components/playpro/AssetHealth';
import CharacterGLB from '@/components/playpro/CharacterGLB';
import Boss from './Boss';
import Weather from './Weather';
import CombatController from './CombatController';
import { CHARACTERS } from '@/lib/playpro/char-config';

function Ground(){ return (<mesh receiveShadow rotation-x={-Math.PI/2}><planeGeometry args={[120,120]} /><meshStandardMaterial color="#1f2937"/></mesh>); }
function Door(){ const ref=useRef<THREE.Mesh>(null!); const doorOpen=useGame(s=>s.doorOpen); useFrame((_s,dt)=>{ if(!ref.current)return; ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, doorOpen?6:1.2, 2, dt); }); return (<mesh ref={ref} position={[0,1.2,-14]} castShadow><boxGeometry args={[3,2,0.3]}/><meshStandardMaterial color={doorOpen?'#22c55e':'#ef4444'}/></mesh>); }

export default function Scene(){
  const q = useGame(s=>s.quality); 
  const fov = useGame(s=>s.fov); 
  const scale = useGame(s=>s.resolutionScale);
  const [bossDefeated, setBossDefeated] = useState(false);
  const DPR = (typeof window!=='undefined') ? Math.min(window.devicePixelRatio*scale, 2) : 1;
  const char = CHARACTERS[0]; // Default: Elif
  
  return (
    <>
      <CombatController />
      <Canvas shadows dpr={DPR} camera={{ position:[6,5,8], fov }}>
        <color attach="background" args={['#0b0f19']} />
        <ambientLight intensity={0.6}/>
        <directionalLight position={[6,8,6]} intensity={1.1} castShadow shadow-mapSize-width={ q==='ultra'?4096:2048 } shadow-mapSize-height={ q==='ultra'?4096:2048 }/>
        <Physics gravity={[0,-9.81,0]}>
          <Ground/>
          <CharacterGLB src={char.glb} idle={char.anims?.idle} walk={char.anims?.walk} run={char.anims?.run} />
          <Door/>
          {!bossDefeated && <Boss onDefeat={() => setBossDefeated(true)} />}
        </Physics>
        <Weather intensity={0.6} />
        <Environment preset="sunset" background={false} intensity={q==='low'?0.4:0.8} />
        <EffectComposer multisampling={ q==='ultra'?4:2 }>
          <Bloom intensity={ q==='low'?0.3:0.6 } luminanceThreshold={0.85} mipmapBlur />
          <SSAO radius={0.18} intensity={10}/>
        </EffectComposer>
        <StatsGl />
      </Canvas>
      <AssetHealth/>
    </>
  );
}
TSX

# 5) Play-Pro sayfası (güncel importlar)
cat > "$SRC/app/console/play-pro/page.tsx" <<'TSX'
import React from "react";
import dynamic from "next/dynamic";
export const metadata = { title:"Echo of Sardis — Play-Pro", description:"PS5-tarzı web vertical slice." };
const Scene = dynamic(()=>import('@/components/playpro/Scene'), { ssr:false });
const Puzzle = dynamic(()=>import('@/components/playpro/Puzzle'), { ssr:false });
const Dialogue = dynamic(()=>import('@/components/playpro/Dialogue'), { ssr:false });
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
        <Dialogue/>
      </div>
      <div className="container max-w-6xl py-3 text-sm opacity-80">
        <b>Kontroller:</b> W/A/S/D (hareket) • Fare (kamera) • F (Saldır) • ESC (Puzzle/menü) • P (Photo Mode) • Enter (Diyalog) • Gamepad (LS + A)
      </div>
    </main>
  );
}
TSX

# 6) Build + Dev + Health
echo "🏗  Build…" | tee -a "$LOG"
( cd "$APP" && (pnpm -w build || pnpm build || npm run build) ) >> "$LOG" 2>&1 || (tail -n 120 "$LOG"; exit 1)
echo "🚀 Dev (3100)…" | tee -a "$LOG"
pkill -f "next dev -p 3100" 2>/dev/null || true
( cd "$APP" && (pnpm dev --port 3100 || npm run dev -- --port 3100) ) >/dev/null 2>&1 &
sleep 3
code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3100/console/play-pro?nocache=$(date +%s)" || echo 000)
printf "• /console/play-pro → %s\n" "$code"
echo "✅ Character Injector hazır: http://localhost:3100/console/play-pro"
echo "📌 GLB koy: public/assets/play/characters/Elif.glb | Melih.glb  (Anim clip adları: Idle/Walk/Run)"
