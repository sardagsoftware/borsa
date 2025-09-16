const fetch = (...a)=>import("node-fetch").then(({default:f})=>f(...a));
(async ()=>{
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const ok = await fetch(`${base}/api/functions/getRWARegistry`, {
    method:"POST", headers:{ "content-type":"application/json" },
    body: JSON.stringify({ name:"getRWARegistry", args:{} })
  });
  if (!ok.ok) throw new Error("Fn getRWARegistry failed");
  console.log("OK • getRWARegistry");
})();
