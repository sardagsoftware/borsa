#!/usr/bin/env bash
set -euo pipefail
echo "🔎 Lydian • Reveal UI — Verify Console Routes"

ROOT="$(pwd)"
CONSOLE_DIR="$ROOT/apps/console"
LOG_DIR="$ROOT/logs"; mkdir -p "$LOG_DIR"

export NODE_OPTIONS="--max-old-space-size=8192"
export PORT_CONSOLE=3100

cd "$CONSOLE_DIR"

echo "🧹 Cleaning port $PORT_CONSOLE..."
pkill -f "next dev -p $PORT_CONSOLE" 2>/dev/null || true
lsof -ti :$PORT_CONSOLE | xargs kill -9 2>/dev/null || true

echo "🔍 Story data files check..."
STORY_ROOT="$ROOT/story"
missing=0
for f in story-bible.md story-timeline.json characters.json themes.json dialogue-samples.md aesthetic-palette.json telemetry-tags.yaml; do
  if [ ! -f "$STORY_ROOT/$f" ]; then
    echo "❌ Missing: $f"
    missing=$((missing+1))
  else
    echo "✅ Found: $f"
  fi
done

if [ $missing -gt 0 ]; then
  echo "⚠️  Some story files are missing. Characters/Story pages may appear empty."
fi

echo ""
echo "🟢 Starting Next.js dev server on port $PORT_CONSOLE..."
(pnpm dev --port $PORT_CONSOLE || npm run dev -- --port $PORT_CONSOLE) > "$LOG_DIR/console-$PORT_CONSOLE.log" 2>&1 &

echo "⏳ Waiting for server to be ready..."
for i in {1..60}; do
  sleep 1
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_CONSOLE/ 2>/dev/null || echo 000)
  if [ "$code" = "200" ]; then
    echo "✅ Server is ready!"
    break
  fi
  if [ $i -eq 60 ]; then
    echo "❌ Timeout waiting for server"
    exit 1
  fi
done

echo ""
echo "📊 Health Check Results:"
printf "ROOT (/)               : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_CONSOLE/ || echo 000)"
printf "/console/characters    : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_CONSOLE/console/characters || echo 000)"
printf "/console/story         : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_CONSOLE/console/story || echo 000)"
printf "/console/liveops/s2    : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_CONSOLE/console/liveops/s2 || echo 000)"
printf "/console/kpis          : %s\n"  "$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT_CONSOLE/console/kpis || echo 000)"

echo ""
echo "🔗 Opening browser..."
URL_ROOT="http://localhost:$PORT_CONSOLE/?nocache=$(date +%s)"
URL_CHAR="http://localhost:$PORT_CONSOLE/console/characters?lang=tr&nocache=$(date +%s)"

case "$OSTYPE" in
  darwin*) 
    open "$URL_ROOT" >/dev/null 2>&1 || true
    sleep 1
    open "$URL_CHAR" >/dev/null 2>&1 || true
    ;;
  linux*) xdg-open "$URL_ROOT" >/dev/null 2>&1 || true ;;
  msys*)  start "" "$URL_ROOT" ;;
esac

echo ""
echo "📄 Server log: $LOG_DIR/console-$PORT_CONSOLE.log"
echo "✅ Reveal UI complete! Console running on port $PORT_CONSOLE"
echo "   • Root page: http://localhost:$PORT_CONSOLE"
echo "   • Characters: http://localhost:$PORT_CONSOLE/console/characters"
echo "   • Story Bible: http://localhost:$PORT_CONSOLE/console/story"
