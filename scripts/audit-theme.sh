#!/usr/bin/env bash
# audit-theme.sh — find hardcoded colors and i18n mismatches that break dark mode

set -euo pipefail

SRC="src"
MESSAGES="messages"
LOCALE_REF="$MESSAGES/en.json"
LOCALES=("ko" "fr" "zh" "ja")

# Theme colors that should NEVER be hardcoded in component/page files
# (use semantic tokens: bg-background, text-foreground, bg-section-dark, etc.)
THEME_HEX=(
  "#ffffff" "#FFFFFF"
  "#0a0a14" "#0A0A14"
  "#1A1A2E" "#1a1a2e"
  "#E0E0EC" "#e0e0ec"
  "#141424" "#141424"
  "#0f0f1c" "#0F0F1C"
  "#EAF4FC" "#eaf4fc"
  "#F8FBFF" "#f8fbff"
  "#E8F1FA" "#e8f1fa"
)

# Tailwind utilities that are fine as accents but suspicious as backgrounds/text
THEME_CLASSES=(
  "bg-white[^/]"
  "bg-black[^/]"
  "text-white[^/]"
  "text-black[^/]"
)

PASS=true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Theme Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Hardcoded theme hex colors ────────────────────────────────────────────
echo ""
echo "▶ Hardcoded theme hex colors in components/pages"
echo "  (these should use semantic tokens like bg-background, text-foreground, etc.)"
echo ""

FOUND_HEX=false
# Collect all matches, deduplicate across hex variants, then filter
all_hex_results=$(
  for hex in "${THEME_HEX[@]}"; do
    grep -rn --include="*.tsx" --include="*.ts" --include="*.css" \
      -i "$hex" "$SRC" 2>/dev/null || true
  done \
  | sort -u \
  | grep -v "globals.css" \
  | grep -v "SectionDivider.tsx" \
  | grep -v "not-found.tsx" \
  | grep -v "src/app/api/" \
  | grep -v "\[#" \
  || true
)

if [[ -n "$all_hex_results" ]]; then
  echo "$all_hex_results" | while IFS= read -r line; do
    echo "  $line"
  done
  FOUND_HEX=true
  PASS=false
fi

if [[ "$FOUND_HEX" == "false" ]]; then
  echo "  ✓ None found"
fi

# ── 2. Suspicious bg-white / text-white without dark: override ───────────────
echo ""
echo "▶ bg-white / bg-black used as backgrounds (without dark: counterpart)"
echo "  (loading screens, page backgrounds — should use bg-background)"
echo ""

BG_RESULTS=$(grep -rn --include="*.tsx" \
  -E 'className=.*\bbg-white\b|className=.*\bbg-black\b' \
  "$SRC" 2>/dev/null \
  | grep -v "bg-white/" \
  | grep -v "bg-black/" \
  || true)

if [[ -z "$BG_RESULTS" ]]; then
  echo "  ✓ None found"
else
  # Flag lines that have no dark:bg- counterpart on the same line
  flagged=""
  while IFS= read -r line; do
    if ! echo "$line" | grep -q "dark:bg-"; then
      flagged+="$line"$'\n'
    fi
  done <<< "$BG_RESULTS"

  if [[ -z "$flagged" ]]; then
    echo "  ✓ All instances have dark: counterparts"
  else
    echo "$flagged" | while IFS= read -r line; do
      [[ -n "$line" ]] && echo "  $line"
    done
    PASS=false
  fi
fi

# ── 3. Inline style with hardcoded color ─────────────────────────────────────
echo ""
echo "▶ Inline style={{ color / background }} with hardcoded values"
echo "  (should use CSS variables or className)"
echo ""

INLINE=$(grep -rn --include="*.tsx" \
  -E 'style=\{.*\b(color|background|backgroundColor)\s*:\s*["\x27]#' \
  "$SRC" 2>/dev/null \
  | grep -v "SectionDivider" \
  | grep -v "src/app/api/" \
  | grep -v "not-found.tsx" \
  || true)

if [[ -n "$INLINE" ]]; then
  echo "$INLINE" | while IFS= read -r line; do
    echo "  $line"
  done
  PASS=false
else
  echo "  ✓ None found"
fi

# ── 4. Translation key parity ────────────────────────────────────────────────
echo ""
echo "▶ Translation key parity (vs en.json)"
echo ""

for locale in "${LOCALES[@]}"; do
  file="$MESSAGES/$locale.json"
  missing=$(diff \
    <(jq -r 'path(..) | join(".")' "$LOCALE_REF" | sort) \
    <(jq -r 'path(..) | join(".")' "$file" | sort) \
    | grep "^<" | sed 's/^< //' || true)

  extra=$(diff \
    <(jq -r 'path(..) | join(".")' "$LOCALE_REF" | sort) \
    <(jq -r 'path(..) | join(".")' "$file" | sort) \
    | grep "^>" | sed 's/^> //' || true)

  if [[ -z "$missing" && -z "$extra" ]]; then
    echo "  ✓ $locale.json — keys match en.json"
  else
    PASS=false
    if [[ -n "$missing" ]]; then
      echo "  ✗ $locale.json — missing keys:"
      echo "$missing" | while IFS= read -r key; do echo "      $key"; done
    fi
    if [[ -n "$extra" ]]; then
      echo "  ⚠ $locale.json — extra keys (not in en.json):"
      echo "$extra" | while IFS= read -r key; do echo "      $key"; done
    fi
  fi
done

# ── 5. Translation values that are still English in non-English files ─────────
echo ""
echo "▶ Untranslated strings (values identical to en.json in non-English files)"
echo "  (leaf string values only — numbers/booleans excluded)"
echo ""

for locale in "${LOCALES[@]}"; do
  file="$MESSAGES/$locale.json"
  untranslated=$(jq -rn \
    --slurpfile en "$LOCALE_REF" \
    --slurpfile loc "$file" \
    '
    def leaves(o):
      o | to_entries[] |
      if (.value | type) == "object" then (.key as $k | .value | leaves(.) | .key = ($k + "." + .key))
      else .
      end;
    [leaves($en[0])] as $en_leaves |
    [leaves($loc[0])] as $loc_leaves |
    ($en_leaves | map(select(.value | type == "string"))) as $en_strings |
    ($loc_leaves | map(select(.value | type == "string")) | map({(.key): .value}) | add) as $loc_map |
    $en_strings[] |
    select(.value == ($loc_map[.key] // "")) |
    select(.value | length > 0) |
    .key
    ' 2>/dev/null | head -20 || true)

  if [[ -z "$untranslated" ]]; then
    echo "  ✓ $locale.json — no obviously untranslated strings"
  else
    count=$(echo "$untranslated" | wc -l)
    echo "  ⚠ $locale.json — $count strings match English exactly (may be intentional):"
    echo "$untranslated" | while IFS= read -r key; do echo "      $key"; done
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "$PASS" == "true" ]]; then
  echo "  ✓ All checks passed"
else
  echo "  ✗ Issues found — review above"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
