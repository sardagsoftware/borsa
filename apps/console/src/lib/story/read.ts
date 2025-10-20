export async function readStoryFiles() {
  const fs = await import("node:fs/promises");
  const path = (p: string) => `${process.cwd()}/../../story/${p}`;
  const load = async (p: string) => {
    try { return await fs.readFile(path(p), "utf8"); } catch { return null; }
  };
  const json = async (p: string) => {
    const t = await load(p); if (!t) return null;
    try { return JSON.parse(t); } catch { return null; }
  };
  const charactersRaw = await json("characters.json");
  const characters = charactersRaw?.characters || charactersRaw;
  return {
    bibleMd: await load("story-bible.md"),
    timeline: await json("story-timeline.json"),
    characters,
    themes: await json("themes.json"),
    dialogueMd: await load("dialogue-samples.md"),
    palette: await json("aesthetic-palette.json"),
    tagsYaml: await load("telemetry-tags.yaml"),
  };
}
