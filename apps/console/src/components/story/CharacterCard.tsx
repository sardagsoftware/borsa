'use client';
import React from "react";
import Image from "next/image";
import Lightbox from "./Lightbox";
import VideoModal from "./VideoModal";
import ModelViewer from "./ModelViewer";
import { visualForCharacter } from "@/lib/story/visual";

export default function CharacterCard({ c }: { c: any }) {
  const v = visualForCharacter(c);
  return (
    <div className="rounded-xl border border-white/10 p-4 bg-white/5 backdrop-blur">
      <div className="flex gap-3 items-start">
        <div className="relative w-28 h-28 shrink-0 rounded-lg overflow-hidden border border-white/10">
          <Image src={v.portrait!} alt={c.name || "portrait"} fill sizes="112px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-lg">{c.name || "Unknown"}</h3>
          <div className="text-sm opacity-80">{c.role || "—"}</div>
          <ul className="text-xs mt-2 space-y-1">
            <li><b>Motivasyon:</b> {c.motivation ?? "—"}</li>
            <li><b>Fatal Flaw:</b> {c.fatal_flaw ?? "—"}</li>
            <li><b>Voice Traits:</b> {Array.isArray(c.voice_traits)&&c.voice_traits.length?c.voice_traits.join(", "):"—"}</li>
            <li><b>Arc:</b> {c.arc ?? "—"}</li>
          </ul>
          <div className="mt-2 flex gap-2">
            {v.video && <VideoModal src={v.video} />}
            {v.glb && <a href="#glb" className="px-3 py-2 rounded-lg border border-white/10 hover:border-white/20">3D</a>}
          </div>
        </div>
      </div>
      {Array.isArray(v.images) && v.images.length>0 && <div className="mt-3"><Lightbox images={v.images} /></div>}
      {v.glb && <div id="glb" className="mt-3"><ModelViewer src={v.glb} poster={v.portrait} /></div>}
    </div>
  );
}
