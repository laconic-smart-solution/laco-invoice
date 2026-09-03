export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID"

export type PaymentAllocationStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID"

export interface Invoice {
  id: number
  invoiceNumber: string
  title: string
  storeId: number | null
  storeName: string | null
  marketplaceId: number | null
  marketplaceCode: string | null
  status: InvoiceStatus
  startDate: string
  endDate: string
  orderRunId: number | null
  orderRunTitle: string | null
  orderCount: number
  itemCount: number
  /** Amount before VAT. */
  subtotal: number
  /** Fractional rate, e.g. 0.07 for 7%. */
  vatRate: number
  vatAmount: number
  grandTotal: number
  currency: string
  notes: string | null
  buyerName: string | null
  buyerTaxId: string | null
  buyerAddress: string | null
  issuedAt: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceOrderSummary {
  orderId: number
  externalOrderId: string
  orderDate: string
  itemCount: number
  totalAmount: number
  vatAmount: number
  amountExVat: number
  buyerName: string | null
  buyerTaxId: string | null
  totalPaidAmount: number
  remainingBalance: number
  paymentStatus: PaymentAllocationStatus
}

export interface InvoiceItemLine {
  id: number
  orderId: number | null
  externalOrderId: string
  orderDate: string
  platformSkuId: string | null
  sellerSku: string | null
  productName: string | null
  variation: string | null
  quantity: number | null
  unitPrice: number
  subtotal: number
  discount: number
  totalAmount: number
}

export interface InvoicePaymentSummary {
  invoiceId: number
  invoiceNumber: string
  invoiceTotalAmount: number
  totalPaidAmount: number
  remainingBalance: number
  status: PaymentAllocationStatus
  paidPercentage: number
}

/** Invoice header flattened together with its billed orders and line items. */
export interface InvoiceDetail extends Invoice {
  orders: InvoiceOrderSummary[]
  items: InvoiceItemLine[]
  paymentSummary: InvoicePaymentSummary
}

export interface InvoicePreview {
  orderCount: number
  itemCount: number
  subtotal: number
  vatRate: number
  vatAmount: number
  grandTotal: number
  currency: string
  skippedAlreadyBilledCount: number
}

export interface CreateInvoiceRequest {
  invoiceNumber?: string
  title: string
  storeId: number
  marketplaceCode: string
  startDate: string
  endDate: string
  orderRunId?: number
  vatRate?: number
  notes?: string
  buyerName?: string
  buyerTaxId?: string
  buyerAddress?: string
}
