'use client';
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useGLTF, useAnimations, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/lib/playpro/state";
import { useKeys, useGamepad } from "@/lib/playpro/input";
import { resolveFirst200 } from "@/lib/playpro/char-resolver";

type Props = { candidates: string[]; idle?: string; walk?: string; run?: string; color?: string };

// Capsule fallback
function CapsuleFallback({ color = "#93c5fd", message = "Loading…" }: { color?: string; message?: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const setPos = useGame(s=>s.setPos);
  const keys = useKeys();
  const gp = useGamepad();

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

  return (
    <group>
      <mesh ref={ref} position={[0,1,2]} castShadow>
        <capsuleGeometry args={[0.4,0.8,8,16]}/>
        <meshStandardMaterial color={color}/>
      </mesh>
      <group position={[0,2.8,2]}>
        <Text fontSize={0.22} color={message.includes("NOT FOUND") ? "#ef4444" : "#fbbf24"} anchorX="center" anchorY="middle">
          {message}
        </Text>
      </group>
    </group>
  );
}

// GLB Model component (only renders when src is resolved)
function GLBModel({ src, idle, walk, run }: { src: string; idle?: string; walk?: string; run?: string }) {
  const ref = useRef<THREE.Group>(null!);
  const setPos = useGame(s=>s.setPos);
  const keys = useKeys();
  const gp = useGamepad();

  // Load GLB - no try-catch, let error boundary handle it
  const { scene, animations } = useGLTF(src) as any;
  const { actions } = useAnimations(animations || [], ref);

  // Auto-scale
  const scale = useMemo(()=> {
    if (!scene) return 1;
    try {
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const target = 1.8;
      const longest = Math.max(size.x, size.y, size.z) || 1;
      return target / longest;
    } catch {
      return 1;
    }
  },[scene]);

  // Animation
  useEffect(()=>{
    if (!actions || !idle) return;
    const action = actions[idle];
    if (action) {
      console.log(`✅ Playing animation: ${idle}`);
      action.reset().fadeIn(0.2).play();
      return ()=> action.fadeOut(0.1);
    } else {
      console.warn(`⚠️ Animation not found: ${idle}`);
    }
  },[actions, idle]);

  // Movement
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

  if (!scene) return <CapsuleFallback message="Scene loading..." />;

  return (
    <group ref={ref} position={[0,1,2]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

// Error boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error('❌ GLB loading error:', error);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Main component
export default function CharacterGLB({ candidates, idle="Idle", walk="Walk", run="Run", color="#93c5fd" }: Props){
  const [src, setSrc] = useState<string|null>(null);
  const [status, setStatus] = useState<"loading"|"ok"|"missing">("loading");

  // Resolve URL
  useEffect(()=>{
    (async ()=>{
      const resolved = await resolveFirst200(candidates);
      if (resolved){
        console.log(`✅ GLB resolved successfully: ${resolved}`);
        setSrc(resolved);
        setStatus("ok");
      } else {
        console.error('❌ GLB resolution failed for all candidates');
        setStatus("missing");
      }
    })();
  }, [candidates]);

  // Show loading or missing state
  if (status === "loading") {
    return <CapsuleFallback color={color} message="Loading…" />;
  }

  if (status === "missing" || !src) {
    return <CapsuleFallback color={color} message="GLB NOT FOUND" />;
  }

  // Render GLB with error boundary and suspense
  return (
    <ErrorBoundary fallback={<CapsuleFallback color={color} message="GLB LOAD ERROR" />}>
      <Suspense fallback={<CapsuleFallback color={color} message="Loading model..." />}>
        <GLBModel src={src} idle={idle} walk={walk} run={run} />
      </Suspense>
    </ErrorBoundary>
  );
}
