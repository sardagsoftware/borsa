'use client';
import React, { useMemo, useState } from 'react';
import { useGame } from '@/lib/playpro/state';
import { cloudGet, cloudPut } from '@/lib/playpro/cloudsave';
const TARGET=[220,330,440], TOL=3;
export default function Puzzle(){
  const { paused,setPaused,doorOpen,setDoor,checkpoint,setCheckpoint } = useGame();
  const [cols,setCols]=useState([220,330,440]); const [saving,setSaving]=useState(false);
  const ok = useMemo(()=> cols.every((v,i)=> Math.abs(v-TARGET[i])<=TOL ), [cols]);
  if (!paused) return null;
  const onSolve=async()=>{ if(!ok) return; setDoor(true); setCheckpoint('PROLOGUE:RESONANCE-DOOR'); setSaving(true);
    await cloudPut({version:2,at:Date.now(),checkpoint:'PROLOGUE:RESONANCE-DOOR',doorOpen:true}); setSaving(false); setPaused(false); };
  const onSave=async()=>{ setSaving(true); await cloudPut({version:2,at:Date.now(),checkpoint:checkpoint||'MANUAL',doorOpen}); setSaving(false); };
  const onLoad=async()=>{ const b=await cloudGet(); if(b?.doorOpen) setDoor(true); };
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur">
      <div className="w-[min(720px,92vw)] rounded-xl border border-white/10 bg-white/5 p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-2"><h2 className="text-lg font-semibold">Chordstone Puzzle</h2><button className="px-3 py-1 rounded-lg border border-white/10 hover:bg-white/10" onClick={()=>setPaused(false)}>✕</button></div>
        <p className="text-sm opacity-80 mb-3">Üç sütunu 220 / 330 / 440 Hz (±3) hedeflerine getir.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {cols.map((v,i)=>(
            <div key={i} className="rounded-lg border border-white/10 p-3">
              <div className="text-sm font-medium mb-2">Frekans {i+1}</div>
              <input type="range" min="100" max="600" value={v} onChange={(e)=>setCols(cs=>cs.map((x,ix)=>ix===i?Number(e.target.value):x))} className="w-full accent-[#E6C67A]"/>
              <div className="text-xs opacity-80 mt-1">{v.toFixed(0)} Hz — hedef {TARGET[i]} Hz</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button className={`px-3 py-2 rounded-lg border ${ok?'border-green-400 text-green-300':'border-white/20 opacity-60'}`} onClick={onSolve} disabled={!ok}>ÇÖZ</button>
          <button className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10" onClick={onSave} disabled={saving}>Kaydet</button>
          <button className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10" onClick={onLoad}>Yükle</button>
        </div>
      </div>
    </div>
  );
}
