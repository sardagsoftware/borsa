'use client';
export async function resolveFirst200(paths:string[]): Promise<string|null>{
  console.log('🔍 Resolving GLB from candidates:', paths);
  for (const p of paths){
    try {
      console.log(`  Trying: ${p}...`);
      const r = await fetch(p, { method:'HEAD', cache:'no-store' });
      console.log(`  → ${r.status} ${r.ok ? '✓' : '✗'}`);
      if (r.ok) {
        console.log(`✅ Resolved: ${p}`);
        return p;
      }
    } catch (e) {
      console.log(`  → Error:`, e);
    }
  }
  console.warn('❌ No GLB candidates found, using capsule fallback');
  return null;
}
