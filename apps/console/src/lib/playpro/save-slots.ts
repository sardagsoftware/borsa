'use client';
type Blob = { version:number; at:number; slot:number; checkpoint:string; doorOpen:boolean; pos?:[number,number,number] };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const KEY = (s:number)=> \`eos:save:\${s}\`;
export async function loadSlot(slot:number):Promise<Blob|null>{
  try{ const r=await fetch(\`\${BASE}/lydian/save/get?slot=\${slot}\`,{credentials:'include'}); if(r.ok) return r.json(); }catch{}
  try{ const t=localStorage.getItem(KEY(slot)); return t?JSON.parse(t):null; }catch{} return null;
}
export async function saveSlot(slot:number, blob:Blob):Promise<boolean>{
  try{ const r=await fetch(\`\${BASE}/lydian/save/put?slot=\${slot}\`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(blob)}); if(r.ok) return true; }catch{}
  try{ localStorage.setItem(KEY(slot), JSON.stringify(blob)); return true; }catch{} return false;
}
