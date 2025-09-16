import type { NextApiRequest, NextApiResponse } from "next";
import { ENV } from "@/lib/env";

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  const { name } = req.query; const { args } = req.body || {};
  if (!name) return res.status(400).json({ message:"missing name" });

  if (ENV.MODE === "prod") {
    const r = await fetch(`${process.env.BACKEND_URL}/functions/${name}`, {
      method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ name, args })
    });
    const j = await r.json().catch(()=> ({}));
    return res.status(r.status).json(j);
  }

  // DEMO STUBS
  switch (name) {
    case "getRWARegistry": return res.json({ items:[
      { id:"RWA-1001", type:"realestate", valueUsd: 850000, status:"onchain" },
      { id:"RWA-1002", type:"bond",       valueUsd: 500000, status:"onchain" }
    ]});
    case "getVaultPerformance": return res.json({ series: Array.from({length:24}).map((_,i)=>({ t:`W${i+1}`, apy:4.1+Math.sin(i/2)*.6, tvl: 10+i*1.1 })) });
    case "getGreeks": return res.json({ delta:.44, gamma:.012, theta:-.010, vega:.09, rho:.005, iv:36.3 });
    case "getBridgeRisk": return res.json({ risk: 82, tvl: 2.8, latency: 2.6, audit: 90 });
    case "tokenizeAsset": return res.json({ ok:true, txHash:"0xDEMO...", token:"0xTOKEN..." });
    case "depositVault": return res.json({ ok:true, txHash:"0xDEMO..." });
    case "withdrawVault": return res.json({ ok:true, txHash:"0xDEMO..." });
    case "runHedgeBot": return res.json({ ok:true, mode: args?.mode, actions:[{ type:"futures-offset", qty: -12345 }] });
    case "routeIntentV2": return res.json({ intentId:"INT-DEMO-001", action:"ALLOW", reason:"guards pass" });
    case "explainDecision": return res.json({ intentId: args?.intentId, guards:{ drift:"OK", L:78 }, signals:{ corr:-0.18 } });
    default: return res.status(404).json({ message:`unknown fn ${name}` });
  }
}
