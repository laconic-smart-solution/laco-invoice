import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime } from "@/util/format"
import type { Locale } from "@/app/i18n"
import { Printer, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Invoice } from "../types/invoice"

interface InvoiceTaxPreviewProps {
  invoice: Invoice
  onClose: () => void
}

export function InvoiceTaxPreview({ invoice, onClose }: InvoiceTaxPreviewProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language as Locale

  const handlePrint = () => {
    // Generate an isolated, perfectly formatted printable document
    const printFrame = document.createElement("iframe")
    printFrame.style.position = "fixed"
    printFrame.style.right = "0"
    printFrame.style.bottom = "0"
    printFrame.style.width = "0"
    printFrame.style.height = "0"
    printFrame.style.border = "none"
    document.body.appendChild(printFrame)

    const doc = printFrame.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title></title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0mm; /* Disables default browser header (date, title) & footer (url, page number) */
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #111827;
              background: #ffffff;
              font-size: 13px;
              line-height: 1.5;
              width: 100%;
              padding: 16mm 18mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #d1d5db;
              padding-bottom: 18px;
              margin-bottom: 24px;
            }
            .title-section h1 {
              font-size: 24px;
              font-weight: 800;
              letter-spacing: -0.5px;
              color: #111827;
            }
            .title-section .subtitle {
              font-size: 14px;
              font-weight: 600;
              color: #4b5563;
              margin-top: 2px;
            }
            .store-info {
              margin-top: 14px;
              font-size: 12.5px;
              color: #374151;
              line-height: 1.6;
            }
            .store-info .name {
              font-size: 14px;
              font-weight: 700;
              color: #111827;
            }
            .meta-box {
              border: 1px solid #d1d5db;
              background-color: #f9fafb !important;
              padding: 12px 18px;
              min-width: 270px;
              font-size: 12px;
              line-height: 1.8;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
            }
            .meta-label {
              color: #6b7280;
            }
            .meta-value {
              font-weight: 600;
              color: #111827;
              font-family: monospace;
            }
            .badge-batch {
              color: #dc2626;
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
              margin-bottom: 24px;
            }
            thead th {
              background-color: #f3f4f6 !important;
              color: #1f2937;
              font-weight: 700;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 10px 14px;
              border-top: 1px solid #d1d5db;
              border-bottom: 2px solid #9ca3af;
              text-align: left;
            }
            tbody td {
              padding: 14px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
              vertical-align: top;
            }
            .item-title {
              font-weight: 700;
              color: #111827;
              font-size: 13.5px;
            }
            .item-sub {
              font-size: 11.5px;
              color: #6b7280;
              margin-top: 3px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; }
            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 10px;
            }
            .totals-box {
              width: 360px;
              border-top: 1px solid #d1d5db;
              padding-top: 12px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 13px;
              color: #4b5563;
            }
            .totals-row .val {
              font-family: monospace;
              font-weight: 600;
              color: #111827;
            }
            .totals-row.vat {
              color: #dc2626;
              font-weight: 600;
            }
            .totals-row.vat .val {
              color: #dc2626;
              font-weight: 700;
            }
            .totals-row.grand {
              border-top: 2px solid #111827;
              margin-top: 8px;
              padding-top: 10px;
              font-size: 15px;
              font-weight: 800;
              color: #111827;
            }
            .totals-row.grand .val {
              font-size: 16px;
              color: #111827;
              font-weight: 800;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px dashed #d1d5db;
              padding-top: 14px;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="title-section">
              <h1>TAX INVOICE / RECEIPT</h1>
              <div class="subtitle">ใบกำกับภาษี / ใบเสร็จรับเงิน</div>
              <div class="store-info">
                <div class="name">${invoice.storeName}</div>
                <div>Tax ID / เลขประจำตัวผู้เสียภาษี: <span class="font-mono">0105558123456</span> (Head Office)</div>
                <div>Marketplace Channel: <strong>${invoice.marketplaceCode} Shop</strong></div>
              </div>
            </div>
            <div class="meta-box">
              <div class="meta-row">
                <span class="meta-label">Invoice No:</span>
                <span class="meta-value" style="color: #dc2626;">${invoice.invoiceNumber}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Date:</span>
                <span class="meta-value">${formatDateTime(invoice.issuedAt, locale)}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Period:</span>
                <span class="meta-value">${invoice.startDate} → ${invoice.endDate}</span>
              </div>
              ${invoice.orderRunTitle ? `
                <div class="meta-row">
                  <span class="meta-label">Batch:</span>
                  <span class="badge-batch">${invoice.orderRunTitle}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Description / รายการ</th>
                <th class="text-center" style="width: 90px;">Orders</th>
                <th class="text-center" style="width: 90px;">Items (Qty)</th>
                <th class="text-right" style="width: 160px;">Amount (THB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-mono" style="color: #6b7280;">1</td>
                <td>
                  <div class="item-title">Consolidated Marketplace Sales — ${invoice.title}</div>
                  <div class="item-sub">Orders period from ${invoice.startDate} to ${invoice.endDate} (${invoice.orderCount} orders processed)</div>
                </td>
                <td class="text-center font-mono" style="font-weight: 600;">${invoice.orderCount}</td>
                <td class="text-center font-mono" style="font-weight: 600;">${invoice.itemCount}</td>
                <td class="text-right font-mono" style="font-weight: 700; color: #111827;">${formatCurrency(invoice.subtotal, locale, invoice.currency)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-container">
            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal (Before VAT / มูลค่าสินค้าก่อนภาษี):</span>
                <span class="val">${formatCurrency(invoice.subtotal, locale, invoice.currency)}</span>
              </div>
              <div class="totals-row vat">
                <span>VAT 7% (ภาษีมูลค่าเพิ่ม 7%):</span>
                <span class="val">${formatCurrency(invoice.vatAmount, locale, invoice.currency)}</span>
              </div>
              <div class="totals-row grand">
                <span>Grand Total (ยอดรวมสุทธิทั้งสิ้น):</span>
                <span class="val">${formatCurrency(invoice.grandTotal, locale, invoice.currency)}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is a computer-generated tax invoice issued electronically via Laco Invoice.</p>
            <p>เอกสารนี้ออกโดยระบบคอมพิวเตอร์และได้รับการยกเว้นลายมือชื่อ</p>
          </div>
        </body>
      </html>
    `

    doc.open()
    doc.write(html)
    doc.close()

    setTimeout(() => {
      printFrame.contentWindow?.focus()
      printFrame.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(printFrame)
      }, 1000)
    }, 250)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-none border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-card">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-semibold text-foreground">
              Tax Invoice Preview / ใบกำกับภาษี
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              ({invoice.invoiceNumber})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="rounded-none bg-primary text-primary-foreground">
              <Printer className="size-4" />
              Print / Save PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="rounded-none"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Printable Sheet Viewport */}
        <div className="overflow-y-auto p-6 md:p-8 bg-neutral-900/40">
          <div
            className="mx-auto max-w-3xl rounded-none border border-neutral-300 bg-white p-8 md:p-10 text-neutral-900 shadow-xl"
          >
            {/* Header: Company Info + Invoice Metadata Box */}
            <div className="flex items-start justify-between border-b border-neutral-300 pb-6 gap-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  TAX INVOICE / RECEIPT
                </h1>
                <p className="text-sm font-semibold text-neutral-600">
                  ใบกำกับภาษี / ใบเสร็จรับเงิน
                </p>
                <div className="mt-4 text-xs text-neutral-700 space-y-1">
                  <p className="font-bold text-neutral-900 text-sm">{invoice.storeName}</p>
                  <p>
                    Tax ID / เลขประจำตัวผู้เสียภาษี: <span className="font-mono">0105558123456</span> (Head Office)
                  </p>
                  <p>Marketplace Channel: <span className="font-semibold">{invoice.marketplaceCode} Shop</span></p>
                </div>
              </div>

              <div className="text-right text-xs shrink-0">
                <div className="inline-block border border-neutral-300 bg-neutral-50 px-4 py-3 text-left space-y-1">
                  <p className="font-bold text-neutral-900">
                    Invoice No: <span className="font-mono text-primary font-bold">{invoice.invoiceNumber}</span>
                  </p>
                  <p className="text-neutral-700">
                    Date: <span className="font-medium text-neutral-900">{formatDateTime(invoice.issuedAt, locale)}</span>
                  </p>
                  <p className="text-neutral-700">
                    Period: <span className="font-mono text-neutral-900">{invoice.startDate} → {invoice.endDate}</span>
                  </p>
                  {invoice.orderRunTitle && (
                    <p className="text-primary font-semibold">
                      Batch: {invoice.orderRunTitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Line Items Table */}
            <div className="mt-6">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-y border-neutral-300 bg-neutral-100 font-bold text-neutral-800">
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">Description / รายการ</th>
                    <th className="py-2.5 px-3 text-center w-24">Orders</th>
                    <th className="py-2.5 px-3 text-center w-24">Items (Qty)</th>
                    <th className="py-2.5 px-3 text-right w-36">Amount (THB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr>
                    <td className="py-3 px-3 text-neutral-500 font-mono">1</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-neutral-900">
                        Consolidated Marketplace Sales — {invoice.title}
                      </p>
                      <p className="text-neutral-500 text-[11px] mt-0.5">
                        Orders period from {invoice.startDate} to {invoice.endDate} ({invoice.orderCount} orders processed)
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-neutral-800">
                      {invoice.orderCount}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-neutral-800">
                      {invoice.itemCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                      {formatCurrency(invoice.subtotal, locale, invoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals & 7% VAT Breakdown */}
            <div className="mt-8 flex justify-end">
              <div className="w-80 space-y-2 border-t border-neutral-300 pt-3 text-xs">
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal (Before VAT / มูลค่าสินค้าก่อนภาษี):</span>
                  <span className="font-mono font-semibold text-neutral-900">
                    {formatCurrency(invoice.subtotal, locale, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-primary">
                  <span>VAT 7% (ภาษีมูลค่าเพิ่ม 7%):</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(invoice.vatAmount, locale, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-300 pt-2.5 text-sm font-bold text-neutral-900">
                  <span>Grand Total (ยอดรวมสุทธิทั้งสิ้น):</span>
                  <span className="font-mono text-base font-extrabold text-primary">
                    {formatCurrency(invoice.grandTotal, locale, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Stamp & Sign Note */}
            <div className="mt-14 border-t border-dashed border-neutral-300 pt-4 text-center text-[10px] text-neutral-500 space-y-1">
              <p>This is a computer-generated tax invoice issued electronically via Laco Invoice.</p>
              <p>เอกสารนี้ออกโดยระบบคอมพิวเตอร์และได้รับการยกเว้นลายมือชื่อ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default InvoiceTaxPreview