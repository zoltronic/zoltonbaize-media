#!/usr/bin/env bash
# Copy the live site scripts into zoltbot/public/s/, which Netlify serves at https://zoltbot.netlify.app/s/...
# Only what's copied here is live: work in progress elsewhere in the repo never reaches visitors until it's released.
# Usage: tools/release.sh            (copies everything listed below)
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=zoltbot/public/s
for f in analytics/zb-analytics.js clouds/zb-clouds.js splash/zb-splash.js experience/zb-experience.js password/zb-password.js draft/zb-draft.js; do
  mkdir -p "$OUT/$(dirname "$f")"; cp "$f" "$OUT/$f"
done
# the cloud stills zb-clouds.js loads (day + night of each item in its SCENE)
mkdir -p "$OUT/clouds/lib" "$OUT/clouds/soft"
cp clouds/lib/*.webp "$OUT/clouds/lib/"; cp clouds/soft/*.webp "$OUT/clouds/soft/"
echo "released to $OUT:"; find "$OUT" -type f | sort | sed 's/^/  /'
