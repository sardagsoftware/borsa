'use client';
import React, { useEffect, useState } from 'react';
import { useGame } from '@/lib/playpro/state';

export default function Dialogue({ file="/assets/play/dialogue/prologue.json" }:{ file?:string }){
  const locale = useGame(s=>s.locale);
  const [lines,setLines]=useState<any[]>([]);
  const [idx,setIdx]=useState(0);
  useEffect(()=>{ fetch(file).then(r=>r.json()).then(setLines).catch(()=>setLines([])); },[file]);
  useEffect(()=>{
    const onNext=(e:KeyboardEvent)=>{ if (e.key==='Enter') setIdx(i=>Math.min(i+1, lines.length-1)); };
    window.addEventListener('keydown', onNext); return ()=>window.removeEventListener('keydown', onNext);
  },[lines]);
  if (!lines.length) return null;
  const ln = lines[idx];
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(720px,92vw)] pointer-events-none">
      <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur p-3 pointer-events-auto">
        <div className="text-xs opacity-70">{ln.speaker}</div>
        <div className="text-sm">{(ln as any)[locale] || ln.en}</div>
        <div className="text-[11px] opacity-60 mt-1">[Enter] →</div>
      </div>
    </div>
  );
}
