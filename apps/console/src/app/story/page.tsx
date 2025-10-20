import React from "react";
import { readStoryFiles } from "@/lib/story/read";
import { normalizeStory } from "@/lib/story/normalize";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-lydian-gold mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default async function StoryPage() {
  const raw = await readStoryFiles();
  const data = normalizeStory(raw);

  if (!data.bibleMd && !data.characters.length) {
    return (
      <main className="container max-w-5xl py-12">
        <div className="rounded-xl border border-white/10 p-6">
          <h1 className="text-2xl font-bold mb-2">Story files not found</h1>
          <p className="text-sm opacity-80">Add files under /story to see the viewer.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6">Echo of Sardis — Story</h1>

      <Section title="Characters">
        <div className="grid md:grid-cols-2 gap-4">
          {data.characters.map((c: any) => (
            <div key={c.id} className="rounded-lg border border-white/10 p-4">
              <h3 className="font-semibold">{c.name}</h3>
              <p className="text-sm opacity-80">{c.role}</p>
              <div className="mt-2 text-sm">
                <div><span className="font-medium">Motivation:</span> {c.motivation || "Not specified"}</div>
                <div><span className="font-medium">Fatal Flaw:</span> {c.fatal_flaw || "Not specified"}</div>
                <div><span className="font-medium">Voice Traits:</span> {Array.isArray(c.voice_traits) && c.voice_traits.length ? c.voice_traits.join(", ") : "Not specified"}</div>
                <div><span className="font-medium">Arc:</span> {c.arc || "Not specified"}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Themes & Symbols">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 p-4">
            <h4 className="font-semibold mb-2">Primary Themes</h4>
            <ul className="list-disc pl-5">
              {data.themes.primaryThemes.map((t: any, i: number) => (
                <li key={i}>{typeof t === 'object' ? (t.title || t.name || JSON.stringify(t).substring(0, 50)) : (t || "—")}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <h4 className="font-semibold mb-2">Symbols</h4>
            <ul className="list-disc pl-5">
              {data.themes.symbols.map((s: any, i: number) => (
                <li key={i}>{typeof s === 'object' ? (s.title || s.name || s.symbol_of || JSON.stringify(s).substring(0, 50)) : (s || "—")}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 p-4 mt-4">
          <h4 className="font-semibold mb-2">Ethical Dilemmas</h4>
          <ul className="list-disc pl-5">
            {data.themes.ethical_dilemmas.map((d: any, i: number) => <li key={i}>{d.title || d.scenario || "—"}</li>)}
          </ul>
        </div>
      </Section>

      <Section title="Aesthetic Palette">
        <pre className="text-xs bg-black/20 rounded-lg p-3 overflow-auto">{JSON.stringify(data.palette, null, 2)}</pre>
      </Section>

      {data.telemetryTags && (
        <Section title="Telemetry Tags">
          <pre className="text-xs bg-black/20 rounded-lg p-3 overflow-auto">{JSON.stringify(data.telemetryTags, null, 2)}</pre>
        </Section>
      )}
    </main>
  );
}
