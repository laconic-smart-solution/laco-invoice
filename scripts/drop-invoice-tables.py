"""Drop invoice-related tables from dev Oracle DB."""
import sys

import oracledb

DSN = "113.53.62.172:1200/LACONIC"
USER = "LACO_INVOICE_DB"
PASSWORD = "LACO_INVOICE_DB"

# Tables to drop (child tables first where applicable)
TABLES_TO_DROP = [
    "INVOICES",
    "ORDER_BULK_GENERATE_RUNS",
    "ORDER_TAX_INVOICES",
]


def main() -> int:
    conn = oracledb.connect(user=USER, password=PASSWORD, dsn=DSN)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT table_name FROM user_tables
        WHERE UPPER(table_name) LIKE '%INVOICE%'
           OR UPPER(table_name) LIKE '%BULK%GENERATE%'
        ORDER BY table_name
        """
    )
    existing = {row[0].upper() for row in cur.fetchall()}
    print("Found invoice-related tables:", sorted(existing))

    dropped: list[str] = []
    skipped: list[str] = []

    for table in TABLES_TO_DROP:
        if table not in existing:
            skipped.append(table)
            continue
        print(f"Dropping {table} ...")
        cur.execute(f"DROP TABLE {table} CASCADE CONSTRAINTS PURGE")
        dropped.append(table)

    conn.commit()

    cur.execute(
        """
        SELECT table_name FROM user_tables
        WHERE UPPER(table_name) LIKE '%INVOICE%'
           OR UPPER(table_name) LIKE '%BULK%GENERATE%'
        ORDER BY table_name
        """
    )
    remaining = [row[0] for row in cur.fetchall()]

    print("\nDropped:", dropped or "(none)")
    print("Skipped (not found):", skipped or "(none)")
    print("Remaining invoice-related tables:", remaining or "(none)")

    cur.close()
    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
