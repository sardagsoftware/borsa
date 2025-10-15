'use client';
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useKeys, useGamepad } from '@/lib/play/input';
import { useGame } from '@/lib/play/store';

export default function CharacterController() {
  const rbRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const keys = useKeys();
  const pad = useGamepad();
  const { paused, setPos } = useGame();

  // Using capsule geometry (no GLB model required)

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
        <mesh castShadow>
          <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
          <meshStandardMaterial color="#4a9eff" />
        </mesh>
      </group>
    </RigidBody>
  );
}
