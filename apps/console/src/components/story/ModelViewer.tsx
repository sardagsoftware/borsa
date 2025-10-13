'use client';
import React, { useEffect, useRef } from 'react';

type Props = { src: string; poster?: string; className?: string; ar?: boolean };

export default function ModelViewer({src, poster, className, ar=false}:Props){
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load model-viewer script dynamically on client side only
    if (typeof window !== 'undefined' && !window.customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {/* @ts-ignore */}
      <model-viewer
        src={src}
        poster={poster}
        ar={ar}
        camera-controls
        auto-rotate
        style={{width:'100%', height:'360px', borderRadius:'12px', border:'1px solid rgba(255,255,255,.1)'}}
        shadow-intensity="0.6"
        exposure="1.0"
      />
    </div>
  );
}
