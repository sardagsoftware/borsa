export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import targetsJson from '@/data/health.json';

function absUrl(u: string, base?: string) {
  try {
    new URL(u);
    return u;
  } catch {
    const origin = base || process.env.NEXT_PUBLIC_BASE_URL || '';
    if (origin) return new URL(u, origin).toString();
    return u;
  }
}

async function probe(url: string) {
  const t0 = Date.now();
  let ok = false, code = 0, method = 'HEAD', err: string | undefined;
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow', cache: 'no-store' as any });
    code = r.status; ok = r.ok;
    if (!ok || code === 405) {
      method = 'GET';
      const g = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store' as any });
      code = g.status; ok = g.ok;
    }
  } catch (e: any) {
    err = String(e?.message || e);
  }
  const ms = Date.now() - t0;
  return { url, ok, code, ms, method, err };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = searchParams.get('base') || undefined;

  const tasks = (targetsJson as any).targets.map((t: any) => {
    const url = absUrl(t.url, base);
    return probe(url).then(r => ({ name: t.name, ...r }));
  });
  const results = await Promise.all(tasks);

  const items = results.map(r => {
    let status: 'up'|'warn'|'down' = 'down';
    if (r.code >= 200 && r.code < 300) status = 'up';
    else if (r.code >= 300 && r.code < 400) status = 'warn';
    else status = 'down';
    return { name: r.name, url: r.url, code: r.code, ms: r.ms, status, err: r.err || null };
  });

  return new Response(JSON.stringify({ generatedAt: Date.now(), items }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}
