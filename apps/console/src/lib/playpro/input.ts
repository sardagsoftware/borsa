'use client';
import { useEffect, useState } from 'react';
export function useKeys(){
  const [k,setK]=useState<Record<string,boolean>>({});
  useEffect(()=>{ const dn=(e:KeyboardEvent)=>setK(s=>({...s,[e.key.toLowerCase()]:true}));
                  const up=(e:KeyboardEvent)=>setK(s=>({...s,[e.key.toLowerCase()]:false}));
                  window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
                  return ()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up)}
  },[]);
  return { w:k['w']||k['arrowup']||false, s:k['s']||k['arrowdown']||false, a:k['a']||k['arrowleft']||false, d:k['d']||k['arrowright']||false, space:k[' ']||false, e:k['e']||false, esc:k['escape']||false };
}
export function useGamepad(){
  const [gp,setGp]=useState({lx:0,ly:0,btnA:false});
  useEffect(()=>{ let raf:number; const loop=()=>{ const g=navigator.getGamepads?.()[0]; if(g){ setGp({lx:g.axes?.[0]||0,ly:g.axes?.[1]||0, btnA:!!g.buttons?.[0]?.pressed}); } raf=requestAnimationFrame(loop); }; raf=requestAnimationFrame(loop); return ()=>cancelAnimationFrame(raf); },[]);
  return gp;
}
