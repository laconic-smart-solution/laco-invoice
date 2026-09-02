export type PaymentMethod =
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "CASH"
  | "PLATFORM_PAYOUT"
  | "PROMPTPAY"
  | "CHEQUE"

export type VoucherStatus = "DRAFT" | "CONFIRMED" | "VOID"

export interface VoucherOrderAllocation {
  id: number
  voucherId: number
  orderId: number | null
  externalOrderId: string
  invoiceId: number | null
  invoiceNumber: string | null
  orderTotalAmount: number
  /** Amount allocated from this voucher to this order. */
  allocatedAmount: number
  /** Amount paid on the order before this voucher. */
  previousPaidAmount: number
  remainingBalance: number
  buyerName: string | null
  allocatedAt: string
  notes: string | null
}

export interface PaymentVoucher {
  id: number
  voucherNumber: string
  date: string
  storeId: number | null
  storeName: string | null
  customerName: string | null
  customerTaxId: string | null
  /** Total money received from the customer. */
  totalAmount: number
  allocatedAmount: number
  /** Credit balance left after allocations. */
  unallocatedAmount: number
  paymentMethod: PaymentMethod
  bankReference: string | null
  proofFileUrl: string | null
  notes: string | null
  status: VoucherStatus
  createdAt: string
  updatedAt: string
  allocations: VoucherOrderAllocation[]
}

export interface CreateVoucherRequest {
  voucherNumber?: string
  date: string
  storeId: number
  customerName?: string
  customerTaxId?: string
  totalAmount: number
  paymentMethod: PaymentMethod
  bankReference?: string
  notes?: string
  allocations: {
    orderId: number
    invoiceId?: number
    allocatedAmount: number
    notes?: string
  }[]
}
