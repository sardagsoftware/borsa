import YAML from "yaml";

type AnyMap = Record<string, any>;

const safeText = (x: unknown) => (x == null ? "" : String(x)).normalize("NFKC");

const mapToArray = (m: any): any[] => {
  if (Array.isArray(m)) return m;
  if (m && typeof m === "object") return Object.values(m);
  return [];
};

export function normalizeStory(raw: {
  bibleMd: string | null;
  timeline: AnyMap | any[] | null;
  characters: AnyMap | any[] | null;
  themes: AnyMap | null;
  dialogueMd: string | null;
  palette: AnyMap | null;
  tagsYaml: string | null;
}) {
  const charactersArr = mapToArray(raw.characters).map((c: AnyMap, idx: number) => ({
    id: c.id || c.slug || `char_${idx}`,
    name: c.name || c.display_name || "Unknown",
    role: c.role || c.archetype || "unknown",
    motivation: c.motivation || c.core_motivation || null,
    fatal_flaw: c.fatal_flaw ?? c.flaw ?? null,
    voice_traits: Array.isArray(c.voice_traits)
      ? c.voice_traits
      : (c.voice_trait ? [c.voice_trait] : []),
    arc: c.arc || c.arc_summary || null,
    ...c,
  }));

  const themes = raw.themes || {};
  const primaryThemes = mapToArray((themes as AnyMap).primary_themes || themes.primary || []);
  const symbols = mapToArray((themes as AnyMap).symbols || []);
  const ethical_dilemmas =
    Array.isArray((themes as AnyMap).ethical_dilemmas)
      ? (themes as AnyMap).ethical_dilemmas
      : (themes as AnyMap).ethical_dilemmas
      ? Object.values((themes as AnyMap).ethical_dilemmas as AnyMap)
      : [];

  let telemetryTags: any = null;
  if (raw.tagsYaml) {
    try { telemetryTags = YAML.parse(raw.tagsYaml); } catch { telemetryTags = null; }
  }

  return {
    bibleMd: raw.bibleMd ?? "",
    timeline: Array.isArray(raw.timeline) ? raw.timeline : mapToArray(raw.timeline),
    characters: charactersArr,
    themes: { primaryThemes, symbols, ethical_dilemmas },
    dialogueMd: raw.dialogueMd ?? "",
    palette: raw.palette ?? {},
    telemetryTags,
  };
}
