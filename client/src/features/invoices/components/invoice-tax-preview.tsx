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
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col rounded-lg border border-border bg-background shadow-2xl print:max-h-none print:border-none print:shadow-none">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between border-b border-border p-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-semibold">
              Tax Invoice Preview / ใบกำกับภาษี
            </span>
            <span className="text-xs text-muted-foreground">({invoice.invoiceNumber})</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint}>
              <Printer className="size-4" />
              Print / Save PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="overflow-y-auto p-8 text-foreground print:p-0">
          <div className="rounded-md border border-neutral-300 bg-white p-8 text-neutral-900 shadow-sm print:border-none print:p-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-300 pb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  TAX INVOICE / RECEIPT
                </h1>
                <p className="text-sm font-semibold text-neutral-600">
                  ใบกำกับภาษี / ใบเสร็จรับเงิน
                </p>
                <div className="mt-4 text-xs text-neutral-600">
                  <p className="font-bold text-neutral-900">{invoice.storeName}</p>
                  <p>Tax ID / เลขประจำตัวผู้เสียภาษี: 0105558123456 (Head Office)</p>
                  <p>Marketplace: {invoice.marketplaceCode} Shop</p>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="inline-block rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  <p className="font-semibold">Invoice No: <span className="font-mono text-neutral-900">{invoice.invoiceNumber}</span></p>
                  <p>Date: {formatDateTime(invoice.issuedAt, locale)}</p>
                  <p>Period: {invoice.startDate} — {invoice.endDate}</p>
                  {invoice.orderRunTitle && (
                    <p className="text-primary font-medium">Batch: {invoice.orderRunTitle}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="mt-6 rounded border border-neutral-200 bg-neutral-50 p-4 text-xs">
              <p className="font-bold uppercase text-neutral-700">Customer / Buyer Details (ลูกค้า):</p>
              <p className="mt-1 font-semibold text-sm text-neutral-900">{invoice.buyerName || "—"}</p>
              <p className="text-neutral-600">Tax ID / เลขประจำตัวผู้เสียภาษี: {invoice.buyerTaxId || "N/A"}</p>
              {invoice.buyerAddress && (
                <p className="text-neutral-600">Address: {invoice.buyerAddress}</p>
              )}
            </div>

            {/* Summary Aggregation Table */}
            <div className="mt-6">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-300 bg-neutral-100 font-semibold text-neutral-700">
                    <th className="p-2">#</th>
                    <th className="p-2">Description / รายการ</th>
                    <th className="p-2 text-center">Orders</th>
                    <th className="p-2 text-center">Items (Qty)</th>
                    <th className="p-2 text-right">Amount (THB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr>
                    <td className="p-2">1</td>
                    <td className="p-2">
                      <p className="font-semibold text-neutral-900">
                        Consolidated Marketplace Sales — {invoice.title}
                      </p>
                      <p className="text-neutral-500">
                        Orders period from {invoice.startDate} to {invoice.endDate} ({invoice.orderCount} orders processed)
                      </p>
                    </td>
                    <td className="p-2 text-center font-mono">{invoice.orderCount}</td>
                    <td className="p-2 text-center font-mono">{invoice.itemCount}</td>
                    <td className="p-2 text-right font-mono font-medium">
                      {formatCurrency(invoice.subtotal, locale, invoice.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals & VAT Breakdown */}
            <div className="mt-6 flex justify-end">
              <div className="w-72 space-y-1.5 border-t border-neutral-300 pt-3 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal (Before VAT / มูลค่าสินค้า):</span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(invoice.subtotal, locale, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between font-medium text-primary">
                  <span>VAT 7% (ภาษีมูลค่าเพิ่ม 7%):</span>
                  <span className="font-mono">
                    {formatCurrency(invoice.vatAmount, locale, invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-neutral-300 pt-2 text-sm font-bold text-neutral-900">
                  <span>Grand Total (จำนวนเงินรวมทั้งสิ้น):</span>
                  <span className="font-mono text-base text-primary">
                    {formatCurrency(invoice.grandTotal, locale, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 border-t border-dashed border-neutral-300 pt-4 text-center text-[10px] text-neutral-500">
              <p>This is a computer-generated tax invoice issued electronically via Laco Invoice.</p>
              <p className="mt-1">ใบกำกับภาษีนี้ออกโดยระบบอัตโนมัติ ถูกต้องตามประมวลรัษฎากร</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
