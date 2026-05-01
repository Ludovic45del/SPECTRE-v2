"""
Django settings for SPECTRE project.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Charge backend/.env pour tous les points d'entrée (manage.py, wsgi, pytest, shell).
# override=False : les vraies variables d'environnement ont priorité (utile en prod).
load_dotenv(BASE_DIR / ".env", override=False)

# SECURITY: SECRET_KEY must be set in environment (no fallback in production)
# For development, set DJANGO_SECRET_KEY in your .env file
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if os.environ.get("DEBUG", "False").lower() == "true":
        # Allow insecure key only in DEBUG mode for local development
        SECRET_KEY = "django-insecure-dev-only-key-do-not-use-in-production"
    else:
        raise ValueError(
            "DJANGO_SECRET_KEY environment variable is required in production. "
            "Generate one with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'"
        )

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

# SECURITY: ALLOWED_HOSTS must be explicitly configured
# In production, set ALLOWED_HOSTS env var (comma-separated)
# Example: ALLOWED_HOSTS=example.com,www.example.com
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    # Local apps
    "app",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "app.core.middleware.SecurityHeadersMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "app.core.middleware.RequestIDMiddleware",
    "app.core.middleware.ErrorHandlerMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    # CSRF middleware active mais non bloquante pour l'API : l'authentification
    # est gérée par JWT (stateless, pas de cookies session). DRF désactive CSRF
    # automatiquement pour les vues utilisant SessionAuthentication absente.
    # Si une authentification par session est ajoutée, réévaluer CSRF.
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "app.core.middleware.ForcePasswordChangeMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database - PostgreSQL uniquement, configuration via env vars (cf. .env.example).
# ATOMIC_REQUESTS wraps every HTTP request in a database transaction, so a mutation
# that fails mid-way through a service touching multiple repositories rolls back
# cleanly instead of leaving the DB in a partial state.
_db_name = os.environ.get("DB_NAME")
if not _db_name:
    raise ValueError(
        "DB_NAME environment variable is required. "
        "Configure PostgreSQL via backend/.env (cf. .env.example)."
    )

DATABASES = {
    "default": {
        "ENGINE": os.environ.get("DB_ENGINE", "django.db.backends.postgresql"),
        "NAME": _db_name,
        "USER": os.environ.get("DB_USER", ""),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", "localhost"),
        "PORT": os.environ.get("DB_PORT", "5432"),
        "ATOMIC_REQUESTS": os.environ.get("DB_ATOMIC_REQUESTS", "True").lower()
        == "true",
        # Persistent connections : évite de recréer une connexion PG à chaque requête
        # (≈ 5-20 ms gagnés par requête en prod). 0 = comportement legacy.
        "CONN_MAX_AGE": int(os.environ.get("DB_CONN_MAX_AGE", "60")),
        # Vérifie la connexion réutilisée (Django 4.2+). Indispensable avec
        # CONN_MAX_AGE > 0 pour tolérer les coupures réseau/redémarrages PG.
        "CONN_HEALTH_CHECKS": True,
    }
}

# Cache : LocMemCache par défaut (mono-process). En multi-worker (gunicorn -w N),
# basculer sur Redis via CACHE_BACKEND=django.core.cache.backends.redis.RedisCache
# et CACHE_LOCATION=redis://localhost:6379/1.
# Utilisé par : DRF throttling, cache du dashboard (cf. dashboard_service.py).
CACHES = {
    "default": {
        "BACKEND": os.environ.get(
            "CACHE_BACKEND", "django.core.cache.backends.locmem.LocMemCache"
        ),
        "LOCATION": os.environ.get("CACHE_LOCATION", "spectre-default"),
        "TIMEOUT": int(os.environ.get("CACHE_TIMEOUT", "300")),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = os.environ.get("STATIC_ROOT", str(BASE_DIR / "staticfiles"))
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,
    # Authentication - JWT tokens for API access
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ]
    + (
        ["rest_framework.authentication.SessionAuthentication"]
        if os.environ.get("DEBUG", "False").lower() == "true"
        else []
    ),
    # Permission - RBAC: read-only for lecteurs, write for operateurs+ (S-1)
    # Override per-view with @permission_classes([IsAdmin]) or [IsReadOnlyOrAdmin]
    "DEFAULT_PERMISSION_CLASSES": [
        "app.core.permissions.IsReadOnlyOrOperateur",
    ],
    # Rate limiting - Protect against brute-force and DoS
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "login": "5/minute",
        "refresh": "10/minute",
        # Couvre create_user, reset-password, change-password, set-initial-password :
        # endpoints qui émettent / consomment un jeton d'activation ou changent un secret.
        # 20/h par utilisateur/IP : suffisant pour une admin (batch création) et
        # pour un self-service (l'utilisateur ne change pas 20 fois par heure),
        # sévère pour un attaquant qui brute-force un jeton d'activation.
        "password_reset": "20/hour",
    },
}

# JWT Configuration
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(hours=24),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "SIGNING_KEY": os.environ.get("JWT_SIGNING_KEY", SECRET_KEY),
    "ALGORITHM": "HS256",
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# File upload limits (2.5 MB max for CSV imports)
DATA_UPLOAD_MAX_MEMORY_SIZE = 2621440  # 2.5 MB

# Security Headers (production hardening)
if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = "DENY"
    SECURE_SSL_REDIRECT = (
        os.environ.get("SECURE_SSL_REDIRECT", "True").lower() == "true"
    )
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    # Referrer-Policy défini par Django (strict-origin-when-cross-origin).
    # CSP / Permissions-Policy ajoutés par SecurityHeadersMiddleware.
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Logging configuration (L-1)
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "()": "app.core.logging.StructuredFormatter",
        },
        "simple": {
            "format": "[%(levelname)s] %(name)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured" if not DEBUG else "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING" if not DEBUG else "DEBUG",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "app": {
            "handlers": ["console"],
            "level": "INFO" if not DEBUG else "DEBUG",
            "propagate": False,
        },
    },
}
