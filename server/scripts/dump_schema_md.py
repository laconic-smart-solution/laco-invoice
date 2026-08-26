"""Dump LACO_INVOICE Oracle schema to markdown."""

from __future__ import annotations

from pathlib import Path

import oracledb

DSN = "113.53.62.172:1200/LACONIC"
USER = "LACO_INVOICE"
PASSWORD = "LACO_INVOICE"
OUT = Path(__file__).resolve().parents[2] / "docs" / "database-schema.md"


def fmt_type(data_type, length, precision, scale) -> str:
    dt = data_type
    if dt in ("VARCHAR2", "NVARCHAR2", "CHAR", "RAW"):
        return f"{dt}({length})"
    if dt == "NUMBER":
        if precision is None:
            return "NUMBER"
        if scale is None or scale == 0:
            return f"NUMBER({int(precision)})"
        return f"NUMBER({int(precision)},{int(scale)})"
    if dt == "FLOAT":
        return f"{dt}({int(precision)})" if precision else dt
    return dt


def main() -> None:
    conn = oracledb.connect(user=USER, password=PASSWORD, dsn=DSN)
    cur = conn.cursor()

    cur.execute("SELECT table_name FROM user_tables ORDER BY table_name")
    tables = [r[0] for r in cur.fetchall()]

    cur.execute(
        """
        SELECT table_name, column_id, column_name, data_type, data_length,
               data_precision, data_scale, nullable, data_default
        FROM user_tab_columns
        ORDER BY table_name, column_id
        """
    )
    cols: dict[str, list] = {}
    for r in cur.fetchall():
        cols.setdefault(r[0], []).append(r)

    cur.execute(
        """
        SELECT uc.table_name, uc.constraint_name, ucc.column_name, ucc.position
        FROM user_constraints uc
        JOIN user_cons_columns ucc ON uc.constraint_name = ucc.constraint_name
        WHERE uc.constraint_type = 'P'
        ORDER BY uc.table_name, ucc.position
        """
    )
    pks: dict[str, dict] = {}
    for t, cname, col, _pos in cur.fetchall():
        pks.setdefault(t, {"name": cname, "cols": []})["cols"].append(col)

    cur.execute(
        """
        SELECT uc.table_name, uc.constraint_name, ucc.column_name, ucc.position
        FROM user_constraints uc
        JOIN user_cons_columns ucc ON uc.constraint_name = ucc.constraint_name
        WHERE uc.constraint_type = 'U'
        ORDER BY uc.table_name, uc.constraint_name, ucc.position
        """
    )
    uniques: dict[str, dict[str, list[str]]] = {}
    for t, cname, col, _pos in cur.fetchall():
        uniques.setdefault(t, {}).setdefault(cname, []).append(col)

    cur.execute(
        """
        SELECT uc.table_name, uc.constraint_name, ucc.column_name, ucc.position,
               ruc.table_name AS r_table, rucc.column_name AS r_column
        FROM user_constraints uc
        JOIN user_cons_columns ucc
          ON uc.constraint_name = ucc.constraint_name AND uc.owner = ucc.owner
        JOIN user_constraints ruc
          ON uc.r_constraint_name = ruc.constraint_name AND uc.r_owner = ruc.owner
        JOIN user_cons_columns rucc
          ON ruc.constraint_name = rucc.constraint_name
         AND ruc.owner = rucc.owner
         AND ucc.position = rucc.position
        WHERE uc.constraint_type = 'R'
        ORDER BY uc.table_name, uc.constraint_name, ucc.position
        """
    )
    fks: dict[str, dict] = {}
    for t, cname, col, _pos, rt, rc in cur.fetchall():
        entry = fks.setdefault(t, {}).setdefault(
            cname, {"cols": [], "ref_table": rt, "ref_cols": []}
        )
        entry["cols"].append(col)
        entry["ref_cols"].append(rc)

    cur.execute(
        """
        SELECT i.table_name, i.index_name, i.uniqueness, ic.column_name, ic.column_position
        FROM user_indexes i
        JOIN user_ind_columns ic ON i.index_name = ic.index_name
        ORDER BY i.table_name, i.index_name, ic.column_position
        """
    )
    indexes: dict[str, dict] = {}
    for t, iname, uniq, col, _pos in cur.fetchall():
        indexes.setdefault(t, {}).setdefault(iname, {"unique": uniq, "cols": []})[
            "cols"
        ].append(col)

    cur.execute(
        "SELECT table_name, comments FROM user_tab_comments WHERE comments IS NOT NULL"
    )
    tab_comments = {r[0]: r[1] for r in cur.fetchall()}
    cur.execute(
        """
        SELECT table_name, column_name, comments
        FROM user_col_comments
        WHERE comments IS NOT NULL
        """
    )
    col_comments: dict[str, dict[str, str]] = {}
    for t, c, cm in cur.fetchall():
        col_comments.setdefault(t, {})[c] = cm

    lines: list[str] = []
    lines.append("# LACO_INVOICE Database Schema")
    lines.append("")
    lines.append("Generated from the live Oracle database (`application-dev.yml` defaults).")
    lines.append("")
    lines.append("| Property | Value |")
    lines.append("|----------|-------|")
    lines.append("| Host | `113.53.62.172:1200` |")
    lines.append("| Service | `LACONIC` |")
    lines.append("| Schema | `LACO_INVOICE` |")
    lines.append(f"| Tables | {len(tables)} |")
    lines.append("")
    lines.append("## Table index")
    lines.append("")
    for i, t in enumerate(tables, 1):
        anchor = t.lower().replace("_", "-")
        lines.append(f"{i}. [{t}](#{anchor})")
    lines.append("")

    for t in tables:
        lines.append(f"## {t}")
        lines.append("")
        if t in tab_comments:
            lines.append(tab_comments[t])
            lines.append("")
        lines.append(
            "| # | Column | Type | Nullable | Default | PK | Comment |"
        )
        lines.append("|---|--------|------|----------|---------|----|---------|")
        pk_cols = set(pks.get(t, {}).get("cols", []))
        for r in cols.get(t, []):
            _tn, col_id, name, dtype, length, prec, scale, nullable, default = r
            typ = fmt_type(dtype, length, prec, scale)
            null = "YES" if nullable == "Y" else "NO"
            dflt = ""
            if default is not None:
                dflt = str(default).strip().replace("\n", " ")
                if len(dflt) > 40:
                    dflt = dflt[:37] + "..."
                dflt = f"`{dflt}`"
            pk = "Y" if name in pk_cols else ""
            cm = col_comments.get(t, {}).get(name, "") or ""
            lines.append(
                f"| {int(col_id)} | `{name}` | `{typ}` | {null} | {dflt} | {pk} | {cm} |"
            )
        lines.append("")

        if t in pks:
            lines.append(
                f"- **Primary key:** `{pks[t]['name']}` (`{', '.join(pks[t]['cols'])}`)"
            )
        if t in uniques:
            for cname, ucols in uniques[t].items():
                lines.append(f"- **Unique:** `{cname}` (`{', '.join(ucols)}`)")
        if t in fks:
            for cname, fk in fks[t].items():
                lines.append(
                    f"- **Foreign key:** `{cname}` (`{', '.join(fk['cols'])}`) → "
                    f"`{fk['ref_table']}({', '.join(fk['ref_cols'])})`"
                )
        if t in indexes:
            lines.append("")
            lines.append("### Indexes")
            lines.append("")
            lines.append("| Index | Unique | Columns |")
            lines.append("|-------|--------|---------|")
            for iname, meta in indexes[t].items():
                lines.append(
                    f"| `{iname}` | {meta['unique']} | `{', '.join(meta['cols'])}` |"
                )
        lines.append("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes, {len(tables)} tables)")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
