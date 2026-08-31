import type {
  CreateVoucherRequest,
  InvoicePaymentSummary,
  OrderPaymentSummary,
  PaymentAllocationStatus,
  PaymentVoucher,
  VoucherOrderAllocation,
} from "../types/voucher"

const VOUCHER_STORAGE_KEY = "laco_payment_vouchers_v2"

// Clean legacy dummy voucher keys
try {
  localStorage.removeItem("laco_payment_vouchers_v1")
} catch {
  // ignore
}

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
    return []
  },

  getById(id: string): PaymentVoucher | undefined {
    const list = this.getAll()
    return list.find((v) => v.id === id || v.voucherNumber === id)
  },

  getByInvoiceId(invoiceId: string): PaymentVoucher[] {
    const list = this.getAll()
    return list.filter((v) => v.allocations && v.allocations.some((a) => a.invoiceId === invoiceId))
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

  create(req: CreateVoucherRequest): PaymentVoucher {
    const list = this.getAll()
    const candidateNumber = req.voucherNumber?.trim() || this.getNextVoucherNumber()
    if (this.isVoucherNumberTaken(candidateNumber)) {
      throw new Error(`Voucher number "${candidateNumber}" already exists. Please choose a unique number.`)
    }

    const now = new Date().toISOString()
    const voucherId = `vch-${Date.now()}`

    const allocations: VoucherOrderAllocation[] = (req.allocations || []).map((a, idx) => ({
      id: `alloc-${Date.now()}-${idx}`,
      voucherId,
      orderId: a.orderId,
      externalOrderId: a.externalOrderId || a.orderId,
      invoiceId: a.invoiceId,
      invoiceNumber: a.invoiceNumber,
      orderTotalAmount: a.orderTotalAmount,
      allocatedAmount: a.allocatedAmount,
      previousPaidAmount: a.previousPaidAmount,
      remainingBalance: Math.max(0, a.orderTotalAmount - (a.previousPaidAmount + a.allocatedAmount)),
      buyerName: a.buyerName || "Customer",
      allocatedAt: now,
      notes: a.notes,
    }))

    const allocatedAmount = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
    const unallocatedAmount = Math.max(0, req.totalAmount - allocatedAmount)

    const newVoucher: PaymentVoucher = {
      id: voucherId,
      voucherNumber: candidateNumber,
      date: req.date || now.split("T")[0],
      storeId: req.storeId,
      storeName: req.storeName,
      customerName: req.customerName,
      customerTaxId: req.customerTaxId,
      totalAmount: req.totalAmount,
      allocatedAmount,
      unallocatedAmount,
      paymentMethod: req.paymentMethod || "BANK_TRANSFER",
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

  getInvoicePaymentSummary(invoiceId: string, invoiceGrandTotal: number, invoiceNumber = ""): InvoicePaymentSummary {
    const vouchers = this.getByInvoiceId(invoiceId)
    const totalPaidAmount = vouchers.reduce((sum, v) => {
      const matchAlloc = (v.allocations || [])
        .filter((a) => a.invoiceId === invoiceId)
        .reduce((acc, a) => acc + a.allocatedAmount, 0)
      return sum + matchAlloc
    }, 0)

    const remainingBalance = Math.max(0, invoiceGrandTotal - totalPaidAmount)
    let status: PaymentAllocationStatus = "UNPAID"
    if (totalPaidAmount >= invoiceGrandTotal && invoiceGrandTotal > 0) {
      status = "PAID"
    } else if (totalPaidAmount > 0) {
      status = "PARTIAL"
    }

    const paidPercentage = invoiceGrandTotal > 0 ? Math.min(100, Math.round((totalPaidAmount / invoiceGrandTotal) * 100)) : 0

    return {
      invoiceId,
      invoiceNumber,
      invoiceTotalAmount: invoiceGrandTotal,
      totalPaidAmount,
      remainingBalance,
      status,
      paidPercentage,
      voucherCount: vouchers.length,
    }
  },

  getOrderPaymentSummary(orderId: string, orderTotal: number, externalOrderId = ""): OrderPaymentSummary {
    const list = this.getAll()
    const matchingAllocations: VoucherOrderAllocation[] = []
    const matchingVouchers: {
      voucherId: string
      voucherNumber: string
      date: string
      allocatedAmount: number
      paymentMethod: any
    }[] = []

    for (const v of list) {
      for (const a of v.allocations || []) {
        if (a.orderId === orderId || a.externalOrderId === orderId) {
          matchingAllocations.push(a)
          matchingVouchers.push({
            voucherId: v.id,
            voucherNumber: v.voucherNumber,
            date: v.date,
            allocatedAmount: a.allocatedAmount,
            paymentMethod: v.paymentMethod,
          })
        }
      }
    }

    const totalPaidAmount = matchingAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
    const remainingBalance = Math.max(0, orderTotal - totalPaidAmount)
    let status: PaymentAllocationStatus = "UNPAID"
    if (totalPaidAmount >= orderTotal && orderTotal > 0) {
      status = "PAID"
    } else if (totalPaidAmount > 0) {
      status = "PARTIAL"
    }

    return {
      orderId,
      externalOrderId: externalOrderId || orderId,
      orderTotalAmount: orderTotal,
      totalPaidAmount,
      remainingBalance,
      status,
      vouchers: matchingVouchers,
    }
  },

  clearAll(): void {
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify([]))
  }
}
