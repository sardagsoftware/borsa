#!/usr/bin/env bash
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
APP="$ROOT/apps/console"
PUB="$APP/public"
SRC="$APP/src"
LOG="$ROOT/logs/visual-ux-pro.log"
mkdir -p "$PUB/assets/story/{characters,concepts,env,video,models}" "$SRC/components/story" "$SRC/lib/story" logs

echo "🎨 Visual UX Pro Sprint — Lightbox • Video • 3D • Verify" | tee "$LOG"

# 0) Model-viewer (3D) için dinamik yükleyici (yalnız istemci)
cat > "$SRC/components/story/ModelViewer.tsx" <<'TSX'
'use client';
import React, { useEffect } from 'react';
type Props = { src: string; poster?: string; className?: string; ar?: boolean };
export default function ModelViewer({src, poster, className, ar=false}:Props){
  useEffect(()=>{ import('https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'); },[]);
  return (
    // @ts-ignore – model-viewer custom element
    <model-viewer src={src} poster={poster} ar={ar} camera-controls autoplay disable-zoom
      style={{width:'100%', height:'360px', borderRadius:'12px', border:'1px solid rgba(255,255,255,.1)'}}
      shadow-intensity="0.6" exposure="1.0"></model-viewer>
  );
}
TSX

# 1) Lightbox (zoom) ve VideoModal (yerel MP4)
cat > "$SRC/components/story/Lightbox.tsx" <<'TSX'
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
TSX

cat > "$SRC/components/story/VideoModal.tsx" <<'TSX'
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
TSX

# 2) Görsel normalizer: portrait/images/video/glb alanları (mevcutsa) bağlansın
cat > "$SRC/lib/story/visual.ts" <<'TS'
export type VisualSet = { portrait?: string; images?: string[]; video?: string; glb?: string; };
const PH = "/assets/story/placeholder.svg";
const resolve = (p?:string)=> !p ? PH : (p.startsWith('http')?p:(p.startsWith('/assets/')?p:`/assets/story/${p}`));
export function visualForCharacter(c:any):VisualSet{
  const portrait = c.portrait || c.image || (Array.isArray(c.images)&&c.images[0]);
  const images = Array.isArray(c.images)? c.images : (Array.isArray(c.gallery)? c.gallery : []);
  return { portrait:resolve(portrait), images: images.map(resolve), video:c.video?resolve(c.video):undefined, glb:c.glb?resolve(c.glb):undefined };
}
export function visualsFromPalette(p:any){ 
  const concepts = Array.isArray(p?.concepts)? p.concepts.map(resolve):[];
  const env = Array.isArray(p?.environments)? p.environments.map(resolve):[];
  return {concepts, env};
}
TS

# 3) CharacterCard + ImageGrid sayfalarına Lightbox/Video/3D ekle
cat > "$SRC/components/story/CharacterCard.tsx" <<'TSX'
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
TSX

cat > "$SRC/components/story/ImageGrid.tsx" <<'TSX'
'use client';
import React from "react";
import Lightbox from "./Lightbox";
export default function ImageGrid({ images, title, columns=3 }:{ images:string[], title:string, columns?:number }){
  if(!images || images.length===0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <Lightbox images={images} />
    </section>
  );
}
TSX

# 4) Characters ve Story sayfalarını görsel bloklarla zenginleştir
cat > "$APP/src/app/console/characters/page.tsx" <<'TSX'
import React from "react";
import { readStoryFiles } from "@/lib/story/read";
import { normalizeStory } from "@/lib/story/normalize";
import CharacterCard from "@/components/story/CharacterCard";
import ImageGrid from "@/components/story/ImageGrid";
import { visualsFromPalette } from "@/lib/story/visual";

export const metadata = { title:"Characters & Storyflow | Ailydian Console", description:"Karakterler ve görsel akış" };

export default async function Characters(){
  const raw = await readStoryFiles();
  const data = normalizeStory(raw);
  const vis = visualsFromPalette(data.palette);
  return (
    <main className="container max-w-7xl py-8">
      <h1 className="text-2xl font-bold mb-2">Characters & Storyflow</h1>
      <p className="opacity-80 mb-6">Portreler, biyografiler, konsept ve ortam galerileri.</p>
      <section className="mb-8 grid md:grid-cols-2 gap-4">
        {data.characters.map((c:any)=> <CharacterCard key={c.id} c={c} />)}
      </section>
      <ImageGrid images={vis.concepts} title="Concept Gallery" />
      <ImageGrid images={vis.env} title="Environment Gallery" />
    </main>
  );
}
TSX

