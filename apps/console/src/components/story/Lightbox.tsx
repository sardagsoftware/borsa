'use client';
import React, { useState } from 'react';
import Image from 'next/image';
export default function Lightbox({images}:{images:string[]}) {
  const [open,setOpen]=useState(false); const [idx,setIdx]=useState(0);
  if(!images || images.length===0) return null;
  return (
    <>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src,i)=>(
          <button key={i} className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-white/10 hover:border-white/20"
                  onClick={()=>{setIdx(i);setOpen(true);}}>
            <Image src={src} alt={"img-"+i} fill sizes="33vw" className="object-cover" />
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={()=>setOpen(false)}>
          <div className="relative max-w-5xl w-full">
            <Image src={images[idx]} alt="preview" width={1920} height={1080} className="w-full h-auto rounded-xl border border-white/10"/>
            <div className="absolute top-2 right-2 flex gap-2">
              <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={(e)=>{e.stopPropagation();setIdx((idx-1+images.length)%images.length)}}>‹</button>
              <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={(e)=>{e.stopPropagation();setIdx((idx+1)%images.length)}}>›</button>
              <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={(e)=>{e.stopPropagation();setOpen(false)}}>✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
