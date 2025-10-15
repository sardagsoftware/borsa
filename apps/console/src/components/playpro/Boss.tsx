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