cat > "$APP/src/app/console/story/page.tsx" <<'TSX'
import React from "react";
import { readStoryFiles } from "@/lib/story/read";
import { normalizeStory } from "@/lib/story/normalize";
import ImageGrid from "@/components/story/ImageGrid";
import { visualsFromPalette } from "@/lib/story/visual";

export const metadata = { title:"Story • Echo of Sardis", description:"Story bible & görsel palet" };

function Section({title, children}:{title:string;children:React.ReactNode}){
  return <section className="mb-8"><h2 className="text-lg font-semibold mb-2">{title}</h2>{children}</section>;
}

export default async function StoryPage(){
  const raw = await readStoryFiles();
  const data = normalizeStory(raw);
  const vis = visualsFromPalette(data.palette);

  return (
    <main className="container max-w-7xl py-8">
      <h1 className="text-2xl font-bold mb-4">Echo of Sardis — Story</h1>
      <Section title="Themes & Symbols">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 p-4 bg-white/5">
            <h4 className="font-semibold mb-2">Primary Themes</h4>
            <ul className="list-disc pl-5 text-sm">
              {data.themes.primaryThemes.map((t:any,i:number)=><li key={i}>{t.title||t||"—"}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-white/5">
            <h4 className="font-semibold mb-2">Symbols</h4>
            <ul className="list-disc pl-5 text-sm">
              {data.themes.symbols.map((s:any,i:number)=><li key={i}>{s.title||s||"—"}</li>)}
            </ul>
          </div>
        </div>
      </Section>
      <ImageGrid images={vis.concepts} title="Concept Gallery" />
      <ImageGrid images={vis.env} title="Environment Gallery" />
    </main>
  );
}
TSX

# 5) Kullanım rehberi (gerçek dosya yolları nasıl eklenir)
cat > "$ROOT/docs/STORY-VISUAL-ASSETS-GUIDE.md" <<'MD'
# Story Visual Assets Guide (Live)
Koymanız gereken örnek yollar:
- apps/console/public/assets/story/characters/Elif.png
- apps/console/public/assets/story/characters/Ferhat.png
- apps/console/public/assets/story/concepts/chordstone-compass.jpg
- apps/console/public/assets/story/env/ruins_01.jpg
- apps/console/public/assets/story/video/trailer.mp4    (opsiyonel)
- apps/console/public/assets/story/models/echo-sentinel.glb (opsiyonel)

`story/characters.json` → ilgili karakterlere:
{
  "id":"ELIF", "name":"Elif Aras", "role":"protagonist",
  "portrait":"/assets/story/characters/Elif.png",
  "images":["/assets/story/concepts/chordstone-compass.jpg","/assets/story/env/ruins_01.jpg"],
  "video":"/assets/story/video/trailer.mp4",
  "glb":"/assets/story/models/echo-sentinel.glb"
}
`story/aesthetic-palette.json` → 
{ "concepts":["/assets/story/concepts/chordstone-compass.jpg"], "environments":["/assets/story/env/ruins_01.jpg"] }

Dosya yoksa otomatik `placeholder.svg` gösterilir; UI kırılmaz.
MD

# 6) Build + doğrulama
echo "🏗  Building console…"
( cd "$APP" && (pnpm -w build || pnpm build || npm run build) ) >> "$LOG" 2>&1 || (tail -n 100 "$LOG"; exit 1)

echo "🚀 Starting dev server on 3100…"
pkill -f "next dev -p 3100" 2>/dev/null || true
( cd "$APP" && (pnpm dev --port 3100 || npm run dev -- --port 3100) ) >/dev/null 2>&1 &
sleep 3

for p in /console/characters /console/story; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3100$p?nocache=$(date +%s)" || echo 000)
  printf "• %s → %s\n" "$p" "$code"
done

echo "✅ Visual UX Pro tamam. Şimdi gerçek görselleri 'apps/console/public/assets/story/*' altına kopyaladığında UI otomatik zenginleşecek."
echo "📄 Rehber: docs/STORY-VISUAL-ASSETS-GUIDE.md"
