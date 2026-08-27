import { useTranslation } from "react-i18next"
import {
  CheckCircle2,
  CreditCard,
  Layers,
  Printer,
  Receipt,
  Store,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/util/format"
import type { Locale } from "@/app/i18n"
import type { PaymentVoucher } from "../types/voucher"

interface VoucherDetailDialogProps {
  voucher: PaymentVoucher | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoucherDetailDialog({
  voucher,
  open,
  onOpenChange,
}: VoucherDetailDialogProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language as Locale

  if (!voucher) return null

  const handlePrint = () => {
    // Generate an isolated, perfectly formatted printable document via hidden iframe
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

    const allocationsHtml = (voucher.allocations || [])
      .map(
        (alloc, idx) => `
        <tr>
          <td style="text-align: center; color: #6b7280; font-family: sans-serif;">${idx + 1}</td>
          <td style="font-weight: 700; font-family: monospace;">${alloc.externalOrderId}</td>
          <td style="color: #4b5563; font-family: monospace;">${alloc.invoiceNumber || "-"}</td>
          <td style="text-align: right; font-family: monospace;">${formatCurrency(alloc.orderTotalAmount, locale, "THB")}</td>
          <td style="text-align: right; color: #6b7280; font-family: monospace;">${formatCurrency(alloc.previousPaidAmount, locale, "THB")}</td>
          <td style="text-align: right; font-weight: 700; color: #dc2626; font-family: monospace;">${formatCurrency(alloc.allocatedAmount, locale, "THB")}</td>
          <td style="text-align: right; font-weight: 600; font-family: monospace;">${formatCurrency(alloc.remainingBalance, locale, "THB")}</td>
        </tr>
      `
      )
      .join("")

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Payment Voucher - ${voucher.voucherNumber}</title>
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
              font-size: 12.5px;
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
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .title-section h1 {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: -0.5px;
              color: #111827;
            }
            .title-section .subtitle {
              font-size: 13px;
              font-weight: 600;
              color: #4b5563;
              margin-top: 2px;
            }
            .store-info {
              margin-top: 12px;
              font-size: 12px;
              color: #374151;
              line-height: 1.6;
            }
            .store-info .name {
              font-size: 13.5px;
              font-weight: 700;
              color: #111827;
            }
            .meta-box {
              border: 1px solid #d1d5db;
              background-color: #f9fafb !important;
              padding: 12px 16px;
              min-width: 260px;
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
              font-weight: 700;
              color: #111827;
              font-family: monospace;
            }
            .section-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 20px;
            }
            .card {
              border: 1px solid #e5e7eb;
              padding: 12px 14px;
              background-color: #f9fafb !important;
            }
            .card-title {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #374151;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 6px;
              margin-bottom: 8px;
            }
            .stat-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 12px;
              margin-bottom: 20px;
            }
            .stat-box {
              border: 1px solid #d1d5db;
              padding: 10px 12px;
              background-color: #ffffff;
            }
            .stat-label {
              font-size: 10.5px;
              font-weight: 600;
              text-transform: uppercase;
              color: #6b7280;
            }
            .stat-value {
              font-size: 16px;
              font-weight: 800;
              font-family: monospace;
              color: #111827;
              margin-top: 4px;
            }
            .stat-value.primary {
              color: #dc2626;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
              margin-bottom: 24px;
            }
            thead th {
              background-color: #f3f4f6 !important;
              color: #1f2937;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 9px 12px;
              border-top: 1px solid #d1d5db;
              border-bottom: 2px solid #9ca3af;
              text-align: left;
            }
            tbody td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 11.5px;
              vertical-align: middle;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px dashed #d1d5db;
            }
            .sign-box {
              text-align: center;
            }
            .sign-line {
              border-bottom: 1px solid #9ca3af;
              height: 45px;
              margin-bottom: 8px;
            }
            .sign-title {
              font-size: 11.5px;
              font-weight: 600;
              color: #374151;
            }
            .sign-date {
              font-size: 10.5px;
              color: #6b7280;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="title-section">
              <h1>PAYMENT RECEIPT VOUCHER</h1>
              <div class="subtitle">ใบสำคัญรับเงิน / บันทึกการรับชำระเงิน</div>
              <div class="store-info">
                <div class="name">${voucher.storeName}</div>
                <div>Official Marketplace Store Settlement</div>
              </div>
            </div>
            <div class="meta-box">
              <div class="meta-row">
                <span class="meta-label">Voucher No:</span>
                <span class="meta-value">${voucher.voucherNumber}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Payment Date:</span>
                <span class="meta-value">${voucher.date}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Payment Method:</span>
                <span class="meta-value">${voucher.paymentMethod}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Status:</span>
                <span class="meta-value" style="color: #16a34a;">${voucher.status}</span>
              </div>
            </div>
          </div>

          <div class="section-grid">
            <div class="card">
              <div class="card-title">Payer / Customer Information</div>
              <p><strong>Customer:</strong> ${voucher.customerName}</p>
              ${voucher.customerTaxId ? `<p><strong>Tax ID:</strong> ${voucher.customerTaxId}</p>` : ""}
              ${voucher.notes ? `<p style="margin-top: 4px;"><strong>Notes:</strong> ${voucher.notes}</p>` : ""}
            </div>
            <div class="card">
              <div class="card-title">Transaction Reference</div>
              <p><strong>Bank Slip / Ref:</strong> ${voucher.bankReference || "-"}</p>
              <p><strong>Recorded Date:</strong> ${voucher.date}</p>
              <p><strong>Total Orders Paid:</strong> ${(voucher.allocations || []).length} Order Lines</p>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-label">Total Received Amount</div>
              <div class="stat-value">${formatCurrency(voucher.totalAmount, locale, "THB")}</div>
            </div>
            <div class="stat-box" style="background-color: #fef2f2 !important; border-color: #fca5a5;">
              <div class="stat-label" style="color: #dc2626;">Allocated to Orders</div>
              <div class="stat-value primary">${formatCurrency(voucher.allocatedAmount, locale, "THB")}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Unallocated Credit Balance</div>
              <div class="stat-value">${formatCurrency(voucher.unallocatedAmount, locale, "THB")}</div>
            </div>
          </div>

          <div>
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #111827;">
              Allocated Order Lines Summary (${(voucher.allocations || []).length} Orders)
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;">#</th>
                  <th>Order ID</th>
                  <th>Invoice No.</th>
                  <th style="text-align: right;">Order Total</th>
                  <th style="text-align: right;">Prev. Paid</th>
                  <th style="text-align: right; color: #dc2626;">Allocated This Voucher</th>
                  <th style="text-align: right;">Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                ${allocationsHtml}
              </tbody>
            </table>
          </div>

          <div class="signatures">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-title">Received By / ผู้รับเงิน</div>
              <div class="sign-date">Date: ____ / ____ / ________</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div class="sign-title">Authorized Signature / ผู้มีอำนาจลงนาม</div>
              <div class="sign-date">Date: ____ / ____ / ________</div>
            </div>
          </div>
        </body>
      </html>
    `

    doc.open()
    doc.write(html)
    doc.close()

    // Wait for content and styles to parse, then trigger print
    setTimeout(() => {
      printFrame.contentWindow?.focus()
      printFrame.contentWindow?.print()

      // Cleanup iframe after printing
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame)
        }
      }, 1000)
    }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl w-full p-0 gap-0 border-border bg-card shadow-2xl rounded-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-none bg-primary/10 text-primary border border-primary/20">
              <Receipt className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base font-bold text-foreground">
                Payment Voucher: {voucher.voucherNumber}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                ใบสำคัญรับเงิน / บันทึกการรับชำระเงิน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-7">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs rounded-none gap-1.5 border-primary text-primary hover:bg-primary/10"
            >
              <Printer className="size-3.5" />
              Print Receipt
            </Button>
          </div>
        </div>

        {/* Voucher Body Details */}
        <div className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Store & Settlement Info */}
            <div className="border border-border p-4 bg-muted/10 space-y-2 rounded-none">
              <h4 className="font-heading text-xs font-bold text-foreground flex items-center gap-1.5">
                <Store className="size-3.5 text-primary" />
                Store & Payer Information
              </h4>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Store:</strong> {voucher.storeName}
                </p>
                <p>
                  <strong className="text-foreground">Customer / Payer:</strong>{" "}
                  {voucher.customerName}
                </p>
                {voucher.customerTaxId && (
                  <p>
                    <strong className="text-foreground">Tax ID:</strong> {voucher.customerTaxId}
                  </p>
                )}
                {voucher.notes && (
                  <p>
                    <strong className="text-foreground">Notes:</strong> {voucher.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Bank Reference */}
            <div className="border border-border p-4 bg-muted/10 space-y-2 rounded-none">
              <h4 className="font-heading text-xs font-bold text-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-primary" />
                Payment Transaction Details
              </h4>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Payment Date:</strong> {voucher.date}
                </p>
                <p>
                  <strong className="text-foreground">Method:</strong> {voucher.paymentMethod}
                </p>
                <p>
                  <strong className="text-foreground">Bank Ref / Slip:</strong>{" "}
                  {voucher.bankReference || "-"}
                </p>
                <p>
                  <strong className="text-foreground">Status:</strong>{" "}
                  <span className="inline-flex items-center gap-1 font-semibold text-success">
                    <CheckCircle2 className="size-3" /> {voucher.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Amount Stats */}
          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="border border-border p-3 bg-card rounded-none">
              <span className="text-[10px] uppercase text-muted-foreground block font-sans">
                Total Received Amount
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(voucher.totalAmount, locale, "THB")}
              </span>
            </div>
            <div className="border border-border p-3 bg-primary/5 rounded-none">
              <span className="text-[10px] uppercase text-primary font-semibold block font-sans">
                Allocated to Orders
              </span>
              <span className="text-base font-bold text-primary">
                {formatCurrency(voucher.allocatedAmount, locale, "THB")}
              </span>
            </div>
            <div className="border border-border p-3 bg-card rounded-none">
              <span className="text-[10px] uppercase text-muted-foreground block font-sans">
                Unallocated Credit Balance
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(voucher.unallocatedAmount, locale, "THB")}
              </span>
            </div>
          </div>

          {/* Allocations Table */}
          <div className="space-y-2">
            <h4 className="font-heading text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              Allocated Order Lines ({voucher.allocations?.length || 0})
            </h4>

            <div className="overflow-x-auto border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted font-medium text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">ORDER ID</th>
                    <th className="px-3 py-2">INVOICE NO.</th>
                    <th className="px-3 py-2 text-right">ORDER TOTAL</th>
                    <th className="px-3 py-2 text-right">PREV. PAID</th>
                    <th className="px-3 py-2 text-right font-bold text-primary">
                      ALLOCATED THIS VOUCHER
                    </th>
                    <th className="px-3 py-2 text-right">REMAINING BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {(voucher.allocations || []).map((alloc, idx) => (
                    <tr key={alloc.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground font-sans">{idx + 1}</td>
                      <td className="px-3 py-2 font-bold text-foreground">
                        {alloc.externalOrderId}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {alloc.invoiceNumber || "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(alloc.orderTotalAmount, locale, "THB")}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {formatCurrency(alloc.previousPaidAmount, locale, "THB")}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-primary">
                        {formatCurrency(alloc.allocatedAmount, locale, "THB")}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-foreground">
                        {formatCurrency(alloc.remainingBalance, locale, "THB")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
