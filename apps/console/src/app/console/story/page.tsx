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
              {data.themes.primaryThemes.map((t:any,i:number)=>{
                const text = typeof t === 'object' ? (t.title || t.name || JSON.stringify(t).substring(0,50)) : (t || "—");
                return <li key={i}>{text}</li>;
              })}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-4 bg-white/5">
            <h4 className="font-semibold mb-2">Symbols</h4>
            <ul className="list-disc pl-5 text-sm">
              {data.themes.symbols.map((s:any,i:number)=>{
                const text = typeof s === 'object' ? (s.symbol_of || s.title || s.name || JSON.stringify(s).substring(0,50)) : (s || "—");
                return <li key={i}>{text}</li>;
              })}
            </ul>
          </div>
        </div>
      </Section>
      <ImageGrid images={vis.concepts} title="Concept Gallery" />
      <ImageGrid images={vis.env} title="Environment Gallery" />
    </main>
  );
}
