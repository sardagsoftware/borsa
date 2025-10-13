#!/usr/bin/env bash
set -euo pipefail
echo "🧪 Lydian Console • UI Verification Sprint (Story + LiveOps S2 + KPIs)"

ROOT="$(pwd)"; DATE=$(date +%Y%m%d-%H%M)
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:3100}"

# ────────────────────────────────
# 0) ÖN HAZIRLIK
# ────────────────────────────────
mkdir -p src/lib/{liveops,kpis,security} logs telemetry

# Güvenli HMAC header üretimi (client POST'ları için)
cat > src/lib/security/hmac.ts <<'TS'
import crypto from "crypto";
export function sign(body: string, secret: string) {
  const ts = Math.floor(Date.now()/1000).toString();
  const nonce = crypto.randomBytes(8).toString("hex");
  const sig = crypto.createHmac("sha256", secret).update(`${ts}.${nonce}.${body}`).digest("hex");
  return { ts, nonce, sig };
}
TS

# ────────────────────────────────
# 1) LiveOps S2 NORMALIZER + API WRAPPER
# ────────────────────────────────
cat > src/lib/liveops/normalize.ts <<'TS'
type Any = Record<string, any>;
const A = (v:any)=>Array.isArray(v)?v:(v&&typeof v==="object")?Object.values(v):[];

export function normalizeSeason(season: Any|null) {
  if(!season) return { id:"N/A", title:"N/A", start:null, end:null, weeks:[] as any[] };
  const weeks = A(season.weeks).map((w:any,i:number)=>({ w:w.w??(i+1), events:A(w.events) }));
  return { id:season.id||"N/A", title:season.title||"N/A", start:season.start||null, end:season.end||null, weeks };
}
export function normalizeEvents(events: any) { return A(events).map((e:any)=>({ id:e.id||"?", type:e.type||"event", ...e })); }

export function normalizeEconomy(bal:any){
  const e=bal||{};
  return {
    earn_spend_ratio: e.earn_spend_ratio ?? e.earnSpend ?? null,
    inflation_index: e.inflation_index ?? e.inflation ?? null,
    vendor_prices: e.vendor_prices ?? e.vendor ?? {},
    drops: e.drops ?? {},
  };
}

export function normalizeAB(list:any){
  return A(list).map((x:any)=>({
    id:x.id || x.name || "exp",
    arms: A(x.arms||x.variants||["A","B"]),
    allocation: x.allocation || {A:50,B:50},
    status: x.status || "active"
  }));
}
TS

cat > src/lib/liveops/api.ts <<'TS'
export async function getJSON(path:string){
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const res = await fetch(`${base}${path}`, { cache:"no-store" }).catch(()=>null);
  if(!res || !res.ok) return null;
  return res.json();
}
export const LiveOpsAPI = {
  season: ()=> getJSON("/liveops/season/current"),
  today:  ()=> getJSON("/liveops/events/today"),
  ab:     ()=> getJSON("/experiments/ab/active"),
  kpis:   ()=> getJSON("/kpis/s2"),
  economy:()=> getJSON("/economy/balance"),
};
TS

# ────────────────────────────────
# 2) KPIs NORMALIZER
# ────────────────────────────────
cat > src/lib/kpis/normalize.ts <<'TS'
type Any = Record<string, any>;
export function normalizeKpis(k:Any|null){
  const z = k||{};
  return {
    crash_free: z.crash_free ?? z.crashFree ?? null,
    p95_gpu_ms: z.p95_gpu ?? z.p95Gpu ?? null,
    p95_cpu_ms: z.p95_cpu ?? z.p95Cpu ?? null,
    server_latency: z.server_latency ?? z.latency ?? null,
    retention: z.retention ?? { d1:null, d7:null, d30:null },
    inflation: z.inflation ?? z.inflation_index ?? null,
    ts: z.timestamp ?? null
  };
}
TS

# ────────────────────────────────
# 3) /liveops/s2 sayfasını null-safe + normalizer ile güncelle (App Router)
# ────────────────────────────────
cat > src/app/liveops/s2/page.tsx <<'TSX'
'use client';
import React from "react";
import useSWR from "swr";
import { LiveOpsAPI } from "@/lib/liveops/api";
import { normalizeSeason, normalizeEvents, normalizeEconomy, normalizeAB } from "@/lib/liveops/normalize";

