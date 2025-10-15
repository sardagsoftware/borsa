'use client';
type SaveBlob = { version:number; at:number; checkpoint:string; doorOpen:boolean; pos?:[number,number,number] };
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
export async function cloudGet(): Promise<SaveBlob|null> {
  try{ const r=await fetch(`${BASE}/lydian/save/get`,{credentials:'include'}); if(r.ok) return r.json(); }catch{}
  try{ const t=localStorage.getItem('eos:save'); return t?JSON.parse(t):null; }catch{} return null;
}
export async function cloudPut(b:SaveBlob): Promise<boolean> {
  try{ const r=await fetch(`${BASE}/lydian/save/put`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(b)}); if(r.ok) return true; }catch{}
  try{ localStorage.setItem('eos:save', JSON.stringify(b)); return true; }catch{} return false;
}
