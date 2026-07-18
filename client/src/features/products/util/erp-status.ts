import type { ProductErpStatus } from "@/features/products/types/product"

/** Normalize API erpStatus values (e.g. SYNCED / UNMAPPED) to UI status keys. */
export function normalizeProductErpStatus(value: string | null | undefined): ProductErpStatus {
  return value?.toLowerCase() === "synced" ? "synced" : "unmapped"
}

export const ERP_STATUS_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.erp_status.all" },
  { value: "synced", labelKey: "filters.erp_status.synced" },
  { value: "unmapped", labelKey: "filters.erp_status.unmapped" },
] as const
