"""Generate 10 realistic logistics invoice PDFs + matching OrderSKUList Excel files."""

from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path

from openpyxl import Workbook

OUT_DIR = Path(__file__).resolve().parent / "fixtures" / "invoice-match"

HEADERS = [
    "Order ID",
    "Order Status",
    "Order Substatus",
    "Cancelation/Return Type",
    "Normal or Pre-order",
    "SKU ID",
    "Seller SKU",
    "Product Name",
    "Variation",
    "Quantity",
    "Sku Quantity of return",
    "SKU Unit Original Price",
    "SKU Subtotal Before Discount",
    "SKU Platform Discount",
    "SKU Seller Discount",
    "SKU Subtotal After Discount",
    "Shipping Fee After Discount",
    "Original Shipping Fee",
    "Shipping Fee Seller Discount",
    "Shipping Fee Platform Discount",
    "Payment platform discount",
    "Taxes",
    "Order Amount",
    "Order Refund Amount",
    "Created Time",
    "Paid Time",
    "RTS Time",
    "Shipped Time",
    "Delivered Time",
    "Cancelled Time",
    "Cancel By",
    "Cancel Reason",
    "Fulfillment Type",
    "Warehouse Name",
    "Tracking ID",
    "Delivery Option",
    "Shipping Provider Name",
    "Buyer Message",
    "Buyer Username",
    "Recipient",
    "Phone #",
    "Zipcode",
    "Country",
    "Province",
    "District",
    "Districts",
    "Detail Address",
    "Additional address information",
    "Payment Method",
    "Weight(kg)",
    "Product Category",
    "Package ID",
    "Seller Note",
    "Checked Status",
    "Checked Marked by",
    "Request Tax Invoice",
    "Tax Info - Buyer Tax ID",
    "Tax Info - Type",
    "Tax Info - Full Name of Buyer",
    "Tax Info - Email",
    "Tax Info - Phone Number",
    "Tax Info - Registered Address",
    "Tax Info - Address Type",
]

CASES = [
    {
        "id": "01",
        "expect": "MATCHED",
        "receipt": "THJV202610002306645",
        "date": "May 26, 2026",
        "period": "May 20, 2026 - May 26, 2026",
        "buyer": "Lian Feng Co., Ltd.",
        "buyer_tax": "0115565023667",
        "pdf_total": Decimal("1918.00"),
        "fees": [Decimal("800.00"), Decimal("700.00"), Decimal("418.00")],
    },
    {
        "id": "02",
        "expect": "MATCHED",
        "receipt": "THJV202610002401102",
        "date": "May 12, 2026",
        "period": "May 6, 2026 - May 12, 2026",
        "buyer": "Siam Harvest Co., Ltd.",
        "buyer_tax": "0105558123401",
        "pdf_total": Decimal("2450.50"),
        "fees": [Decimal("1200.25"), Decimal("1250.25")],
    },
    {
        "id": "03",
        "expect": "MATCHED",
        "receipt": "THJV202610002512883",
        "date": "June 3, 2026",
        "period": "May 28, 2026 - June 3, 2026",
        "buyer": "Bangkok Fresh Ltd.",
        "buyer_tax": "0105561998877",
        "pdf_total": Decimal("980.00"),
        "fees": [Decimal("320.00"), Decimal("330.00"), Decimal("330.00")],
    },
    {
        "id": "04",
        "expect": "MATCHED",
        "receipt": "THJV202610002623441",
        "date": "June 17, 2026",
        "period": "June 11, 2026 - June 17, 2026",
        "buyer": "Chao Phraya Trading Co., Ltd.",
        "buyer_tax": "0105544332211",
        "pdf_total": Decimal("5120.75"),
        "fees": [Decimal("2100.25"), Decimal("1500.25"), Decimal("1520.25")],
    },
    {
        "id": "05",
        "expect": "MATCHED",
        "receipt": "THJV202610002734009",
        "date": "July 1, 2026",
        "period": "June 25, 2026 - July 1, 2026",
        "buyer": "Lotus Mart Co., Ltd.",
        "buyer_tax": "0105556677889",
        "pdf_total": Decimal("3600.00"),
        "fees": [Decimal("900.00"), Decimal("900.00"), Decimal("900.00"), Decimal("900.00")],
    },
    {
        "id": "06",
        "expect": "MATCHED",
        "receipt": "THJV202610002845770",
        "date": "July 15, 2026",
        "period": "July 9, 2026 - July 15, 2026",
        "buyer": "Northern Pack Ltd.",
        "buyer_tax": "0505551234567",
        "pdf_total": Decimal("12345.00"),
        "fees": [Decimal("5000.00"), Decimal("4000.00"), Decimal("3345.00")],
    },
    {
        "id": "07",
        "expect": "MATCHED",
        "receipt": "THJV202610002956218",
        "date": "July 29, 2026",
        "period": "July 23, 2026 - July 29, 2026",
        "buyer": "Mini Shop Co., Ltd.",
        "buyer_tax": "0105567001122",
        "pdf_total": Decimal("75.25"),
        "fees": [Decimal("40.00"), Decimal("35.25")],
    },
    {
        "id": "08",
        "expect": "MISMATCH",
        "receipt": "THJV202610003067331",
        "date": "August 5, 2026",
        "period": "July 30, 2026 - August 5, 2026",
        "buyer": "East Coast Logistics Co., Ltd.",
        "buyer_tax": "0105568889900",
        "pdf_total": Decimal("2000.00"),
        "fees": [Decimal("900.00"), Decimal("900.00")],  # excel 1800
    },
    {
        "id": "09",
        "expect": "MISMATCH",
        "receipt": "THJV202610003178442",
        "date": "August 12, 2026",
        "period": "August 6, 2026 - August 12, 2026",
        "buyer": "Central Retail Co., Ltd.",
        "buyer_tax": "0105533344455",
        "pdf_total": Decimal("4500.00"),
        "fees": [Decimal("2000.00"), Decimal("2100.00")],  # excel 4100
    },
    {
        "id": "10",
        "expect": "MISMATCH",
        "receipt": "THJV202610003289553",
        "date": "August 19, 2026",
        "period": "August 13, 2026 - August 19, 2026",
        "buyer": "Phuket Island Co., Ltd.",
        "buyer_tax": "0835556677889",
        "pdf_total": Decimal("1250.00"),
        "fees": [Decimal("500.00"), Decimal("499.00")],  # excel 999
    },
]


