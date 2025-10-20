'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import HUD from '@/components/play/HUD';
import PuzzlePanel from '@/components/play/PuzzlePanel';

const SceneHD = dynamic(() => import('@/components/play/SceneHD'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white/70">Loading 3D scene...</p>
      </div>
    </div>
  ),
});

export default function PlayPage() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <SceneHD />
      <HUD />
      <PuzzlePanel />
    </div>
  );
}
