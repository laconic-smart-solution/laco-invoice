export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOID"

export interface InvoiceItemLine {
  id: string
  orderId: string
  externalOrderId: string
  orderDate: string
  platformSkuId: string
  sellerSku: string
  productName: string
  variation?: string
  quantity: number
  unitPrice: number
  subtotal: number
  discount: number
  totalAmount: number
}

export interface InvoiceOrderSummary {
  orderId: string
  externalOrderId: string
  orderDate: string
  itemCount: number
  totalAmount: number
  vatAmount: number
  amountExVat: number
  buyerName?: string
  buyerTaxId?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  title: string
  storeId: string
  storeName: string
  marketplaceCode: string
  status: InvoiceStatus
  startDate: string
  endDate: string
  orderRunId?: string
  orderRunTitle?: string
  orderCount: number
  itemCount: number
  subtotal: number // Amount before VAT
  vatRate: number // Default 0.07 (7%)
  vatAmount: number // subtotal * 0.07
  grandTotal: number // subtotal + vatAmount
  currency: string
  notes?: string
  buyerName?: string
  buyerTaxId?: string
  buyerAddress?: string
  issuedAt: string
  paidAt?: string
  createdAt: string
  updatedAt: string
  orders: InvoiceOrderSummary[]
  items: InvoiceItemLine[]
}

export interface CreateInvoiceRequest {
  invoiceNumber?: string
  title: string
  storeId: string
  storeName: string
  marketplaceCode: string
  startDate: string
  endDate: string
  orderRunId?: string
  orderRunTitle?: string
  vatRate?: number
  notes?: string
  buyerName?: string
  buyerTaxId?: string
  buyerAddress?: string
}