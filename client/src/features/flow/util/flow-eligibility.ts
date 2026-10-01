import type { Voucher } from "@/features/vouchers/types/voucher"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"

export function excelFilenameForRun(run: ApiOrderInputRunDto): string | null {
  return run.inputFileType === "SHIPPING_FEE"
    ? run.orderDetailFilename
    : run.withdrawFilename
}

export function hasFlowInvoiceDisplayError(run: ApiOrderInputRunDto): boolean {
  return (
    run.invoiceMatchStatus === "MISMATCH" ||
    run.invoiceMatchStatus === "UNPARSED" ||
    run.invoicePdfStatus === "FAILED"
  )
}

export function hasFlowSourceFiles(run: ApiOrderInputRunDto): boolean {
  return Boolean(run.invoicePdfFilename) && Boolean(excelFilenameForRun(run))
}

export type FlowGenerateRequirementId =
  | "excel"
  | "invoice"
  | "matched"
  | "completed"

export interface FlowGenerateRequirement {
  id: FlowGenerateRequirementId
  passed: boolean
}

export function flowGenerateRequirements(
  run: ApiOrderInputRunDto
): FlowGenerateRequirement[] {
  return [
    { id: "excel", passed: Boolean(excelFilenameForRun(run)) },
    { id: "invoice", passed: Boolean(run.invoicePdfFilename) },
    {
      id: "matched",
      passed:
        run.invoiceMatchStatus === "MATCHED" &&
        !hasFlowInvoiceDisplayError(run),
    },
    { id: "completed", passed: run.status === "COMPLETED" },
  ]
}

export function canGenerateFlowVoucher(run: ApiOrderInputRunDto): boolean {
  return flowGenerateRequirements(run).every((requirement) => requirement.passed)
}

export type FlowMutationUiState = "idle" | "pending" | "success" | "error"

export function flowMutationUiState(input: {
  isPending: boolean
  isSuccess: boolean
  isError: boolean
}): FlowMutationUiState {
  if (input.isPending) return "pending"
  if (input.isError) return "error"
  if (input.isSuccess) return "success"
  return "idle"
}

export function isFlowActionLocked(
  isPending: boolean,
  isConfirmOpen = false
): boolean {
  return isPending || isConfirmOpen
}

export function needsFlowReview(run: ApiOrderInputRunDto): boolean {
  return (
    run.invoiceMatchStatus === "MISMATCH" ||
    run.invoiceMatchStatus === "UNPARSED" ||
    run.invoicePdfStatus === "FAILED"
  )
}

export function isFlowVoucherExportable(voucher: Pick<Voucher, "status">): boolean {
  return voucher.status === "GENERATED" || voucher.status === "POSTED"
}

export interface FlowStageCounts {
  import: number
  match: number
  matchErrors: number
  voucherReady: number
  vouchers: number
  export: number
}

export function deriveFlowStageCounts(
  runs: ApiOrderInputRunDto[],
  vouchers: Voucher[]
): FlowStageCounts {
  const matchReady = runs.filter(
    (run) =>
      run.invoiceMatchStatus === "MATCHED" ||
      run.invoiceMatchStatus === "MISMATCH"
  ).length
  const matchErrors = runs.filter(needsFlowReview).length
  const voucherReady = runs.filter(canGenerateFlowVoucher).length
  const exportable = vouchers.filter(isFlowVoucherExportable).length

  return {
    import: runs.length,
    match: matchReady,
    matchErrors,
    voucherReady,
    vouchers: vouchers.length,
    export: exportable,
  }
}

export function reconcileSelectedRunId(
  runs: ApiOrderInputRunDto[],
  selectedId: number | null | undefined
): number | null {
  if (runs.length === 0) {
    return null
  }
  if (selectedId === undefined) {
    return runs[0].id
  }
  if (selectedId != null && runs.some((run) => run.id === selectedId)) {
    return selectedId
  }
  return null
}