def money(value: Decimal) -> str:
    return f"{value:,.2f}"


def pdf_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_pdf(lines: list[str]) -> bytes:
    content_lines = ["BT", "/F1 11 Tf", "50 800 Td"]
    for index, line in enumerate(lines):
        if index > 0:
            content_lines.append("0 -16 Td")
        content_lines.append(f"({pdf_escape(line)}) Tj")
    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    parts = [b"%PDF-1.4\n"]
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(sum(len(p) for p in parts))
        parts.append(f"{i} 0 obj\n".encode("ascii") + obj + b"\nendobj\n")
    xref_pos = sum(len(p) for p in parts)
    xref = [b"xref\n0 6\n0000000000 65535 f \n"]
    for off in offsets[1:]:
        xref.append(f"{off:010d} 00000 n \n".encode("ascii"))
    trailer = (
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n"
        + str(xref_pos).encode("ascii")
        + b"\n%%EOF\n"
    )
    return b"".join(parts + xref + [trailer])


def receipt_lines(case: dict) -> list[str]:
    total = money(case["pdf_total"])
    wht = money((case["pdf_total"] * Decimal("0.01")).quantize(Decimal("0.01")))
    return [
        "Thai Happy Logistics Ltd. (Head Office)",
        "No. 1 Park Silom Tower, 8th Floor, Convent Road, Silom, Bangrak, Bangkok",
        "Tax Registration Number: 0105566107906",
        "",
        "Receipt",
        f"Receipt number: {case['receipt']}",
        f"Receipt date: {case['date']}",
        f"Period: {case['period']}",
        "",
        f"{case['buyer']} (Head Office)",
        "662/38 Sukhumvit 50, Khlong Toei, Bangkok 10260",
        f"Tax ID: {case['buyer_tax']}",
        "",
        "Description                         Amount in THB",
        f"Logistics fee                       {total}",
        f"Total Amount: {total}",
        "",
        f"For corporate sellers, the company has withheld tax at a rate of 1%, amounting to {wht}.",
    ]


def excel_row(order_id: str, fee: Decimal, product: str, created: str) -> list[object]:
    return [
        order_id,
        "Delivered",
        "Delivered",
        "",
        "Normal",
        order_id + "8",
        "SKU-" + order_id[-4:],
        product,
        "Default",
        1,
        0,
        199.00,
        199.00,
        0,
        0,
        199.00,
        float(fee),
        float(fee),
        0,
        0,
        0,
        0,
        float(Decimal("199.00") + fee),
        0,
        created,
        created,
        created,
        created,
        created,
        "",
        "",
        "",
        "Fulfillment by seller",
        "Bangkok WH",
        "TH" + order_id[-10:],
        "Standard",
        "Thai Happy Logistics",
        "",
        "buyer_" + order_id[-6:],
        "Recipient",
        "0812345678",
        "10260",
        "TH",
        "Bangkok",
        "Khlong Toei",
        "Phra Khanong",
        "Sukhumvit 50",
        "",
        "Credit Card",
        0.5,
        "Home & Living",
        "PKG" + order_id[-8:],
        "",
        "Checked",
        "seller",
        "Yes",
        "0115565023667",
        "Company",
        "Lian Feng Co., Ltd.",
        "buyer@example.com",
        "0812345678",
        "Bangkok",
        "Registered",
    ]


def write_excel(path: Path, fees: list[Decimal], case_id: str, created: str) -> Decimal:
    wb = Workbook()
    ws = wb.active
    ws.title = "OrderSKUList"
    ws.append(HEADERS)
    total = Decimal("0.00")
    products = [
        "KINBATA Oxygen Bleach 1100g",
        "Cotton Tote Bag",
        "Ceramic Mug 350ml",
        "Phone Case Clear",
    ]
    for index, fee in enumerate(fees, start=1):
        order_id = f"5770{case_id}{index:08d}"
        ws.append(excel_row(order_id, fee, products[(index - 1) % len(products)], created))
        total += fee
    wb.save(path)
    return total


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    for case in CASES:
        pdf_path = OUT_DIR / f"invoice-{case['id']}-{case['receipt']}.pdf"
        xlsx_path = OUT_DIR / f"shipping-{case['id']}-{case['receipt']}.xlsx"
        pdf_path.write_bytes(build_pdf(receipt_lines(case)))
        excel_total = write_excel(xlsx_path, case["fees"], case["id"], "15/05/2026 10:00:00")
        manifest.append(
            {
                "id": case["id"],
                "expect": case["expect"],
                "receipt": case["receipt"],
                "pdfTotal": str(case["pdf_total"]),
                "excelTotal": str(excel_total),
                "pdf": str(pdf_path.name),
                "excel": str(xlsx_path.name),
                "title": f"E2E {case['id']} {case['receipt']} {case['expect']}",
            }
        )
        print(
            f"{case['id']} {case['expect']:9} PDF {money(case['pdf_total']):>10}  "
            f"Excel {money(excel_total):>10}  {pdf_path.name}"
        )
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Wrote {len(manifest)} pairs to {OUT_DIR}")


if __name__ == "__main__":
    main()
