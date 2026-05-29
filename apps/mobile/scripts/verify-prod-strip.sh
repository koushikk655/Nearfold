#!/usr/bin/env bash
#
# scripts/verify-prod-strip.sh
#
# Verify the production bundle excludes everything under src/dev/.
# Runs `expo export` in production mode, then grep's the output for
# unique strings from each dev module. Fails if any are found.
#
# Usage:
#   pnpm --filter mobile verify:prod-strip
#
# What this is doing: when the babel plugin
# (babel-plugins/replace-dev-imports.js) is wired up correctly, no
# src/dev/* file should appear in the production bundle. We assert this
# at the byte level rather than trusting the plugin in isolation.

set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"
OUT_DIR=".bundle-prod"

echo "==> apps/mobile @ $PROJECT_ROOT"
echo "==> Cleaning $OUT_DIR"
rm -rf "$OUT_DIR"

echo "==> Bundling for iOS in production mode..."
# NODE_ENV=production is what babel.config.js checks. --platform ios
# limits the output to a single platform bundle, faster to inspect.
# --output-dir keeps it out of the default dist/ so CI / git ignore
# doesn't fight us.
NODE_ENV=production BABEL_ENV=production \
  npx expo export --platform ios --output-dir "$OUT_DIR" --clear

# Find every JS chunk produced.
BUNDLE_GLOB="$OUT_DIR/_expo/static/js/ios"
if [ ! -d "$BUNDLE_GLOB" ]; then
  echo "FAIL: expo export did not produce $BUNDLE_GLOB. Check the output above."
  exit 1
fi

echo ""
echo "==> Production JS chunks:"
ls -lh "$BUNDLE_GLOB"/ | awk 'NR>1 {printf "  %-60s %s\n", $9, $5}'
TOTAL_BYTES=$(du -bc "$BUNDLE_GLOB"/* 2>/dev/null | awk '/total/ {print $1}')
TOTAL_KB=$(( TOTAL_BYTES / 1024 ))
echo "  Total: ${TOTAL_KB} KB"
echo ""

# Strings that appear ONLY in src/dev/* files. If any of these show up in
# the production bundle, the babel plugin failed to strip the dev tree.
echo "==> Grepping bundle for dev-only strings..."
DEV_STRINGS=(
  "storyGroups"           # src/dev/stories/index.tsx
  "ColorsStory"           # src/dev/stories/ColorsStory.tsx
  "ButtonStory"           # src/dev/stories/ButtonStory.tsx
  "MotionStory"           # src/dev/stories/MotionStory.tsx
  "TypographyStory"       # src/dev/stories/TypographyStory.tsx
  "DevGallery"            # src/dev/DevGallery.tsx
  "StoryFrame"            # src/dev/StoryFrame.tsx
  "Pick a story"          # src/dev/DevGallery.tsx fallback copy
)

FAIL=0
for s in "${DEV_STRINGS[@]}"; do
  # grep -F = literal, -q = quiet, -r = recursive
  if grep -Fqr "$s" "$BUNDLE_GLOB"/; then
    echo "  ✗ '$s' is in the production bundle"
    FAIL=1
  else
    echo "  ✓ '$s' not in bundle"
  fi
done

echo ""
if [ "$FAIL" = "1" ]; then
  echo "FAIL: dev code is leaking into production. Check that:"
  echo "  1. babel-plugins/replace-dev-imports.js is loaded in babel.config.js"
  echo "  2. NODE_ENV / BABEL_ENV are 'production' during the export"
  echo "  3. No file outside src/dev/ imports from src/dev/ via a path"
  echo "     this plugin's DEV_PATH_RE doesn't catch"
  exit 1
fi

# Also check that the stub IS present — sanity that we actually exercised
# the dev route's compiled output.
if grep -Fqr "DevDisabled" "$BUNDLE_GLOB"/; then
  echo "✓ dev-stub.tsx (DevDisabled) is in the bundle — stub fired correctly"
fi

echo ""
echo "PASS: src/dev/* excluded from production bundle. ${TOTAL_KB} KB total."
