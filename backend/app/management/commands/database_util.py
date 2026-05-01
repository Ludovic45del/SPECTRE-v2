from pathlib import Path

import pandas as pd
from django.conf import settings
from sqlalchemy import create_engine
from sqlalchemy.engine import URL


def get_conn():
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


def insert_csv_into_table(self, table_name, csv_path):
    try:
        # Use Path for cross-platform path handling
        df = pd.read_csv(Path(csv_path), dtype="string")
        with get_conn() as connection:
            df.to_sql(table_name, if_exists="append", index=False, con=connection)
    except Exception as e:
        # Re-raise so the caller can decide whether to abort or tolerate the
        # failure. Previously this was swallowed, hiding duplicate-PK errors on
        # demo re-runs and leaving subsequent dependent inserts to cascade fail.
        self.stderr.write(self.style.ERROR(f"Unexpected error during insertion into table '{table_name}' => {e}"))
        raise

    self.stdout.write(self.style.SUCCESS(f"Successfully inserted {csv_path} in {table_name} table"))
