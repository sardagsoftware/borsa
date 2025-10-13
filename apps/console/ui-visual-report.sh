#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────
# Config
# ─────────────────────────────
BASE_URL="${BASE_URL:-http://localhost:3100}"
OUT_DIR="reports/ui"
DATE="$(date +%Y%m%d-%H%M)"
NODE_OPTIONS="--max-old-space-size=8192"
VIEWPORT="1366,864"

mkdir -p "$OUT_DIR/screens" "$OUT_DIR/lh" logs

# ─────────────────────────────
# Health checks
# ─────────────────────────────
echo "🔎 Health checks for $BASE_URL"
for path in / /story /liveops/s2 /kpis; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" 2>/dev/null || echo 000)
  printf "  • %-14s → %s\n" "$path" "$code"
done

# ─────────────────────────────
# Dependencies (local, non-global)
# ─────────────────────────────
if ! command -v node >/dev/null 2>&1; then echo "❌ Node gerekli"; exit 1; fi
PJS="puppeteer@22.15.0"
LHS="lighthouse@11.7.1"
PNPM_AVAIL=0; command -v pnpm >/dev/null 2>&1 && PNPM_AVAIL=1

echo "📦 Installing dependencies..."
if [ $PNPM_AVAIL -eq 1 ]; then
  pnpm add -w $PJS $LHS >/dev/null 2>&1 || pnpm add $PJS $LHS >/dev/null 2>&1
else
  npm i -D $PJS $LHS >/dev/null 2>&1
fi

# ─────────────────────────────
# Puppeteer script (screenshots + runtime checks)
# ─────────────────────────────
cat > .tmp-ui-snap.js <<'JS'
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT  = process.env.OUT_DIR  || 'reports/ui/screens';
const VIEWPORT = (process.env.VIEWPORT || '1366,864').split(',').map(x=>parseInt(x,10));
const pages = [
  { id:'story', url:`${BASE}/story`, checks:[
    {sel:'main h1',          name:'Title'},
    {sel:'section h2',       name:'Section headers'},
    {sel:'pre',              name:'Palette/Telemetry blocks', opt:true}
  ]},
  { id:'liveops-s2', url:`${BASE}/liveops/s2`, checks:[
    {sel:'h1',               name:'Season title'},
    {sel:'section h2',       name:'Section headers'},
    {sel:'.rounded-lg',      name:'Cards present', min:1}
  ]},
  { id:'kpis', url:`${BASE}/kpis`, checks:[
    {sel:'h1',               name:'KPI title'},
    {sel:'.rounded-lg',      name:'KPI cards', min:3}
  ]},
];

(async () => {
  const browser = await puppeteer.launch({headless:true, args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width:VIEWPORT[0], height:VIEWPORT[1], deviceScaleFactor:1});

  const results = [];
  for (const p of pages) {
    const url = p.url;
    const start = Date.now();
    const resp = await page.goto(url, {waitUntil:['domcontentloaded','networkidle2'], timeout:60000}).catch(()=>null);
    const status = resp ? resp.status() : 0;

    // TR (default) screenshot
    const trShot = path.join(OUT, `${p.id}-tr.png`);
    await page.screenshot({path:trShot, fullPage:true});

    // Switch to AR (RTL) via query or header if SSR supports (?lang=ar fallback)
    const rtlUrl = url.includes('?') ? `${url}&lang=ar` : `${url}?lang=ar`;
    const respAR = await page.goto(rtlUrl, {waitUntil:['domcontentloaded','networkidle2'], timeout:60000}).catch(()=>null);
    const arShot = path.join(OUT, `${p.id}-ar.png`);
    await page.screenshot({path:arShot, fullPage:true});

    // Basic checks
    const checks = [];
    for (const c of p.checks) {
      const count = await page.$$eval(c.sel, els => els.length).catch(()=>0);
      const ok = count >= (c.min || 1) || !!c.opt;
      checks.push({name:c.name, selector:c.sel, count, ok});
    }

    const dur = Date.now()-start;
    results.push({id:p.id, url, status, dur_ms:dur, shots:{tr:trShot, ar:arShot}, checks});
  }

  fs.writeFileSync(path.join(path.dirname(OUT), 'runtime.json'), JSON.stringify(results,null,2));
  await browser.close();
})();
JS

