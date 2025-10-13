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
