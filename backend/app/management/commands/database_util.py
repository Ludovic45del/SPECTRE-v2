from pathlib import Path

import pandas as pd
from django.conf import settings
from django.db import connection
from sqlalchemy import create_engine
from sqlalchemy.engine import URL


def get_conn():
    """Connexion SQLAlchemy PostgreSQL (chemin rapide pour le seed en prod PG)."""
    db_settings = settings.DATABASES["default"]
    engine = db_settings.get("ENGINE", "")

    if "postgresql" not in engine:
        raise RuntimeError(
            f"Only PostgreSQL is supported, got ENGINE={engine!r}. "
            "Configure DB_ENGINE=django.db.backends.postgresql in backend/.env."
        )

    port = db_settings.get("PORT") or "5432"
    url = URL.create(
        drivername="postgresql",
        username=db_settings.get("USER") or None,
        password=db_settings.get("PASSWORD") or None,
        host=db_settings.get("HOST") or "localhost",
        port=int(port),
        database=db_settings.get("NAME") or None,
    )

    return create_engine(url).connect()


def _table_has_rows(table_name):
    """True si la table existe déjà et contient au moins une ligne.

    Permet de rendre le seed idempotent : les référentiels campagne sont
    déjà insérés par les migrations de seed, inutile (et conflictuel) de
    les réinsérer via le CSV.
    """
    if table_name not in connection.introspection.table_names():
        return False
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) FROM {connection.ops.quote_name(table_name)}")
        return cursor.fetchone()[0] > 0


def _insert_via_django(table_name, df):
    """Insère un DataFrame via la connexion Django.

    Indépendant du moteur : fonctionne avec SQLite (serveur de dev) comme
    avec tout backend supporté par Django. Les colonnes du CSV correspondent
    aux colonnes réelles de la table.
    """
    columns = list(df.columns)
    rows = [
        tuple(None if pd.isna(value) else value for value in record)
        for record in df.itertuples(index=False, name=None)
    ]
    if not rows:
        return

    quote = connection.ops.quote_name
    cols_sql = ", ".join(quote(col) for col in columns)
    placeholders = ", ".join(["%s"] * len(columns))
    sql = f"INSERT INTO {quote(table_name)} ({cols_sql}) VALUES ({placeholders})"

    with connection.cursor() as cursor:
        cursor.executemany(sql, rows)


def insert_csv_into_table(self, table_name, csv_path):
    try:
        # Seed idempotent : ne pas réinsérer si la table est déjà peuplée
        # (ex. référentiels campagne seedés par les migrations).
        if _table_has_rows(table_name):
            self.stdout.write(
                self.style.WARNING(
                    f"Table '{table_name}' déjà peuplée, insertion ignorée."
                )
            )
            return

        # Use Path for cross-platform path handling
        df = pd.read_csv(Path(csv_path), dtype="string")
        engine = settings.DATABASES["default"].get("ENGINE", "")
        if "postgresql" in engine:
            with get_conn() as conn:
                df.to_sql(table_name, if_exists="append", index=False, con=conn)
        else:
            # SQLite ou autre : passe par la connexion Django (get_conn ne
            # supporte que PostgreSQL).
            _insert_via_django(table_name, df)
    except Exception as e:
        # Re-raise so the caller can decide whether to abort or tolerate the
        # failure. Previously this was swallowed, hiding duplicate-PK errors on
        # demo re-runs and leaving subsequent dependent inserts to cascade fail.
        self.stderr.write(
            self.style.ERROR(
                f"Unexpected error during insertion into table '{table_name}' => {e}"
            )
        )
        raise

    self.stdout.write(
        self.style.SUCCESS(f"Successfully inserted {csv_path} in {table_name} table")
    )
