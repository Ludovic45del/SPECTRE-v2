#!/usr/bin/env bash
# =============================================================================
#  SPECTRE — Constitution du dossier wheels/ pour l'install OFFLINE
# =============================================================================
#  À exécuter sur une machine CONNECTÉE à internet, IDÉALEMENT identique à la
#  cible (RHEL 9 x86_64, Python 3.11) — les wheels binaires (Pillow) doivent
#  correspondre à la plateforme du serveur air-gap.
#
#  Produit : ./wheels/  (à transférer par scp avec le reste du projet)
#  Install sur le serveur :
#     pip install --no-index --find-links wheels/ -r backend/requirements-prod.txt
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
REQ="$REPO_ROOT/backend/requirements-prod.txt"
OUT="$REPO_ROOT/wheels"

echo "==> requirements : $REQ"
echo "==> sortie       : $OUT"
mkdir -p "$OUT"

# Python 3.11 requis (mêmes ABI/tag que la cible).
PY="${PYTHON:-python3.11}"
command -v "$PY" >/dev/null || { echo "ERREUR: $PY introuvable. export PYTHON=..."; exit 1; }
"$PY" --version

# Télécharge aussi une version récente de pip/setuptools/wheel au cas où le
# venv cible doit les mettre à jour hors-ligne.
"$PY" -m pip download -d "$OUT" pip setuptools wheel

# Dépendances de production.
"$PY" -m pip download -d "$OUT" -r "$REQ"

echo ""
echo "==> Wheels générées :"
ls -1 "$OUT" | sed 's/^/    /'
echo ""
echo "OK. Transférez le dossier wheels/ sur le serveur air-gap."
echo ""
echo "NOTE (optionnel) : la génération PDF (fiche de livraison) via WeasyPrint"
echo "n'est PAS incluse. Si elle est requise, télécharger en plus :"
echo "    $PY -m pip download -d \"$OUT\" weasyprint 'pydyf<0.11'"
echo "et installer les libs système cairo/pango/gdk-pixbuf sur le serveur."
