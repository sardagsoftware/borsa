#!/usr/bin/env bash
set -euo pipefail
echo "👤 GLB Auto-Detect • Copy • Verify for /console/play-pro"

ROOT="${ROOT:-$(pwd)}"
APP="$ROOT/apps/console"
SRC="$APP/src"
PUB="$APP/public"
CHAR_DIR="$APP/public/assets/play/characters"
LOG="$ROOT/logs/fix-character-paths.log"
mkdir -p "$CHAR_DIR" "$SRC/lib/playpro" "$SRC/components/playpro" logs

# 1) Sistemde GLB araması (sadece proje ağacı)
echo "🔎 GLB scan (project)…" | tee "$LOG"
mapfile -t FOUND < <(find "$ROOT" -type f \( -name "*.glb" -o -name "*.gltf" \) \
  ! -path "*/node_modules/*" ! -path "*/.next/*" 2>/dev/null | sed "s|$ROOT||g")
if [ ${#FOUND[@]} -gt 0 ]; then
  printf "• Found %d GLB candidate(s):\n" "${#FOUND[@]}" | tee -a "$LOG"
  printf "  - %s\n" "${FOUND[@]}" | tee -a "$LOG"
else
  echo "⚠️  Proje içinde GLB bulunamadı. Yolları hazır: $CHAR_DIR/Elif.glb ve $CHAR_DIR/Melih.glb" | tee -a "$LOG"
fi

# 2) Olası yerlerden otomatik kopyalama (varsa)
copy_if_exists () {
  local src="$1" dst="$2"
  if [ -f "$ROOT$src" ]; then
    cp "$ROOT$src" "$dst"
    echo "✅ Copied $src -> $(basename "$dst")" | tee -a "$LOG"
  fi
}
mkdir -p "$CHAR_DIR"
# Tahmini kaynaklar
copy_if_exists "/public/assets/models/character.glb" "$CHAR_DIR/Elif.glb"
copy_if_exists "/public/assets/models/Elif.glb"      "$CHAR_DIR/Elif.glb"
copy_if_exists "/public/assets/models/Melih.glb"     "$CHAR_DIR/Melih.glb"
copy_if_exists "/apps/console/public/assets/models/Elif.glb"  "$CHAR_DIR/Elif.glb" || true
copy_if_exists "/apps/console/public/assets/models/Melih.glb" "$CHAR_DIR/Melih.glb" || true

# 3) İstemci: çoklu aday URL denetleyici (HEAD ile 200 dönen ilkini seç)
cat > "$SRC/lib/playpro/char-config.ts" <<'TS'
export type CharConfig = { name:string; candidates:string[]; anims?:{idle?:string;walk?:string;run?:string} };
export const CHARACTERS: CharConfig[] = [
  {
    name: "Elif Melisa Sarı",
    candidates: [
      "/assets/play/characters/Elif.glb",
      "/assets/models/Elif.glb",
      "/assets/models/character.glb",
      "/assets/play/characters/character.glb"
    ],
    anims: { idle:"Idle", walk:"Walk", run:"Run" }
  },
  {
    name: "Melih Sarı",
    candidates: [
      "/assets/play/characters/Melih.glb",
      "/assets/models/Melih.glb"
    ],
    anims: { idle:"Idle", walk:"Walk", run:"Run" }
  }
];
TS

cat > "$SRC/lib/playpro/char-resolver.ts" <<'TS'
'use client';
export async function resolveFirst200(paths:string[]): Promise<string|null>{
  for (const p of paths){
    try {
      const r = await fetch(p, { method:'HEAD', cache:'no-store' });
      if (r.ok) return p;
    } catch {}
  }
  return null;
}
TS

# 4) CharacterGLB: adayları dene; overlay mesajları
cat > "$SRC/components/playpro/CharacterGLB.tsx" <<'TSX'
'use client';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, useAnimations, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveFirst200 } from "@/lib/playpro/char-resolver";

type Props = { candidates: string[]; idle?: string; walk?: string; run?: string; color?: string };

export default function CharacterGLB({ candidates, idle="Idle", walk="Walk", run="Run", color="#93c5fd" }: Props){
  const [src,setSrc] = useState<string|null>(null);
  const [status,setStatus] = useState<"loading"|"ok"|"missing">("loading");

  useEffect(()=>{ (async ()=>{
    const ok = await resolveFirst200(candidates);
    if (ok){ setSrc(ok); setStatus("ok"); } else { setStatus("missing"); }
  })(); }, [candidates]);

  const ref = useRef<THREE.Group>(null!);
  // GLB varsa yükle
  let scene:any=null, actions:any=null;
  if (src){
    const gltf = useGLTF(src, true) as any;
    scene = gltf.scene; const anims = gltf.animations || [];
    actions = useAnimations(anims, ref).actions;
    useEffect(()=>{ actions?.[idle]?.reset()?.fadeIn(0.2)?.play(); return ()=> actions?.[idle]?.fadeOut(0.1); },[actions, idle]);
  }

  useFrame(()=>{ /* dış kamera takip store'dan yapılıyor, burada yok */ });

  // Fallback kapsül
  if (status!=="ok" || !scene){
    return (
      <group>
        <mesh position={[0,1,2]} castShadow>
          <capsuleGeometry args={[0.4,0.8,8,16]}/>
          <meshStandardMaterial color={color}/>
        </mesh>
        <group position={[0,2.8,2]}>
          <Text fontSize={0.22} color={status==="missing" ? "#ef4444" : "#e6c67a"} anchorX="center" anchorY="middle">
            {status==="missing" ? "GLB NOT FOUND" : "Loading…"}
          </Text>
        </group>
      </group>
    );
  }

  // Boyut normalizasyonu
  const scale = useMemo(()=> {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3(); box.getSize(size);
    const target = 1.8; const longest = Math.max(size.x,size.y,size.z) || 1;
    return target / longest;
  },[scene]);

  return (<group ref={ref} position={[0,0,0]} scale={scale}><primitive object={scene}/></group>);
}
TSX

# 5) Scene: gerçek karakteri resolver üzerinden çağır; AssetHealth overlay dursun
cat > "$SRC/components/playpro/Scene.tsx" <<'TSX'
'use client';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, StatsGl } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import { useGame } from '@/lib/playpro/state';
import AssetHealth from '@/components/playpro/AssetHealth';
import CharacterGLB from '@/components/playpro/CharacterGLB';
import { CHARACTERS } from '@/lib/playpro/char-config';

