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
