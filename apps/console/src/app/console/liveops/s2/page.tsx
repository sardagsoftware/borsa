'use client';
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { LiveOpsAPI } from "@/lib/liveops/api";
import { normalizeSeason, normalizeEvents, normalizeEconomy, normalizeAB } from "@/lib/liveops/normalize";
import { useRealtime, useRealtimeMulti } from "@/lib/realtime/client/useRealtime";

const fetcher = (fn:()=>Promise<any>) => fn();

export default function LiveOpsS2() {
  const { data:seasonRaw } = useSWR('season', ()=>LiveOpsAPI.season(), { suspense:false });
  const { data:eventsRaw } = useSWR('today',  ()=>LiveOpsAPI.today(),  { suspense:false });
  const { data:abRaw }     = useSWR('ab',     ()=>LiveOpsAPI.ab(),     { suspense:false });
  const { data:ecoRaw }    = useSWR('economy',()=>LiveOpsAPI.economy(),{ suspense:false });

  // Realtime updates
  const { data: rtEvents, connected: eventsConnected } = useRealtime<any>('liveops.events', {
    scopes: ['liveops.admin'],
  });
  const { data: rtEconomy, connected: economyConnected } = useRealtime<any>('economy.patch', {
    scopes: ['economy.admin'],
  });
  const { data: rtAB, connected: abConnected } = useRealtime<any>('ab.status', {
    scopes: ['liveops.admin'],
  });

  // Merge realtime data with SWR data
  const season = normalizeSeason(seasonRaw);
  const events = rtEvents ? normalizeEvents(rtEvents) : normalizeEvents(eventsRaw);
  const eco    = rtEconomy ? normalizeEconomy(rtEconomy) : normalizeEconomy(ecoRaw);
  const ab     = rtAB ? normalizeAB(rtAB) : normalizeAB(abRaw);

  // Connection status
  const anyConnected = eventsConnected || economyConnected || abConnected;

  return (
    <main className="container max-w-7xl py-8">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Season-2 • {season.title}</h1>
          <div className="text-sm opacity-80 mt-1">ID: {season.id} • {season.start ?? "N/A"} → {season.end ?? "N/A"}</div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${anyConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="opacity-80">{anyConnected ? 'Live Updates' : 'Offline'}</span>
        </div>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">This Week</h2>
          {eventsConnected && <span className="text-xs text-green-500">● Live</span>}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {events.length ? events.map((e:any)=>(
            <div key={e.id} className={`rounded-lg border p-3 transition-all ${eventsConnected ? 'border-lydian-gold/30 bg-lydian-gold/5' : 'border-white/10'}`}>
              <div className="font-medium">{e.id}</div>
              <div className="text-xs opacity-80">{e.type}</div>
            </div>
          )) : <div className="opacity-60 text-sm">No events</div>}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Economy Snapshot</h2>
          {economyConnected && <span className="text-xs text-green-500">● Live</span>}
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className={`rounded-lg border p-3 transition-all ${economyConnected ? 'border-lydian-gold/30 bg-lydian-gold/5' : 'border-white/10'}`}>
            Earn/Spend: <b>{eco.earn_spend_ratio ?? "N/A"}</b>
          </div>
          <div className={`rounded-lg border p-3 transition-all ${economyConnected ? 'border-lydian-gold/30 bg-lydian-gold/5' : 'border-white/10'}`}>
            Inflation: <b>{eco.inflation_index ?? "N/A"}</b>
          </div>
          <div className={`rounded-lg border p-3 transition-all ${economyConnected ? 'border-lydian-gold/30 bg-lydian-gold/5' : 'border-white/10'}`}>
            Drops: <code className="text-xs">{Object.keys(eco.drops).length}</code>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">A/B Experiments</h2>
          {abConnected && <span className="text-xs text-green-500">● Live</span>}
        </div>
        <ul className="list-disc pl-5 text-sm">
          {ab.length ? ab.map((x:any)=>(
            <li key={x.id} className={abConnected ? 'text-lydian-gold' : ''}>
              <b>{x.id}</b> • status: {x.status} • arms: {x.arms.join(", ")}
            </li>
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
