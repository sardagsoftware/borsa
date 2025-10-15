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
