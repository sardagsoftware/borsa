import React from "react";
import { normalizeKpis } from "@/lib/kpis/normalize";
import KPIsLive from "./KPIsLive";

export default async function Kpis() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const res = await fetch(`${base}/kpis/s2`, { cache:"no-store" }).catch(()=>null);
  const raw = res && res.ok ? await res.json() : null;
  const initialData = normalizeKpis(raw);

  return <KPIsLive initialData={initialData} />;
}
