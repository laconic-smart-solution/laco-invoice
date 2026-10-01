import assert from "node:assert/strict"
import { test } from "node:test"

import {
  createManualInvoiceSchema,
  defaultManualInvoiceValues,
  toManualInvoiceRequest,
} from "./manual-invoice-schema.ts"

const schema = createManualInvoiceSchema({
  required: "Required",
  positive: "Positive",
  dateRange: "Date range",
  lineRequired: "Need a line",
})

test("rejects empty product lines and inverted dates", () => {
  const values = defaultManualInvoiceValues()
  values.title = "Manual"
  values.storeId = "1"
  values.marketplaceCode = "TIKTOK"
  values.startDate = "2026-09-22"
  values.endDate = "2026-09-21"
  values.lines = [
    {
      productName: "",
      sellerSku: "",
      quantity: "0",
      unitPrice: "-1",
      discount: "0",
    },
  ]

  const result = schema.safeParse(values)
  assert.equal(result.success, false)
})

test("accepts a valid line and maps the request without client totals", () => {
  const values = defaultManualInvoiceValues()
  values.title = "Manual"
  values.storeId = "12"
  values.marketplaceCode = "LAZADA"
  values.vatRate = "0.07"
  values.lines = [
    {
      productName: "Widget",
      sellerSku: "SKU-1",
      quantity: "2",
      unitPrice: "10.5",
      discount: "1",
    },
  ]

  const parsed = schema.parse(values)
  const request = toManualInvoiceRequest(parsed)
  assert.equal(request.storeId, 12)
  assert.equal(request.lines[0]?.quantity, 2)
  assert.equal(request.lines[0]?.unitPrice, 10.5)
  assert.equal(request.lines[0]?.sku, "SKU-1")
  assert.equal("grandTotal" in request, false)
})
