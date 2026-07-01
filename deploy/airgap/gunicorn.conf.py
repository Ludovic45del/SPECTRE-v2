# =============================================================================
#  SPECTRE — configuration gunicorn (déploiement air-gap)
#  Utilisée par le service systemd (cf. spectre-gunicorn.service).
# =============================================================================

# N'écoute qu'en local : Apache est le seul point d'entrée public.
bind = "127.0.0.1:8000"

# Workers : règle usuelle 2×CPU+1. Pour SQLite, garder modéré (2–3) afin de
# limiter la contention d'écriture (« database is locked » ; un busy timeout de
# 20 s est déjà configuré côté Django). Ajuster selon la charge réelle.
workers = 3

# Requêtes longues (génération de documents, exports) tolérées.
timeout = 120
graceful_timeout = 30
keepalive = 5

# Logs vers stdout/stderr → capturés par journald (systemd).
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Recyclage périodique des workers (évite les fuites mémoire sur la durée).
max_requests = 1000
max_requests_jitter = 100
