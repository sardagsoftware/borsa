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
