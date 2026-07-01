#!/usr/bin/env bash
# =============================================================================
#  SPECTRE — Correction des permissions + contexte SELinux
# =============================================================================
#  À exécuter APRÈS collectstatic (les statiques doivent exister pour être
#  correctement étiquetés) et AVANT de démarrer Apache. Cf. DEPLOYMENT.md.
#
#  Deux problèmes traités :
#   1. Les fichiers transférés par scp arrivent souvent en drwx------ : Apache
#      (utilisateur `apache`, ≠ propriétaire) ne peut ni traverser ni lire
#      → 403 / page blanche. On applique a+rX (lecture pour tous + traversée
#      des dossiers).
#   2. SELinux (RHEL 9 enforcing par défaut) : Apache ne peut lire que du
#      contenu étiqueté httpd_sys_content_t. On crée d'abord les dossiers
#      servis (media, staticfiles) PUIS on les étiquette — ainsi les fichiers
#      écrits ensuite (uploads au runtime, collectstatic) héritent du bon
#      contexte de leur dossier parent.
#
#  Usage :  sudo bash deploy/airgap/fix-permissions.sh [/opt/spectre] [owner]
# =============================================================================
set -euo pipefail

ROOT="${1:-/opt/spectre}"
OWNER="${2:-spectre}"
echo "==> Racine : $ROOT   (propriétaire applicatif : $OWNER)"

# 0) Dossiers runtime : doivent EXISTER avant l'étiquetage SELinux, et être
#    accessibles en écriture par gunicorn (uploads, base SQLite).
mkdir -p "$ROOT/backend/media" "$ROOT/backend/staticfiles" "$ROOT/data"
chown -R "$OWNER":"$OWNER" "$ROOT/backend/media" "$ROOT/backend/staticfiles" "$ROOT/data"

# 1) Lecture pour tous + traversée des dossiers (X = exec sur dossiers only).
#    N'enlève pas le droit d'écriture du propriétaire (owner rwx conservé).
chmod -R a+rX "$ROOT"

# 2) SELinux : contexte de contenu web sur les répertoires servis DIRECTEMENT
#    par Apache. `|| true` : sans SELinux ou sans semanage, on ignore proprement.
if command -v semanage >/dev/null 2>&1; then
    for d in "frontend/dist" "backend/staticfiles" "backend/media"; do
        semanage fcontext -a -t httpd_sys_content_t "$ROOT/$d(/.*)?" 2>/dev/null || true
    done
    # restorecon sur des dossiers qui EXISTENT désormais → étiquetage effectif ;
    # les fichiers créés ensuite héritent du type de leur dossier parent.
    restorecon -Rv "$ROOT/frontend/dist" "$ROOT/backend/staticfiles" "$ROOT/backend/media" 2>/dev/null || true
    # Autoriser Apache à ouvrir la connexion réseau vers gunicorn (reverse proxy).
    setsebool -P httpd_can_network_connect on 2>/dev/null || true
else
    echo "   (semanage absent — étape SELinux ignorée)"
fi

echo "==> Permissions et contexte SELinux corrigés."
echo "    Base SQLite ($ROOT/data) et médias ($ROOT/backend/media) restent"
echo "    accessibles en écriture par l'utilisateur gunicorn ($OWNER)."
