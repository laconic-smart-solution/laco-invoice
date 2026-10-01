import assert from "node:assert/strict"
import { test } from "node:test"

import {
  calculateManualInvoiceTotals,
  deriveManualInvoiceStage,
  matchesManualInvoiceFilter,
  manualInvoiceBlockers,
  withInvoiceId,
} from "./manual-invoice.ts"

test("calculateManualInvoiceTotals uses quantity, discount, and VAT", () => {
  const totals = calculateManualInvoiceTotals(
    [
      { quantity: 2, unitPrice: 10, discount: 1 },
      { quantity: 1, unitPrice: 5, discount: 0 },
    ],
    0.07
  )
  assert.equal(totals.subtotal, 24)
  assert.equal(totals.vatAmount, 1.68)
  assert.equal(totals.grandTotal, 25.68)
})

test("queue filters match draft, ready, issued, and linked vouchers", () => {
  const draft = { id: 1, status: "DRAFT" as const, grandTotal: 0 }
  const ready = { id: 2, status: "DRAFT" as const, grandTotal: 25.68 }
  const issued = { id: 3, status: "ISSUED" as const, grandTotal: 25.68 }
  const voucherIds = new Set([3])

  assert.equal(matchesManualInvoiceFilter(draft, "draft", voucherIds), true)
  assert.equal(matchesManualInvoiceFilter(ready, "ready", voucherIds), true)
  assert.equal(matchesManualInvoiceFilter(draft, "ready", voucherIds), false)
  assert.equal(matchesManualInvoiceFilter(issued, "issued", voucherIds), true)
  assert.equal(matchesManualInvoiceFilter(issued, "has_voucher", voucherIds), true)
  assert.equal(matchesManualInvoiceFilter(ready, "has_voucher", voucherIds), false)
})

test("stage derivation follows draft, voucher, then export", () => {
  assert.equal(deriveManualInvoiceStage(null, []), "draft")
  assert.equal(deriveManualInvoiceStage({ status: "DRAFT" }, []), "draft")
  assert.equal(deriveManualInvoiceStage({ status: "ISSUED" }, []), "voucher")
  assert.equal(deriveManualInvoiceStage({ status: "ISSUED" }, [{ id: 8 }]), "export")
})

test("blocked stages explain missing draft, issue, and voucher", () => {
  assert.deepEqual(manualInvoiceBlockers(null, [], "review"), ["save_draft"])
  assert.deepEqual(
    manualInvoiceBlockers({ status: "DRAFT", grandTotal: 10 }, [], "voucher"),
    ["issue"]
  )
  assert.deepEqual(
    manualInvoiceBlockers({ status: "ISSUED", grandTotal: 10 }, [], "export"),
    ["generate_voucher"]
  )
  assert.deepEqual(
    manualInvoiceBlockers({ status: "ISSUED", grandTotal: 10 }, [{ id: 1 }], "export"),
    []
  )
})

test("invoice-linked generation payload keeps invoiceId", () => {
  const payload = withInvoiceId(
    { invoiceId: null, voucherBrief: "Invoice: INV-1" },
    42
  )
  assert.equal(payload.invoiceId, 42)
})
