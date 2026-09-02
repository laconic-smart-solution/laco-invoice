import type {
  CreateInvoiceRequest,
  Invoice,
  InvoiceItemLine,
  InvoiceOrderSummary,
  InvoicePaymentSummary,
  InvoicePreview,
  InvoiceStatus,
  PaymentAllocationStatus,
} from "@/features/invoices/types/invoice"
import type {
  CreateVoucherRequest,
  PaymentMethod,
  PaymentVoucher,
  VoucherStatus,
} from "@/features/invoices/types/voucher"
import { getMockApiOrderDetail, getMockApiOrdersPage } from "@/shared/mock/mock-order-bridge"
import {
  getInputRunById,
  getMockState,
  getStoreById,
  MOCK_MARKETPLACES,
  type MockInvoiceRecord,
} from "@/shared/mock/mock-seed-data"
import type { GeneratedNumber } from "@/shared/services/invoice.service"
import type { ApiOrderDetailDto } from "@/shared/services/order.service"
import { paginateArray } from "@/shared/mock/mock-utils"

const DEFAULT_VAT_RATE = 0.07
const DEFAULT_CURRENCY = "THB"
const SAMPLE_ORDER_COUNT = 100

export class MockApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function money(value: number): number {
  return Math.round(value * 100) / 100
}

function contains(value: string | null | undefined, query: string): boolean {
  return (value ?? "").toLowerCase().includes(query.toLowerCase())
}

function marketplaceIdFor(code: string): number {
  return MOCK_MARKETPLACES.find((m) => m.code === code)?.id ?? 3
}

