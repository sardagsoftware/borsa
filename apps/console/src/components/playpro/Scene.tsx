'use client';
import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, StatsGl, ContactShadows } from '@react-three/drei';
import { Perf } from 'r3f-perf';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { EffectComposer, Bloom, SSAO, DepthOfField, N8AO } from '@react-three/postprocessing';
import { setupRenderer } from '@/lib/playpro/realism';
import { useGame } from '@/lib/playpro/state';
import CharacterGLB from '@/components/playpro/CharacterGLB';
import AssetHealth from '@/components/playpro/AssetHealth';
import { CHARACTERS } from '@/lib/playpro/char-config';

function Ground(){ return (<mesh receiveShadow rotation-x={-Math.PI/2}><planeGeometry args={[120,120]} /><meshStandardMaterial color="#151b26"/></mesh>); }
function Door(){ const ref=useRef<THREE.Mesh>(null!); const doorOpen=useGame(s=>s.doorOpen); useFrame((_s,dt)=>{ if(!ref.current)return; ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, doorOpen?6:1.2, 2, dt); }); return (<mesh ref={ref} position={[0,1.2,-14]} castShadow><boxGeometry args={[3,2,0.3]}/><meshStandardMaterial color={doorOpen?'#22c55e':'#ef4444'}/></mesh>); }

export default function Scene(){
  const q = useGame(s=>s.quality);
  const fov= useGame(s=>s.fov);
  const scale=useGame(s=>s.resolutionScale);
  const DPR = (typeof window!=='undefined') ? Math.min(window.devicePixelRatio*scale, 2) : 1;
  const [charIndex, setCharIndex] = useState(0);
  const char = CHARACTERS[charIndex];

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
            <CharacterGLB
              key={charIndex}
              candidates={char.candidates}
              idle={char.anims?.idle}
              walk={char.anims?.walk}
              run={char.anims?.run}
            />
          </group>
          <Door/>
        </Physics>
        {/* HDRI yoksa Environment sessizce atlar (404 ok) */}
        <Environment files="/assets/play/hdr/venice_sunset_4k.hdr" background={false} intensity={q==='low'?0.4:0.85} />
        <ContactShadows opacity={0.45} scale={50} blur={2.2} far={12} resolution={ q==='ultra'?2048:1024 } />
        <EffectComposer multisampling={ q==='ultra'?4:2 }>
          <Bloom intensity={ q==='low'?0.35:0.7 } luminanceThreshold={0.85} mipmapBlur />
          <N8AO aoRadius={0.5} intensity={1} />
          <DepthOfField focusDistance={0.02} focalLength={0.025} bokehScale={1.5}/>
        </EffectComposer>
        {process.env.NODE_ENV === 'development' && <Perf position="top-left" />}
        <StatsGl />
      </Canvas>
      <AssetHealth/>
      <div className="fixed top-20 right-3 z-40 pointer-events-none">
        <div className="pointer-events-auto rounded-lg border border-white/10 bg-black/50 backdrop-blur p-3 text-xs">
          <div className="font-semibold mb-2">KARAKTER SEÇ</div>
          <div className="space-y-2">
            {CHARACTERS.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setCharIndex(i)}
                className={`w-full px-3 py-2 rounded text-left transition-all duration-200 ${
                  charIndex === i
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