const fetcher = (fn:()=>Promise<any>) => fn();

export default function LiveOpsS2() {
  const { data:seasonRaw } = useSWR('season', ()=>LiveOpsAPI.season(), { suspense:false });
  const { data:eventsRaw } = useSWR('today',  ()=>LiveOpsAPI.today(),  { suspense:false });
  const { data:abRaw }     = useSWR('ab',     ()=>LiveOpsAPI.ab(),     { suspense:false });
  const { data:ecoRaw }    = useSWR('economy',()=>LiveOpsAPI.economy(),{ suspense:false });

  const season = normalizeSeason(seasonRaw);
  const events = normalizeEvents(eventsRaw);
  const eco    = normalizeEconomy(ecoRaw);
  const ab     = normalizeAB(abRaw);

  return (
    <main className="container max-w-7xl py-8">
      <h1 className="text-2xl font-bold mb-4">Season-2 • {season.title}</h1>
      <div className="text-sm opacity-80 mb-6">ID: {season.id} • {season.start ?? "N/A"} → {season.end ?? "N/A"}</div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">This Week</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {events.length ? events.map((e:any)=>(
            <div key={e.id} className="rounded-lg border border-white/10 p-3">
              <div className="font-medium">{e.id}</div>
              <div className="text-xs opacity-80">{e.type}</div>
            </div>
          )) : <div className="opacity-60 text-sm">No events</div>}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Economy Snapshot</h2>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-white/10 p-3">Earn/Spend: <b>{eco.earn_spend_ratio ?? "N/A"}</b></div>
          <div className="rounded-lg border border-white/10 p-3">Inflation: <b>{eco.inflation_index ?? "N/A"}</b></div>
          <div className="rounded-lg border border-white/10 p-3">Drops: <code className="text-xs">{Object.keys(eco.drops).length}</code></div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">A/B Experiments</h2>
        <ul className="list-disc pl-5 text-sm">
          {ab.length ? ab.map((x:any)=>(
            <li key={x.id}><b>{x.id}</b> • status: {x.status} • arms: {x.arms.join(", ")}</li>
          )) : <li className="opacity-60">No experiments</li>}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Weeks</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {season.weeks.map((w:any)=>(
            <div key={w.w} className="rounded-lg border border-white/10 p-3 text-sm">
              <div className="font-medium">Week {w.w}</div>
              <div className="opacity-80">{(w.events||[]).join(", ")||"—"}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
TSX

# ────────────────────────────────
# 4) /kpis sayfasını normalizer ile güncelle
# ────────────────────────────────
cat > src/app/kpis/page.tsx <<'TSX'
import React from "react";
import { normalizeKpis } from "@/lib/kpis/normalize";

export default async function Kpis() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const res = await fetch(`${base}/kpis/s2`, { cache:"no-store" }).catch(()=>null);
  const raw = res && res.ok ? await res.json() : null;
  const k = normalizeKpis(raw);

  return (
    <main className="container max-w-6xl py-8">
      <h1 className="text-2xl font-bold mb-4">S2 • KPI / Telemetry</h1>
      <div className="grid md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border border-white/10 p-3">Crash-free: <b>{k.crash_free ?? "N/A"}%</b></div>
        <div className="rounded-lg border border-white/10 p-3">p95 GPU: <b>{k.p95_gpu_ms ?? "N/A"} ms</b></div>
        <div className="rounded-lg border border-white/10 p-3">Latency: <b>{k.server_latency ?? "N/A"} ms</b></div>
        <div className="rounded-lg border border-white/10 p-3">Retention D1/D7/D30: <b>{(k.retention?.d1 ?? "–")}/{(k.retention?.d7 ?? "–")}/{(k.retention?.d30 ?? "–")}</b></div>
        <div className="rounded-lg border border-white/10 p-3">Inflation: <b>{k.inflation ?? "N/A"}</b></div>
        <div className="rounded-lg border border-white/10 p-3">Timestamp: <b>{k.ts ?? "N/A"}</b></div>
      </div>
    </main>
  );
}
TSX

echo "📦 Files created, checking..."
