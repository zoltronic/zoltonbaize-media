#!/usr/bin/env bash
# Pre-minify the site scripts into real *.min.js files in the repo, so jsDelivr serves them as-is.
# (jsDelivr's on-the-fly minify is slow on the first request for each new commit, and can fail and cache a 404.)
# Run after editing any of these, commit, then bump the SHA in Webflow.
set -e
cd "$(dirname "$0")/.."
FILES="gold/3d/gold_coin.js gold/3d/gold_hero.js gold/3d/gold_type.js gold/3d/coin_hero.js gold/3d/phone_mock.js gold/3d/phone_dom.js gold/3d/alpha_video.js analytics/zb-analytics.js"
for f in $FILES; do
  out="${f%.js}.min.js"; mod=""; grep -qE "^\s*import |^\s*export " "$f" && mod="--module"
  npx -y terser "$f" $mod -c -m --comments false -o "$out"
  echo "$out $(wc -c < "$f") -> $(wc -c < "$out")"
done