function periodPrefix(kind: "INV" | "VCH"): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${kind}-${now.getFullYear()}${month}-`
}

function nextSequentialNumber(kind: "INV" | "VCH", existing: string[]): string {
  const prefix = periodPrefix(kind)
  const maxSuffix = existing
    .filter((number) => number.toUpperCase().startsWith(prefix))
    .map((number) => Number.parseInt(number.slice(prefix.length), 10))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0)
  return `${prefix}${String(maxSuffix + 1).padStart(3, "0")}`
}

function allocationStatus(total: number, paid: number): PaymentAllocationStatus {
  if (total <= 0) {
    return "UNPAID"
  }
  if (paid > total) {
    return "OVERPAID"
  }
  if (paid === total) {
    return "PAID"
  }
  return paid > 0 ? "PARTIAL" : "UNPAID"
}

function paidByOrderId(): Map<number, number> {
  const paid = new Map<number, number>()
  for (const voucher of getMockState().vouchers) {
    if (voucher.status === "VOID") {
      continue
    }
    for (const allocation of voucher.allocations) {
      if (allocation.orderId == null) {
        continue
      }
      paid.set(
        allocation.orderId,
        money((paid.get(allocation.orderId) ?? 0) + allocation.allocatedAmount)
      )
    }
  }
  return paid
}

function paidByInvoiceId(invoiceId: number): { paid: number; voucherIds: Set<number> } {
  let paid = 0
  const voucherIds = new Set<number>()
  for (const voucher of getMockState().vouchers) {
    if (voucher.status === "VOID") {
      continue
    }
    for (const allocation of voucher.allocations) {
      if (allocation.invoiceId === invoiceId) {
        paid += allocation.allocatedAmount
        voucherIds.add(voucher.id)
      }
    }
  }
  return { paid: money(paid), voucherIds }
}

function billedOrderIds(excludeInvoiceId?: number): Set<number> {
  const billed = new Set<number>()
  for (const record of getMockState().invoices) {
    if (record.invoice.status === "VOID") {
      continue
    }
    if (excludeInvoiceId != null && record.invoice.id === excludeInvoiceId) {
      continue
    }
    for (const order of record.orders) {
      billed.add(order.orderId)
    }
  }
  return billed
}

export function buildInvoicePaymentSummary(invoice: Invoice): InvoicePaymentSummary {
  const { paid, voucherIds } = paidByInvoiceId(invoice.id)
  const remaining = money(Math.max(0, invoice.grandTotal - paid))
  const paidPercentage =
    invoice.grandTotal > 0
      ? Math.min(100, Math.round((paid * 100) / invoice.grandTotal))
      : 0
  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceTotalAmount: invoice.grandTotal,
    totalPaidAmount: paid,
    remainingBalance: remaining,
    status: allocationStatus(invoice.grandTotal, paid),
    paidPercentage,
    voucherCount: voucherIds.size,
  }
}

function withLiveOrderPayments(orders: InvoiceOrderSummary[]): InvoiceOrderSummary[] {
  const paid = paidByOrderId()
  return orders.map((order) => {
    const totalPaidAmount = paid.get(order.orderId) ?? 0
    const remainingBalance = money(Math.max(0, order.totalAmount - totalPaidAmount))
    return {
      ...order,
      totalPaidAmount,
      remainingBalance,
      paymentStatus: allocationStatus(order.totalAmount, totalPaidAmount),
    }
  })
}

export function getMockInvoiceRecord(id: number): MockInvoiceRecord | undefined {
  return getMockState().invoices.find((record) => record.invoice.id === id)
}

export function getMockInvoiceDetail(id: number) {
  const record = getMockInvoiceRecord(id)
  if (!record) {
    throw new MockApiError(404, `Invoice not found: id=${id}`)
  }
  return {
    invoice: record.invoice,
    orders: withLiveOrderPayments(record.orders),
    items: record.items,
    paymentSummary: buildInvoicePaymentSummary(record.invoice),
  }
}

export function pageMockInvoices(body: Record<string, unknown>) {
  const filter = (body.filter as Record<string, unknown> | undefined) ?? {}
  let items = [...getMockState().invoices.map((record) => record.invoice)]

  if (filter.storeId != null) {
    const storeId = Number(filter.storeId)
    items = items.filter((invoice) => invoice.storeId === storeId)
  }
  if (filter.marketplaceId != null) {
    const marketplaceId = Number(filter.marketplaceId)
    items = items.filter((invoice) => invoice.marketplaceId === marketplaceId)
  }
  if (typeof filter.marketplaceCode === "string" && filter.marketplaceCode) {
    items = items.filter(
      (invoice) => invoice.marketplaceCode === filter.marketplaceCode
    )
  }
  if (typeof filter.invoiceNumber === "string" && filter.invoiceNumber.trim()) {
    items = items.filter((invoice) =>
      contains(invoice.invoiceNumber, filter.invoiceNumber as string)
    )
  }
  if (typeof filter.title === "string" && filter.title.trim()) {
    items = items.filter((invoice) => contains(invoice.title, filter.title as string))
  }
  if (typeof filter.status === "string" && filter.status) {
    items = items.filter((invoice) => invoice.status === filter.status)
  }

  const sortOrder = body.sortOrder === "ASC" ? 1 : -1
  items.sort((a, b) => a.createdAt.localeCompare(b.createdAt) * sortOrder)

  return paginateArray(items, body.pageNumber, body.pageSize)
}

export function getMockNextInvoiceNumber(): GeneratedNumber {
  return {
    number: nextSequentialNumber(
      "INV",
      getMockState().invoices.map((record) => record.invoice.invoiceNumber)
    ),
    available: true,
  }
}

export function checkMockInvoiceNumber(
  invoiceNumber: string,
  excludeId?: number
): GeneratedNumber {
  const trimmed = invoiceNumber.trim()
  if (!trimmed) {
    return { number: trimmed, available: false }
  }
  const taken = getMockState().invoices.some(
    (record) =>
      record.invoice.invoiceNumber.toLowerCase() === trimmed.toLowerCase() &&
      record.invoice.id !== excludeId
  )
  return { number: trimmed, available: !taken }
}

interface BillableOrder {
  detail: ApiOrderDetailDto
}

function collectBillableOrders(request: CreateInvoiceRequest): {
  orders: BillableOrder[]
  skippedAlreadyBilled: number
} {
  const billed = billedOrderIds()
  const sample = getMockApiOrdersPage(1, SAMPLE_ORDER_COUNT)
  let candidates = sample.filter((order) => {
    if (order.storeId !== request.storeId) {
      return false
    }
    if (order.marketplaceCode !== request.marketplaceCode) {
      return false
    }
    if (order.orderStatus === "CANCELLED") {
      return false
    }
    return true
  })

  const inRange = candidates.filter((order) => {
    const date = order.orderDate?.slice(0, 10) ?? ""
    return date >= request.startDate && date <= request.endDate
  })
  if (inRange.length > 0) {
    candidates = inRange
  }

  if (request.orderRunId != null) {
    const bucket = request.orderRunId % 5
    const fromRun = candidates.filter((order) => order.id % 5 === bucket)
    if (fromRun.length > 0) {
      candidates = fromRun
    }
  }

  const skippedAlreadyBilled = candidates.filter((order) => billed.has(order.id)).length
  const billable = candidates
    .filter((order) => !billed.has(order.id))
    .map((order) => getMockApiOrderDetail(order.id))
    .filter((detail): detail is ApiOrderDetailDto => detail != null)

  return { orders: billable.map((detail) => ({ detail })), skippedAlreadyBilled }
}

function totalsFor(orders: BillableOrder[], vatRate: number) {
  let grandTotal = 0
  let vatAmount = 0
  let itemCount = 0
  for (const { detail } of orders) {
    const total = detail.order.totalAmount
    grandTotal += total
    vatAmount += detail.order.vatAmount ?? money(total - total / (1 + vatRate))
    itemCount += detail.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
  }
  grandTotal = money(grandTotal)
  vatAmount = money(vatAmount)
  return {
    itemCount,
    subtotal: money(grandTotal - vatAmount),
    vatAmount,
    grandTotal,
    currency: orders[0]?.detail.order.currency ?? DEFAULT_CURRENCY,
  }
}

export function previewMockInvoice(request: CreateInvoiceRequest): InvoicePreview {
  const vatRate = request.vatRate == null || request.vatRate < 0 ? DEFAULT_VAT_RATE : request.vatRate
  const billable = collectBillableOrders(request)
  const totals = totalsFor(billable.orders, vatRate)
  return {
    orderCount: billable.orders.length,
    itemCount: totals.itemCount,
    subtotal: totals.subtotal,
    vatRate,
    vatAmount: totals.vatAmount,
    grandTotal: totals.grandTotal,
    currency: totals.currency,
    skippedAlreadyBilledCount: billable.skippedAlreadyBilled,
  }
}

export function createMockInvoice(request: CreateInvoiceRequest): Invoice {
  const state = getMockState()
  const store = getStoreById(request.storeId)
  if (!store) {
    throw new MockApiError(400, `Store not found: id=${request.storeId}`)
  }

  const invoiceNumber = (request.invoiceNumber ?? "").trim() || getMockNextInvoiceNumber().number
  if (!checkMockInvoiceNumber(invoiceNumber).available) {
    throw new MockApiError(
      400,
      `Invoice number "${invoiceNumber}" already exists. Please choose a unique number.`
    )
  }

  const vatRate = request.vatRate == null || request.vatRate < 0 ? DEFAULT_VAT_RATE : request.vatRate
  const billable = collectBillableOrders(request)
  if (billable.orders.length === 0) {
    throw new MockApiError(
      400,
      `No billable orders found for the selected store and period. ${billable.skippedAlreadyBilled} order(s) are already on another invoice.`
    )
  }

  const totals = totalsFor(billable.orders, vatRate)
  const run = request.orderRunId != null ? getInputRunById(request.orderRunId) : undefined
  const timestamp = nowIso()
  const id = state.nextInvoiceId++

  const orders: InvoiceOrderSummary[] = []
  const items: InvoiceItemLine[] = []
  for (const { detail } of billable.orders) {
    const total = detail.order.totalAmount
    const vat = detail.order.vatAmount ?? money(total - total / (1 + vatRate))
    const orderDate = detail.order.orderDate?.slice(0, 10) ?? todayDate()
    orders.push({
      orderId: detail.order.id,
      externalOrderId: detail.order.externalOrderId,
      orderDate,
      itemCount: detail.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
      totalAmount: total,
      vatAmount: vat,
      amountExVat: money(total - vat),
      buyerName: detail.customer?.name ?? detail.order.customerName,
      buyerTaxId: detail.order.id % 2 === 0 ? null : "0105558123456",
      totalPaidAmount: 0,
      remainingBalance: total,
      paymentStatus: "UNPAID",
    })
    for (const item of detail.items) {
      items.push({
        id: state.nextInvoiceItemId++,
        orderId: detail.order.id,
        externalOrderId: detail.order.externalOrderId,
        orderDate,
        platformSkuId: item.sku,
        sellerSku: item.sku,
        productName: item.productName,
        variation: null,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.lineTotal,
        discount: 0,
        totalAmount: item.lineTotal,
      })
    }
  }

  const invoice: Invoice = {
    id,
    invoiceNumber,
    title: request.title.trim(),
    storeId: store.id,
    storeName: store.name,
    marketplaceId: marketplaceIdFor(request.marketplaceCode),
    marketplaceCode: request.marketplaceCode,
    status: "ISSUED",
    startDate: request.startDate,
    endDate: request.endDate,
    orderRunId: run?.id ?? null,
    orderRunTitle: run?.title ?? null,
    orderCount: orders.length,
    itemCount: totals.itemCount,
    subtotal: totals.subtotal,
    vatRate,
    vatAmount: totals.vatAmount,
    grandTotal: totals.grandTotal,
    currency: totals.currency,
    notes: request.notes ?? null,
    buyerName: request.buyerName ?? null,
    buyerTaxId: request.buyerTaxId ?? null,
    buyerAddress: request.buyerAddress ?? null,
    issuedAt: timestamp,
    paidAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  state.invoices.unshift({ invoice, orders, items })
  return invoice
}

export function updateMockInvoiceNumber(id: number, invoiceNumber: string): Invoice {
  const record = getMockInvoiceRecord(id)
  if (!record) {
    throw new MockApiError(404, `Invoice not found: id=${id}`)
  }
  const trimmed = invoiceNumber.trim()
  if (!trimmed) {
    throw new MockApiError(400, "Invoice number cannot be empty")
  }
  if (!checkMockInvoiceNumber(trimmed, id).available) {
    throw new MockApiError(
      400,
      `Invoice number "${trimmed}" is already in use by another invoice.`
    )
  }
  record.invoice = {
    ...record.invoice,
    invoiceNumber: trimmed,
    updatedAt: nowIso(),
  }
  return record.invoice
}

export function updateMockInvoiceStatus(id: number, status: InvoiceStatus): Invoice {
  const record = getMockInvoiceRecord(id)
  if (!record) {
    throw new MockApiError(404, `Invoice not found: id=${id}`)
  }
  record.invoice = {
    ...record.invoice,
    status,
    paidAt: status === "PAID" ? nowIso() : null,
    updatedAt: nowIso(),
  }
  return record.invoice
}

export function deleteMockInvoice(id: number): void {
  const state = getMockState()
  const index = state.invoices.findIndex((record) => record.invoice.id === id)
  if (index < 0) {
    throw new MockApiError(404, `Invoice not found: id=${id}`)
  }
  state.invoices.splice(index, 1)
}

export function pageMockVouchers(body: Record<string, unknown>) {
  const filter = (body.filter as Record<string, unknown> | undefined) ?? {}
  let items = [...getMockState().vouchers]

  if (filter.storeId != null) {
    const storeId = Number(filter.storeId)
    items = items.filter((voucher) => voucher.storeId === storeId)
  }
  if (typeof filter.voucherNumber === "string" && filter.voucherNumber.trim()) {
    items = items.filter((voucher) =>
      contains(voucher.voucherNumber, filter.voucherNumber as string)
    )
  }
  if (typeof filter.customerName === "string" && filter.customerName.trim()) {
    items = items.filter((voucher) =>
      contains(voucher.customerName, filter.customerName as string)
    )
  }
  if (typeof filter.paymentMethod === "string" && filter.paymentMethod) {
    items = items.filter((voucher) => voucher.paymentMethod === filter.paymentMethod)
  }
  if (typeof filter.status === "string" && filter.status) {
    items = items.filter((voucher) => voucher.status === filter.status)
  }

  const sortOrder = body.sortOrder === "ASC" ? 1 : -1
  items.sort((a, b) => a.createdAt.localeCompare(b.createdAt) * sortOrder)

  return paginateArray(items, body.pageNumber, body.pageSize)
}

export function getMockVoucher(id: number): PaymentVoucher {
  const voucher = getMockState().vouchers.find((item) => item.id === id)
  if (!voucher) {
    throw new MockApiError(404, `Payment voucher not found: id=${id}`)
  }
  return voucher
}

export function listMockVouchersByInvoice(invoiceId: number): PaymentVoucher[] {
  return getMockState().vouchers.filter((voucher) =>
    voucher.allocations.some((allocation) => allocation.invoiceId === invoiceId)
  )
}

export function getMockNextVoucherNumber(): GeneratedNumber {
  return {
    number: nextSequentialNumber(
      "VCH",
      getMockState().vouchers.map((voucher) => voucher.voucherNumber)
    ),
    available: true,
  }
}

export function checkMockVoucherNumber(
  voucherNumber: string,
  excludeId?: number
): GeneratedNumber {
  const trimmed = voucherNumber.trim()
  if (!trimmed) {
    return { number: trimmed, available: false }
  }
  const taken = getMockState().vouchers.some(
    (voucher) =>
      voucher.voucherNumber.toLowerCase() === trimmed.toLowerCase() &&
      voucher.id !== excludeId
  )
  return { number: trimmed, available: !taken }
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "CASH",
  "PLATFORM_PAYOUT",
  "PROMPTPAY",
  "CHEQUE",
]

function asPaymentMethod(value: unknown): PaymentMethod {
  if (typeof value === "string" && PAYMENT_METHODS.includes(value as PaymentMethod)) {
    return value as PaymentMethod
  }
  return "BANK_TRANSFER"
}

export function createMockVoucher(request: CreateVoucherRequest): PaymentVoucher {
  const state = getMockState()
  const store = getStoreById(request.storeId)
  if (!store) {
    throw new MockApiError(400, `Store not found: id=${request.storeId}`)
  }

  const voucherNumber =
    (request.voucherNumber ?? "").trim() || getMockNextVoucherNumber().number
  if (!checkMockVoucherNumber(voucherNumber).available) {
    throw new MockApiError(
      400,
      `Voucher number "${voucherNumber}" already exists. Please choose a unique number.`
    )
  }

  const allocationsInput = request.allocations ?? []
  if (allocationsInput.length === 0) {
    throw new MockApiError(400, "At least one allocation is required.")
  }

  const allocatedTotal = money(
    allocationsInput.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0)
  )
  if (allocatedTotal > request.totalAmount) {
    throw new MockApiError(
      400,
      `Allocated amount (${allocatedTotal}) exceeds the received voucher amount (${request.totalAmount}).`
    )
  }

  const previouslyPaid = paidByOrderId()
  const timestamp = nowIso()
  const id = state.nextVoucherId++
  const allocations = allocationsInput.map((allocation) => {
    const invoice =
      allocation.invoiceId != null ? getMockInvoiceRecord(allocation.invoiceId) : undefined
    const billedOrder = invoice?.orders.find((order) => order.orderId === allocation.orderId)
    const liveOrder = getMockApiOrderDetail(allocation.orderId)
    const orderTotal =
      billedOrder?.totalAmount ?? liveOrder?.order.totalAmount ?? allocation.allocatedAmount
    const previous = previouslyPaid.get(allocation.orderId) ?? 0
    const remaining = money(Math.max(0, orderTotal - previous - allocation.allocatedAmount))
    previouslyPaid.set(allocation.orderId, money(previous + allocation.allocatedAmount))

    return {
      id: state.nextAllocationId++,
      voucherId: id,
      orderId: allocation.orderId,
      externalOrderId:
        billedOrder?.externalOrderId ??
        liveOrder?.order.externalOrderId ??
        `ORDER-${allocation.orderId}`,
      invoiceId: allocation.invoiceId ?? invoice?.invoice.id ?? null,
      invoiceNumber: invoice?.invoice.invoiceNumber ?? null,
      orderTotalAmount: orderTotal,
      allocatedAmount: allocation.allocatedAmount,
      previousPaidAmount: previous,
      remainingBalance: remaining,
      buyerName: billedOrder?.buyerName ?? liveOrder?.customer?.name ?? null,
      allocatedAt: timestamp,
      notes: allocation.notes ?? null,
    }
  })

  const voucher: PaymentVoucher = {
    id,
    voucherNumber,
    date: request.date,
    storeId: store.id,
    storeName: store.name,
    customerName: request.customerName ?? null,
    customerTaxId: request.customerTaxId ?? null,
    totalAmount: request.totalAmount,
    allocatedAmount: allocatedTotal,
    unallocatedAmount: money(Math.max(0, request.totalAmount - allocatedTotal)),
    paymentMethod: asPaymentMethod(request.paymentMethod),
    bankReference: request.bankReference ?? null,
    proofFileUrl: null,
    notes: request.notes ?? null,
    status: "CONFIRMED" satisfies VoucherStatus,
    createdAt: timestamp,
    updatedAt: timestamp,
    allocations,
  }

  state.vouchers.unshift(voucher)
  return voucher
}

export function deleteMockVoucher(id: number): void {
  const state = getMockState()
  const index = state.vouchers.findIndex((voucher) => voucher.id === id)
  if (index < 0) {
    throw new MockApiError(404, `Payment voucher not found: id=${id}`)
  }
  state.vouchers.splice(index, 1)
}
