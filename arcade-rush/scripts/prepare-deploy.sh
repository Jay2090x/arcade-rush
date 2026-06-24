#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAMES="$ROOT/games"
PARENT="$(cd "$ROOT/.." && pwd)"

copy_game() {
  local name="$1"
  local src="$2"
  local dest="$GAMES/$name"
  if [[ ! -d "$src" ]]; then
    echo "Warnung: $src nicht gefunden — überspringe $name"
    return 0
  fi
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R "$src/." "$dest/"
  echo "✓ $name eingebunden"
}

mkdir -p "$GAMES"

# Symlinks durch echte Dateien ersetzen (Netlify unterstützt keine externen Symlinks)
copy_game "sky-drift" "$PARENT/sky-drift"
copy_game "goldgraeber" "$PARENT/goldgraeber-saga"
copy_game "neon-stack" "$PARENT/neon-stack"

echo "Deploy-Paket bereit."