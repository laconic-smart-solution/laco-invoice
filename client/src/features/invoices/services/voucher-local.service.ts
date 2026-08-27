import type {
  CreateVoucherRequest,
  InvoicePaymentSummary,
  OrderPaymentSummary,
  PaymentVoucher,
  VoucherOrderAllocation,
} from "../types/voucher"

const VOUCHER_STORAGE_KEY = "laco_payment_vouchers_v1"

const INITIAL_VOUCHERS: PaymentVoucher[] = [
  {
    id: "vch-2026-08-01",
    voucherNumber: "VCH-202608-001",
    date: "2026-08-26",
    storeId: "1",
    storeName: "Tiktok Shop (1) By Dev Alvin",
    customerName: "Yoik Global Trading Co., Ltd.",
    customerTaxId: "0105559876543",
    totalAmount: 100000.0,
    allocatedAmount: 100000.0,
    unallocatedAmount: 0.0,
    paymentMethod: "BANK_TRANSFER",
    bankReference: "KBANK-TRF-982314",
    notes: "August partial bulk settlement on Yoik marketplace batch.",
    status: "CONFIRMED",
    createdAt: "2026-08-26T14:30:00Z",
    updatedAt: "2026-08-26T14:30:00Z",
    allocations: [
      {
        id: "alloc-1",
        voucherId: "vch-2026-08-01",
        orderId: "584833040405373267",
        externalOrderId: "584833040405373267",
        invoiceId: "inv-2026-08-01",
        invoiceNumber: "INV-202608-001",
        orderTotalAmount: 577.4,
        allocatedAmount: 577.4,
        previousPaidAmount: 0.0,
        remainingBalance: 0.0,
        buyerName: "Customer #1001",
        allocatedAt: "2026-08-26T14:30:00Z",
      },
      {
        id: "alloc-2",
        voucherId: "vch-2026-08-01",
        orderId: "584158529913068379",
        externalOrderId: "584158529913068379",
        invoiceId: "inv-2026-08-01",
        invoiceNumber: "INV-202608-001",
        orderTotalAmount: 357.0,
        allocatedAmount: 357.0,
        previousPaidAmount: 0.0,
        remainingBalance: 0.0,
        buyerName: "Customer #1002",
        allocatedAt: "2026-08-26T14:30:00Z",
      },
      {
        id: "alloc-3",
        voucherId: "vch-2026-08-01",
        orderId: "584631784366407298",
        externalOrderId: "584631784366407298",
        invoiceId: "inv-2026-08-01",
        invoiceNumber: "INV-202608-001",
        orderTotalAmount: 159.0,
        allocatedAmount: 100.0,
        previousPaidAmount: 0.0,
        remainingBalance: 59.0,
        buyerName: "Customer #1003",
        allocatedAt: "2026-08-26T14:30:00Z",
        notes: "Partial payment; 59 THB pending next transfer.",
      },
    ],
  },
]

