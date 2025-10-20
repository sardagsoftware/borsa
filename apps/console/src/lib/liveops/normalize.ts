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
