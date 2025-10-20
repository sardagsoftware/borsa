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
