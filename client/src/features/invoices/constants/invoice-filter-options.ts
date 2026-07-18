import type { InvoiceStatus } from "@/features/invoices/types/invoice"

export const INVOICE_STATUS_FILTER_OPTIONS: {
  value: "all" | InvoiceStatus
  labelKey: string
}[] = [
  { value: "all", labelKey: "filters.status_all" },
  { value: "ISSUED", labelKey: "status.ISSUED" },
  { value: "VOID", labelKey: "status.VOID" },
]

export const INVOICE_MARKETPLACE_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.marketplace_all" },
  { value: "LAZADA", labelKey: "filters.marketplace_lazada" },
  { value: "SHOPEE", labelKey: "filters.marketplace_shopee" },
  { value: "TIKTOK", labelKey: "filters.marketplace_tiktok" },
]