export const voucherLocalService = {
  getAll(): PaymentVoucher[] {
    try {
      const stored = localStorage.getItem(VOUCHER_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // ignore
    }
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(INITIAL_VOUCHERS))
    return INITIAL_VOUCHERS
  },

  getById(id: string): PaymentVoucher | undefined {
    const list = this.getAll()
    return list.find((v) => v.id === id || v.voucherNumber === id)
  },

  getByInvoiceId(invoiceId: string): PaymentVoucher[] {
    const list = this.getAll()
    return list.filter((v) =>
      v.allocations.some((a) => a.invoiceId === invoiceId || a.invoiceNumber === invoiceId)
    )
  },

  getByOrderId(orderId: string): { voucher: PaymentVoucher; allocation: VoucherOrderAllocation }[] {
    const list = this.getAll()
    const results: { voucher: PaymentVoucher; allocation: VoucherOrderAllocation }[] = []
    for (const v of list) {
      const alloc = v.allocations.find((a) => a.orderId === orderId || a.externalOrderId === orderId)
      if (alloc) {
        results.push({ voucher: v, allocation: alloc })
      }
    }
    return results
  },

  isVoucherNumberTaken(voucherNumber: string, excludeId?: string): boolean {
    const list = this.getAll()
    const target = voucherNumber.trim().toLowerCase()
    return list.some((v) => v.id !== excludeId && v.voucherNumber.trim().toLowerCase() === target)
  },

  getNextVoucherNumber(): string {
    const list = this.getAll()
    const now = new Date()
    const prefix = `VCH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-`
    let nextIdx = list.length + 1
    let candidate = `${prefix}${String(nextIdx).padStart(3, "0")}`
    while (this.isVoucherNumberTaken(candidate)) {
      nextIdx++
      candidate = `${prefix}${String(nextIdx).padStart(3, "0")}`
    }
    return candidate
  },

  getOrderPaymentSummary(orderId: string, orderTotalAmount: number): OrderPaymentSummary {
    const matched = this.getByOrderId(orderId)
    const totalPaidAmount = matched.reduce((sum, item) => sum + item.allocation.allocatedAmount, 0)
    const remainingBalance = Math.max(0, Number((orderTotalAmount - totalPaidAmount).toFixed(2)))

    let status: OrderPaymentSummary["status"] = "UNPAID"
    if (totalPaidAmount >= orderTotalAmount - 0.001) {
      status = "PAID"
    } else if (totalPaidAmount > 0) {
      status = "PARTIAL"
    }

    return {
      orderId,
      externalOrderId: orderId,
      orderTotalAmount,
      totalPaidAmount,
      remainingBalance,
      status,
      vouchers: matched.map((m) => ({
        voucherId: m.voucher.id,
        voucherNumber: m.voucher.voucherNumber,
        date: m.voucher.date,
        allocatedAmount: m.allocation.allocatedAmount,
        paymentMethod: m.voucher.paymentMethod,
      })),
    }
  },

  getInvoicePaymentSummary(invoiceId: string, invoiceTotalAmount: number): InvoicePaymentSummary {
    const vouchers = this.getByInvoiceId(invoiceId)
    const totalPaidAmount = vouchers.reduce((sum, v) => {
      const invoiceAllocations = v.allocations.filter(
        (a) => a.invoiceId === invoiceId || a.invoiceNumber === invoiceId
      )
      return sum + invoiceAllocations.reduce((aSum, a) => aSum + a.allocatedAmount, 0)
    }, 0)

    const remainingBalance = Math.max(0, Number((invoiceTotalAmount - totalPaidAmount).toFixed(2)))
    const paidPercentage = invoiceTotalAmount > 0 ? Math.min(100, Math.round((totalPaidAmount / invoiceTotalAmount) * 100)) : 0

    let status: InvoicePaymentSummary["status"] = "UNPAID"
    if (totalPaidAmount >= invoiceTotalAmount - 0.001) {
      status = "PAID"
    } else if (totalPaidAmount > 0) {
      status = "PARTIAL"
    }

    return {
      invoiceId,
      invoiceNumber: invoiceId,
      invoiceTotalAmount,
      totalPaidAmount,
      remainingBalance,
      status,
      paidPercentage,
      voucherCount: vouchers.length,
    }
  },

  create(req: CreateVoucherRequest): PaymentVoucher {
    const list = this.getAll()
    const voucherNumber = req.voucherNumber?.trim() || this.getNextVoucherNumber()
    if (this.isVoucherNumberTaken(voucherNumber)) {
      throw new Error(`Voucher number "${voucherNumber}" already exists. Please choose a unique number.`)
    }

    const totalAllocated = req.allocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0)
    const unallocatedAmount = Math.max(0, Number((req.totalAmount - totalAllocated).toFixed(2)))
    const now = new Date().toISOString()
    const voucherId = `vch-${Date.now()}`

    const allocations: VoucherOrderAllocation[] = req.allocations
      .filter((a) => a.allocatedAmount > 0)
      .map((a, idx) => {
        const remaining = Math.max(0, Number((a.orderTotalAmount - (a.previousPaidAmount + a.allocatedAmount)).toFixed(2)))
        return {
          id: `alloc-${Date.now()}-${idx + 1}`,
          voucherId,
          orderId: a.orderId,
          externalOrderId: a.externalOrderId,
          invoiceId: a.invoiceId,
          invoiceNumber: a.invoiceNumber,
          orderTotalAmount: a.orderTotalAmount,
          allocatedAmount: a.allocatedAmount,
          previousPaidAmount: a.previousPaidAmount,
          remainingBalance: remaining,
          buyerName: a.buyerName,
          allocatedAt: now,
          notes: a.notes,
        }
      })

    const newVoucher: PaymentVoucher = {
      id: voucherId,
      voucherNumber,
      date: req.date || now.split("T")[0],
      storeId: req.storeId,
      storeName: req.storeName,
      customerName: req.customerName,
      customerTaxId: req.customerTaxId,
      totalAmount: req.totalAmount,
      allocatedAmount: totalAllocated,
      unallocatedAmount,
      paymentMethod: req.paymentMethod,
      bankReference: req.bankReference,
      notes: req.notes,
      status: "CONFIRMED",
      createdAt: now,
      updatedAt: now,
      allocations,
    }

    const updated = [newVoucher, ...list]
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(updated))
    return newVoucher
  },

  delete(id: string): boolean {
    const list = this.getAll()
    const filtered = list.filter((v) => v.id !== id)
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(filtered))
    return filtered.length !== list.length
  },
}
