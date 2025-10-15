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
