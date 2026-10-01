export type FlowStageId = "import" | "match" | "voucher" | "export"
export type FlowQueueFilter = "all" | "ready" | "attention"
export type FlowWorkspaceTab = "orders" | "manual"
export type ManualInvoiceStage = "draft" | "review" | "voucher" | "export"
export type ManualInvoiceQueueFilter =
  | "all"
  | "draft"
  | "ready"
  | "issued"
  | "has_voucher"
export type FlowStatId =
  | "sets"
  | "review"
  | "ready"
  | "vouchers"
  | "export"
  | "orders"
  | "revenue"

export const MANUAL_INVOICE_STAGES: ManualInvoiceStage[] = [
  "draft",
  "review",
  "voucher",
  "export",
]

export const FLOW_STAGES: {
  id: FlowStageId
  labelKey: string
  descriptionKey: string
}[] = [
  {
    id: "import",
    labelKey: "pipeline.import",
    descriptionKey: "pipeline.import_description",
  },
  {
    id: "match",
    labelKey: "pipeline.match",
    descriptionKey: "pipeline.match_description",
  },
  {
    id: "voucher",
    labelKey: "pipeline.voucher",
    descriptionKey: "pipeline.voucher_description",
  },
  {
    id: "export",
    labelKey: "pipeline.export",
    descriptionKey: "pipeline.export_description",
  },
]

export const FLOW_STORES_LIST_REQUEST = {
  pageNumber: 1,
  pageSize: 500,
  sortBy: "name",
  sortOrder: "ASC" as const,
}

export const FLOW_RUNS_PAGE_SIZE = 50