function Ground(){ return (<mesh receiveShadow rotation-x={-Math.PI/2}><planeGeometry args={[120,120]} /><meshStandardMaterial color="#1f2937"/></mesh>); }
function Door(){ const ref=useRef<THREE.Mesh>(null!); const doorOpen=useGame(s=>s.doorOpen); useFrame((_s,dt)=>{ if(!ref.current)return; ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, doorOpen?6:1.2, 2, dt); }); return (<mesh ref={ref} position={[0,1.2,-14]} castShadow><boxGeometry args={[3,2,0.3]}/><meshStandardMaterial color={doorOpen?'#22c55e':'#ef4444'}/></mesh>); }

export default function Scene(){
  const q = useGame(s=>s.quality); const fov=useGame(s=>s.fov); const scale=useGame(s=>s.resolutionScale);
  const DPR = (typeof window!=='undefined') ? Math.min(window.devicePixelRatio*scale, 2) : 1;
  const char = CHARACTERS[0];
  return (
    <>
      <Canvas shadows dpr={DPR} camera={{ position:[6,5,8], fov }}>
        <color attach="background" args={['#0b0f19']} />
        <ambientLight intensity={0.6}/>
        <directionalLight position={[6,8,6]} intensity={1.1} castShadow shadow-mapSize-width={ q==='ultra'?4096:2048 } shadow-mapSize-height={ q==='ultra'?4096:2048 }/>
        <Physics gravity={[0,-9.81,0]}>
          <Ground/>
          <group position={[0,0,0]}>
            {/* gerçek model → CharacterGLB aday listesi içinden bulacak */}
            <CharacterGLB candidates={char.candidates} idle={char.anims?.idle} walk={char.anims?.walk} run={char.anims?.run}/>
          </group>
          <Door/>
        </Physics>
        <Environment files="/assets/play/hdr/venice_sunset_4k.hdr" background={false} intensity={q==='low'?0.4:0.8} />
        <EffectComposer multisampling={ q==='ultra'?4:2 }><Bloom intensity={ q==='low'?0.3:0.6 } luminanceThreshold={0.85} mipmapBlur /><SSAO radius={0.18} intensity={10}/></EffectComposer>
        <StatsGl />
      </Canvas>
      <AssetHealth/>
    </>
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
echo "✅ Character Resolver aktif: http://localhost:3100/console/play-pro"
echo "   Sağ üstte ASSETS kutusunda GLB durumunu görürsün (✔ = bulundu, ✖ = yok)."
