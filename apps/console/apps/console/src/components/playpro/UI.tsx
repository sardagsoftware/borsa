'use client';
import React, { useEffect, useState } from 'react';
import { useGame } from '@/lib/playpro/state';
import { loadSlot, saveSlot } from '@/lib/playpro/save-slots';

export function TopHUD(){
  const fps = useFps();
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') useGame.getState().setPaused(!useGame.getState().paused); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[]);
  return (<div className="fixed top-3 left-3 pointer-events-none"><div className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 pointer-events-auto text-sm">FPS: {fps}</div></div>);
}
function useFps(){ const [fps,setFps]=useState(0); useEffect(()=>{ let f=0,last=performance.now(),id=requestAnimationFrame(function loop(t){ f++; if(t-last>=1000){setFps(f);f=0;last=t;} id=requestAnimationFrame(loop);}); return ()=>cancelAnimationFrame(id); },[]); return fps; }

export function Settings(){
  const {quality,setQuality,resolutionScale,setScale,fov,setFov,music,sfx,toggleMusic,toggleSfx,locale,setLocale} = useGame();
  return (
    <div className="fixed bottom-3 right-3 flex flex-col gap-2">
      <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
        <div className="font-semibold mb-1">SETTINGS</div>
        <div className="flex items-center gap-2 mb-1"><span>Quality</span>
          <select className="bg-black/40 border border-white/10 rounded px-2 py-1" value={quality} onChange={(e)=>setQuality(e.target.value as any)}>
            <option>low</option><option>medium</option><option>high</option><option>ultra</option>
          </select>
        </div>
        <div className="mb-1">Scale: <input type="range" min="0.5" max="1.5" step="0.05" value={resolutionScale} onChange={(e)=>setScale(Number(e.target.value))}/></div>
        <div className="mb-1">FOV: <input type="range" min="40" max="90" step="1" value={fov} onChange={(e)=>setFov(Number(e.target.value))}/></div>
        <div className="mb-1 flex items-center gap-2">
          <label><input type="checkbox" checked={music} onChange={toggleMusic}/> Music</label>
          <label><input type="checkbox" checked={sfx} onChange={toggleSfx}/> SFX</label>
          <label><span>Lang</span>
            <select className="bg-black/40 border border-white/10 rounded px-2 py-1 ml-1" value={locale} onChange={(e)=>setLocale(e.target.value as any)}>
              <option value="tr">TR</option><option value="en">EN</option>
            </select>
          </label>
        </div>
        <SaveSlotsPanel/>
      </div>
    </div>
  );
}

function SaveSlotsPanel(){
  const { doorOpen, checkpoint, setDoor, setCheckpoint } = useGame();
  const [busy,setBusy]=useState(false);
  const slots=[1,2,3];
  return (
    <div className="mt-2">
      <div className="font-semibold mb-1">SLOTS</div>
      <div className="flex gap-2">
        {slots.map(s=>(
          <button key={s} className="px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            onClick={async()=>{
              setBusy(true);
              const b = await loadSlot(s);
              if (b){ setDoor(!!b.doorOpen); setCheckpoint(b.checkpoint||null); }
              setBusy(false);
            }}>Load {s}</button>
        ))}
        {slots.map(s=>(
          <button key={s} className="px-2 py-1 rounded border border-white/10 hover:bg-white/10"
            onClick={async()=>{
              setBusy(true);
              await saveSlot(s, {version:2, at:Date.now(), slot:s, checkpoint: checkpoint||'MANUAL', doorOpen});
              setBusy(false);
            }}>Save {s}</button>
        ))}
      </div>
      {busy && <div className="text-[11px] opacity-60 mt-1">processing…</div>}
    </div>
  );
}

export function PhotoMode(){
  const [open,setOpen]=useState(false);
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key.toLowerCase()==='p') setOpen(v=>!v); }; window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[]);
  if(!open) return null;
  return (<div className="fixed inset-0 z-40 bg-black/60 backdrop-blur pointer-events-auto">
    <div className="absolute top-3 right-3 rounded-lg border border-white/10 bg-black/40 p-3">
      <div className="font-semibold text-sm mb-1">Photo Mode (P)</div>
      <div className="text-xs opacity-80">FOV/Scale ayarları Settings panelinden değiştir.</div>
    </div></div>);
}
