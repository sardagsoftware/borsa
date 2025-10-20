'use client';
import React, { useState } from 'react';
export default function VideoModal({src}:{src:string}){
  const [open,setOpen]=useState(false);
  if(!src) return null;
  return (
    <>
      <button className="px-3 py-2 rounded-lg border border-white/10 hover:border-white/20" onClick={()=>setOpen(true)}>▶ Video</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <div className="max-w-4xl w-full" onClick={(e)=>e.stopPropagation()}>
            <video src={src} controls className="w-full rounded-xl border border-white/10" />
          </div>
        </div>
      )}
    </>
  );
}
