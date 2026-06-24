#!/usr/bin/env bash
set -euo pipefail

GH="${GH:-$HOME/.local/bin/gh}"
REPO_NAME="${1:-arcade-rush}"

if ! "$GH" auth status &>/dev/null; then
  echo "→ Bitte zuerst bei GitHub anmelden:"
  echo "  $GH auth login"
  echo ""
  echo "Dann dieses Script erneut ausführen:"
  echo "  bash push-to-github.sh"
  exit 1
fi

cd "$(dirname "$0")"
"$GH" repo create "$REPO_NAME" --public --source=. --remote=origin --push
echo ""
echo "✓ Repo erstellt und gepusht: https://github.com/$("$GH" api user -q .login)/$REPO_NAME"
echo ""
echo "Netlify einrichten:"
echo "  1. https://app.netlify.com → Add new site → Import from Git"
echo "  2. Repo '$REPO_NAME' wählen"
echo "  3. Base directory: arcade-rush"
echo "  4. Build command: bash scripts/prepare-deploy.sh"
echo "  5. Publish directory: ."
echo "  6. Deploy site"