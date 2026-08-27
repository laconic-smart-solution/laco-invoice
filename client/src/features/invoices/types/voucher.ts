export type PaymentMethod =
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "CASH"
  | "PLATFORM_PAYOUT"
  | "PROMPTPAY"
  | "CHEQUE"

export type VoucherStatus = "DRAFT" | "CONFIRMED" | "VOID"

export type PaymentAllocationStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID"

export interface VoucherOrderAllocation {
  id: string
  voucherId: string
  orderId: string
  externalOrderId: string
  invoiceId?: string
  invoiceNumber?: string
  orderTotalAmount: number
  allocatedAmount: number // Amount allocated from this voucher to this order
  previousPaidAmount: number // Amount paid prior to this voucher
  remainingBalance: number // orderTotalAmount - (previousPaidAmount + allocatedAmount)
  buyerName?: string
  allocatedAt: string
  notes?: string
}

export interface PaymentVoucher {
  id: string
  voucherNumber: string // e.g. "VCH-202608-001"
  date: string
  storeId: string
  storeName: string
  customerId?: string
  customerName: string
  customerTaxId?: string
  totalAmount: number // Total money received from customer
  allocatedAmount: number // Sum of allocations to orders
  unallocatedAmount: number // totalAmount - allocatedAmount (credit balance)
  paymentMethod: PaymentMethod
  bankReference?: string
  proofFileUrl?: string
  notes?: string
  status: VoucherStatus
  createdAt: string
  updatedAt: string
  allocations: VoucherOrderAllocation[]
}

export interface CreateVoucherRequest {
  voucherNumber?: string
  date: string
  storeId: string
  storeName: string
  customerName: string
  customerTaxId?: string
  totalAmount: number
  paymentMethod: PaymentMethod
  bankReference?: string
  notes?: string
  allocations: {
    orderId: string
    externalOrderId: string
    invoiceId?: string
    invoiceNumber?: string
    orderTotalAmount: number
    allocatedAmount: number
    previousPaidAmount: number
    buyerName?: string
    notes?: string
  }[]
}

export interface OrderPaymentSummary {
  orderId: string
  externalOrderId: string
  orderTotalAmount: number
  totalPaidAmount: number
  remainingBalance: number
  status: PaymentAllocationStatus
  vouchers: {
    voucherId: string
    voucherNumber: string
    date: string
    allocatedAmount: number
    paymentMethod: PaymentMethod
  }[]
}

export interface InvoicePaymentSummary {
  invoiceId: string
  invoiceNumber: string
  invoiceTotalAmount: number
  totalPaidAmount: number
  remainingBalance: number
  status: PaymentAllocationStatus
  paidPercentage: number
  voucherCount: number
}