# Run puppeteer
echo "📸 Capturing screenshots (TR/AR)…"
BASE_URL="$BASE_URL" OUT_DIR="$OUT_DIR/screens" VIEWPORT="$VIEWPORT" node ./.tmp-ui-snap.js

# ─────────────────────────────
# Lighthouse audits (desktop)
# ─────────────────────────────
echo "🔦 Lighthouse audits… (this may take a bit)"
LH="node_modules/.bin/lighthouse"
for path in /story /liveops/s2 /kpis; do
  outJson="$OUT_DIR/lh/$(echo $path | tr -d '/').json"
  outHtml="$OUT_DIR/lh/$(echo $path | tr -d '/').html"
  $LH "$BASE_URL$path" \
    --preset=desktop \
    --throttling-method=provided \
    --output=json --output-path="$outJson" \
    --output=html --output-path="$outHtml" \
    --quiet >/dev/null 2>&1 || true
done

# ─────────────────────────────
# Build consolidated HTML report
# ─────────────────────────────
echo "🧷 Building consolidated report…"
cat > "$OUT_DIR/index.html" <<'HTML'
<!doctype html><html lang="tr"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Lydian Console — UI Verification Report</title>
<style>
 body{font:14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#0b0f19;color:#eaeef6;margin:24px}
 h1{font-size:20px;margin:0 0 12px} h2{font-size:16px;margin:16px 0 6px;color:#E6C67A}
 .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
 .card{border:1px solid #ffffff22;border-radius:12px;padding:12px;background:#11182766;backdrop-filter: blur(8px)}
 .shots img{width:100%;border-radius:8px;border:1px solid #ffffff22;margin:8px 0}
 .ok{color:#6EE7A8}.bad{color:#FCA5A5}
 .meta{opacity:.8}
 a{color:#93C5FD}
</style>
</head><body>
<h1>🧪 Lydian Console — UI Verification Report</h1>
<div class="meta">Story • LiveOps S2 • KPIs — TR & AR (RTL) screenshots • Lighthouse summaries • Runtime checks</div>
<div id="root"></div>
<script>
(async()=>{
  const runtime = await (await fetch('./runtime.json')).json().catch(()=>[]);
  const el = document.getElementById('root');
  function section(r){
    const checks = r.checks.map(c=>`<li>${c.name} <code>${c.selector}</code> — <b class="${c.ok?'ok':'bad'}">${c.ok?'OK':'FAIL'}</b> <small>(count:${c.count})</small></li>`).join('');
    return `
    <div class="card">
      <h2>${r.id.toUpperCase()} — status ${r.status} • ${r.dur_ms}ms</h2>
      <div class="grid">
        <div class="shots">
          <div>TR</div><img src="./screens/${r.id}-tr.png" />
          <div>AR (RTL)</div><img src="./screens/${r.id}-ar.png" />
        </div>
        <div>
          <h3>Runtime Checks</h3>
          <ul>${checks}</ul>
          <h3>Lighthouse</h3>
          <ul>
            <li><a href="./lh/${r.id}.html" target="_blank">Open detailed LH report</a></li>
          </ul>
        </div>
      </div>
    </div>`;
  }
  el.innerHTML = runtime.map(section).join('');
})();
</script>
</body></html>
HTML

# ─────────────────────────────
# Summary
# ─────────────────────────────
printf "\n✅ UI Verification Report generated.\n"
printf "   Open: %s/index.html\n" "$OUT_DIR"
printf "   Screens: %s/screens/{story,liveops-s2,kpis}-{tr,ar}.png\n" "$OUT_DIR"
printf "   LH: %s/lh/*.html\n\n" "$OUT_DIR"
