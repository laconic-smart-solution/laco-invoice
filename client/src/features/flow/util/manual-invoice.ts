import type { Invoice } from "@/features/invoices/types/invoice"
import type { Voucher } from "@/features/vouchers/types/voucher"
import type {
  ManualInvoiceQueueFilter,
  ManualInvoiceStage,
} from "@/features/flow/data/flow-constants"

export function money(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export function calculateManualInvoiceTotals(
  lines: Array<{ quantity: number; unitPrice: number; discount: number }>,
  vatRate: number
) {
  const subtotal = money(
    lines.reduce(
      (sum, line) =>
        sum +
        Math.max(0, Number(line.quantity || 0) * Number(line.unitPrice || 0) - Number(line.discount || 0)),
      0
    )
  )
  const vatAmount = money(subtotal * Number(vatRate || 0))
  return {
    subtotal,
    vatAmount,
    grandTotal: money(subtotal + vatAmount),
  }
}

export function isManualInvoiceReadyToIssue(invoice: Pick<Invoice, "status" | "grandTotal">) {
  return invoice.status === "DRAFT" && Number(invoice.grandTotal) > 0
}

export function matchesManualInvoiceFilter(
  invoice: Pick<Invoice, "id" | "status" | "grandTotal">,
  filter: ManualInvoiceQueueFilter,
  voucherInvoiceIds: Set<number>
) {
  const hasVoucher = voucherInvoiceIds.has(invoice.id)
  switch (filter) {
    case "draft":
      return invoice.status === "DRAFT"
    case "ready":
      return isManualInvoiceReadyToIssue(invoice)
    case "issued":
      return invoice.status === "ISSUED"
    case "has_voucher":
      return hasVoucher
    default:
      return true
  }
}

export function deriveManualInvoiceStage(
  invoice: Pick<Invoice, "status"> | null,
  vouchers: Pick<Voucher, "id">[]
): ManualInvoiceStage {
  if (!invoice) return "draft"
  if (vouchers.length > 0) return "export"
  if (invoice.status !== "DRAFT") return "voucher"
  return "draft"
}

export function manualInvoiceBlockers(
  invoice: Pick<Invoice, "status" | "grandTotal"> | null,
  vouchers: Pick<Voucher, "id">[],
  stage: ManualInvoiceStage
): Array<"save_draft" | "issue" | "generate_voucher"> {
  const blockers: Array<"save_draft" | "issue" | "generate_voucher"> = []
  if (stage !== "draft" && !invoice) blockers.push("save_draft")
  if ((stage === "voucher" || stage === "export") && invoice?.status === "DRAFT") {
    blockers.push("issue")
  }
  if (stage === "export" && vouchers.length === 0) blockers.push("generate_voucher")
  return blockers
}

export function withInvoiceId<T extends { invoiceId?: number | null }>(
  payload: T,
  invoiceId: number
): T {
  return { ...payload, invoiceId }
}
