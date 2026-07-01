#!/usr/bin/env bash
# =============================================================================
#  SPECTRE — Constitution du dossier wheels/ pour l'install OFFLINE
# =============================================================================
#  À exécuter sur une machine CONNECTÉE à internet — PEU IMPORTE son OS/Python :
#  les flags --platform/--python-version/--abi ci-dessous forcent le
#  téléchargement de wheels pour la CIBLE (Linux RHEL 9, Python 3.11 x86_64).
#
#  Produit : ./wheels/  (à transférer par scp avec le reste du projet)
#  Install sur le serveur :
#     pip install --no-index --find-links wheels/ -r backend/requirements-prod.txt
#
#  Réglages (surchargeables par variables d'env) :
#     PLATFORM=manylinux2014_x86_64   # ARM → manylinux2014_aarch64
#     PYVER=3.11                      # version Python cible
#     ABI=cp311                       # ABI CPython cible (cp311 pour 3.11)
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
REQ="$REPO_ROOT/backend/requirements-prod.txt"
OUT="$REPO_ROOT/wheels"

PLATFORM="${PLATFORM:-manylinux2014_x86_64}"
PYVER="${PYVER:-3.11}"
ABI="${ABI:-cp311}"

echo "==> requirements : $REQ"
echo "==> sortie       : $OUT"
echo "==> cible        : platform=$PLATFORM python=$PYVER abi=$ABI"
mkdir -p "$OUT"

# pip utilisable localement (n'importe quelle version/OS : ces flags ciblent
# la plateforme voulue, indépendamment de l'interpréteur qui exécute pip).
PY="${PYTHON:-python3}"
command -v "$PY" >/dev/null || { echo "ERREUR: $PY introuvable. export PYTHON=..."; exit 1; }
"$PY" --version

# pip/setuptools/wheel : wheels universelles (py3-none-any) → pas de flag plateforme.
"$PY" -m pip download -d "$OUT" pip setuptools wheel

# Dépendances de production, forcées pour la cible Linux/3.11.
# --only-binary=:all: (imposé par --platform) : jamais de compilation, tout en wheel.
"$PY" -m pip download -d "$OUT" \
    --only-binary=:all: \
    --platform "$PLATFORM" \
    --python-version "$PYVER" \
    --implementation cp \
    --abi "$ABI" \
    -r "$REQ"

echo ""
echo "==> Wheels générées :"
ls -1 "$OUT" | sed 's/^/    /'
echo ""
echo "OK. Transférez le dossier wheels/ sur le serveur air-gap."
echo ""
echo "NOTE (optionnel) : la génération PDF (fiche de livraison) via WeasyPrint"
echo "n'est PAS incluse. Si elle est requise, télécharger en plus (mêmes flags) :"
echo "    $PY -m pip download -d \"$OUT\" --only-binary=:all: \\"
echo "        --platform \"$PLATFORM\" --python-version \"$PYVER\" --implementation cp --abi \"$ABI\" \\"
echo "        weasyprint 'pydyf<0.11'"
echo "et installer les libs système cairo/pango/gdk-pixbuf sur le serveur."
