export type InvoiceStatus = "ISSUED" | "VOID"

export interface InvoiceLineItem {
  id: string
  sku: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface InvoiceListItem {
  id: string
  orderId: string
  invoiceNo: string
  storeName: string
  marketplaceCode: string
  customerName: string
  currency: string
  grandTotal: number
  vatPercentage: number
  status: InvoiceStatus
  issuedAt: string | null
  pdfUrl?: string
}

export interface InvoiceDetail extends InvoiceListItem {
  subtotal: number
  vatAmount: number
  shippingFee: number
  externalOrderId: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  lineItems: InvoiceLineItem[]
  createdAt: string | null
}

export interface InvoicePageRequest {
  pageNumber: number
  pageSize: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    status?: InvoiceStatus
    storeId?: number
    invoiceNo?: string
    orderId?: number
  }
}

export interface InvoiceStats {
  issuedCount: number
  voidedCount: number
  issuedGrandTotal: number
}
