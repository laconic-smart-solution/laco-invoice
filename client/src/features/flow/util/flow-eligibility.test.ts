import assert from "node:assert/strict"
import { test } from "node:test"

import type { Voucher } from "@/features/vouchers/types/voucher"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"

import {
  canGenerateFlowVoucher,
  deriveFlowStageCounts,
  flowGenerateRequirements,
  flowMutationUiState,
  isFlowActionLocked,
  isFlowVoucherExportable,
  needsFlowReview,
  reconcileSelectedRunId,
} from "./flow-eligibility.ts"

function run(
  overrides: Partial<ApiOrderInputRunDto> = {}
): ApiOrderInputRunDto {
  return {
    id: 1,
    storeId: 10,
    storeName: "Store",
    marketplaceId: 1,
    marketplaceCode: "TIKTOK",
    title: "Set",
    inputFileType: "SHIPPING_FEE",
    status: "COMPLETED",
    orderDetailFilename: "orders.xlsx",
    orderDetailSize: 1,
    orderDetailStatus: "SUCCEEDED",
    orderDetailError: null,
    orderDetailStartedAt: null,
    orderDetailFinishedAt: null,
    orderDetailBatchId: null,
    orderDetailImportFileId: 5,
    withdrawFilename: null,
    withdrawSize: null,
    withdrawStatus: "MISSING",
    withdrawError: null,
    withdrawStartedAt: null,
    withdrawFinishedAt: null,
    withdrawRowCount: null,
    withdrawMatchedCount: null,
    withdrawUnmatchedCount: null,
    invoicePdfFilename: "invoice.pdf",
    invoicePdfSize: 1,
    invoicePdfStatus: "SUCCEEDED",
    invoicePdfError: null,
    invoiceReceiptNumber: "R-1",
    invoiceReceiptDate: null,
    invoicePeriodStart: null,
    invoicePeriodEnd: null,
    invoiceIssuerName: null,
    invoiceIssuerTaxId: null,
    invoiceBuyerName: null,
    invoiceBuyerTaxId: null,
    invoiceTotalAmount: 100,
    invoiceWithholdingTaxAmount: null,
    invoiceWithholdingTaxRate: null,
    excelMatchedAmount: 100,
    invoiceMatchStatus: "MATCHED",
    invoiceMatchDifference: 0,
    orderCount: 1,
    itemCount: 1,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

test("canGenerateFlowVoucher requires completed matched files", () => {
  assert.equal(canGenerateFlowVoucher(run()), true)
  assert.equal(canGenerateFlowVoucher(run({ status: "DRAFT" })), false)
  assert.equal(
    canGenerateFlowVoucher(run({ invoiceMatchStatus: "MISMATCH" })),
    false
  )
  assert.equal(
    canGenerateFlowVoucher(run({ invoicePdfFilename: null })),
    false
  )
  assert.equal(
    canGenerateFlowVoucher(run({ orderDetailFilename: null })),
    false
  )
})

test("flowGenerateRequirements lists remaining generate blockers", () => {
  const draftMatched = flowGenerateRequirements(run({ status: "DRAFT" }))
  assert.deepEqual(
    draftMatched.map((item) => [item.id, item.passed]),
    [
      ["excel", true],
      ["invoice", true],
      ["matched", true],
      ["completed", false],
    ]
  )
})

test("needsFlowReview covers mismatch unparsed and failed invoice", () => {
  assert.equal(needsFlowReview(run()), false)
  assert.equal(needsFlowReview(run({ invoiceMatchStatus: "MISMATCH" })), true)
  assert.equal(needsFlowReview(run({ invoiceMatchStatus: "UNPARSED" })), true)
  assert.equal(needsFlowReview(run({ invoicePdfStatus: "FAILED" })), true)
})

test("reconcileSelectedRunId keeps valid ids and allows explicit deselect", () => {
  const runs = [run({ id: 2 }), run({ id: 3 })]
  assert.equal(reconcileSelectedRunId(runs, 3), 3)
  assert.equal(reconcileSelectedRunId(runs, undefined), 2)
  assert.equal(reconcileSelectedRunId(runs, null), null)
  assert.equal(reconcileSelectedRunId(runs, 99), null)
  assert.equal(reconcileSelectedRunId([], 3), null)
})

test("deriveFlowStageCounts and export eligibility", () => {
  const vouchers = [
    { status: "GENERATED" },
    { status: "DRAFT" },
    { status: "POSTED" },
  ] as Voucher[]
  const counts = deriveFlowStageCounts(
    [run(), run({ id: 2, invoiceMatchStatus: "MISMATCH" })],
    vouchers
  )
  assert.equal(counts.import, 2)
  assert.equal(counts.match, 2)
  assert.equal(counts.matchErrors, 1)
  assert.equal(counts.voucherReady, 1)
  assert.equal(counts.vouchers, 3)
  assert.equal(counts.export, 2)
  assert.equal(isFlowVoucherExportable({ status: "GENERATED" }), true)
  assert.equal(isFlowVoucherExportable({ status: "DRAFT" }), false)
})

test("mutation success and failure phases lock writes while pending", () => {
  assert.equal(
    flowMutationUiState({
      isPending: true,
      isSuccess: false,
      isError: false,
    }),
    "pending"
  )
  assert.equal(
    flowMutationUiState({
      isPending: false,
      isSuccess: true,
      isError: false,
    }),
    "success"
  )
  assert.equal(
    flowMutationUiState({
      isPending: false,
      isSuccess: false,
      isError: true,
    }),
    "error"
  )
  assert.equal(isFlowActionLocked(true, false), true)
  assert.equal(isFlowActionLocked(false, true), true)
  assert.equal(isFlowActionLocked(false, false), false)
})
