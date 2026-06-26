export type InvoiceStatus = "paid" | "pending" | "overdue" | "draft"

export type InvoiceTimelineEventType = "generated" | "synced" | "exported"

export interface InvoiceLineItem {
  id: string
  description: string
  subDescription?: string
  quantity: number
  unitPrice: number
}

export interface InvoiceTimelineEvent {
  id: string
  type: InvoiceTimelineEventType
  status: "completed" | "pending"
  timestamp?: string
  meta?: string
}

export interface InvoiceErpVoucher {
  id: string
}

export interface Invoice {
  id: string
  orderId: string
  invoiceNo: string
  subtotal: number
  vatAmount: number
  vatPercentage: number
  grandTotal: number
  status: InvoiceStatus
  pdfUrl?: string
  createdAt: string
}

export interface InvoiceListItem extends Invoice {
  externalOrderId: string
  customerName: string
  storeName: string
  marketplaceName: string
  orderDate: string
}

export interface InvoiceDetail extends InvoiceListItem {
  dueAt: string
  currency: string
  issuer: {
    name: string
    vatNumber: string
    address: string
  }
  billTo: {
    name: string
    attention: string
    address: string
  }
  lineItems: InvoiceLineItem[]
  bankDetails: {
    iban: string
    swift: string
  }
  paymentTermsDays: number
  timeline: InvoiceTimelineEvent[]
  erpVoucher?: InvoiceErpVoucher
  marketplaceMeta: {
    orderRef: string
    skuCount: number
    countryCode: string
  }
}
