#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAMES="$ROOT/games"
PARENT="$(cd "$ROOT/.." && pwd)"
SITE_URL="${URL:-${DEPLOY_PRIME_URL:-http://localhost:8888}}"
SITE_URL="${SITE_URL%/}"

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

copy_game "sky-drift" "$PARENT/sky-drift"
copy_game "goldgraeber" "$PARENT/goldgraeber-saga"
copy_game "neon-stack" "$PARENT/neon-stack"
copy_game "vatreni-bro" "$PARENT/vatreni-bro"

# SEO: {{SITE_URL}} in HTML ersetzen (Netlify setzt URL beim Build)
for html in "$ROOT/index.html" "$ROOT/datenschutz.html"; do
  if [[ -f "$html" ]]; then
    sed "s|{{SITE_URL}}|$SITE_URL|g" "$html" > "$html.tmp" && mv "$html.tmp" "$html"
  fi
done

# robots.txt
cat > "$ROOT/robots.txt" << EOF
User-agent: *
Allow: /
Disallow: /dashboard.html

Sitemap: $SITE_URL/sitemap.xml
EOF

# sitemap.xml
TODAY=$(date +%Y-%m-%d)
cat > "$ROOT/sitemap.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>$SITE_URL/</loc><lastmod>$TODAY</lastmod><priority>1.0</priority></url>
  <url><loc>$SITE_URL/games/sky-drift/</loc><lastmod>$TODAY</lastmod><priority>0.9</priority></url>
  <url><loc>$SITE_URL/games/goldgraeber/</loc><lastmod>$TODAY</lastmod><priority>0.9</priority></url>
  <url><loc>$SITE_URL/games/neon-stack/</loc><lastmod>$TODAY</lastmod><priority>0.9</priority></url>
  <url><loc>$SITE_URL/games/vatreni-bro/</loc><lastmod>$TODAY</lastmod><priority>0.9</priority></url>
  <url><loc>$SITE_URL/datenschutz.html</loc><lastmod>$TODAY</lastmod><priority>0.3</priority></url>
</urlset>
EOF

echo "✓ SEO: robots.txt + sitemap.xml ($SITE_URL)"
echo "Deploy-Paket bereit."