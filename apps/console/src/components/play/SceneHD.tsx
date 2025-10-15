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
