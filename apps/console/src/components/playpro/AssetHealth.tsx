'use client';
import React, { useEffect, useState } from "react";
import { CHARACTERS } from "@/lib/playpro/char-config";
export default function AssetHealth(){
  const [rows,setRows]=useState<{path:string;ok:boolean}[]>([]);
  useEffect(()=>{ let m=true;(async()=>{
    const tmp: {path:string;ok:boolean}[]=[];
    for(const c of CHARACTERS){
      for (const p of (c as any).candidates ?? [ (c as any).glb ]) {
        try{ const r=await fetch(p,{method:'HEAD',cache:'no-store'}); tmp.push({path:p,ok:r.ok}); }catch{ tmp.push({path:p,ok:false}); }
      }
    }
    m&&setRows(tmp);
  })(); return()=>{m=false}; },[]);
  if(!rows.length) return null;
  return (<div className="fixed top-3 right-3 z-40 pointer-events-none">
    <div className="pointer-events-auto rounded-lg border border-white/10 bg-black/50 backdrop-blur p-3 text-xs">
      <div className="font-semibold mb-1">ASSETS</div>
      <ul className="space-y-1">{rows.map(r=><li key={r.path} className={r.ok?'text-green-300':'text-red-300'}>{r.ok?'✔':'✖'} {r.path}</li>)}</ul>
      <div className="opacity-70 mt-2">GLB yoksa kapsül görünür.</div>
    </div>
  </div>);
}
