import type {
  InvoiceDetail,
  InvoiceListItem,
  InvoiceStatus,
  InvoiceTimelineEvent,
} from "@/features/invoices/types/invoice"

export const MOCK_INVOICES_TOTAL = 1842

const STORES = [
  { id: "1", name: "TikTok Shop US" },
  { id: "2", name: "TikTok Shop UK" },
  { id: "3", name: "Shopify Main Store" },
] as const

const MARKETPLACES = [
  { id: "1", name: "TikTok Shop", code: "tiktok" },
  { id: "2", name: "TikTok Shop", code: "tiktok" },
  { id: "3", name: "Shopify Global", code: "shopify" },
] as const

const CUSTOMERS = [
  { name: "Marcus Thompson", address: "1200 Commerce Blvd, Austin, TX 78701" },
  { name: "Aurora Design Systems Inc.", address: "Palo Alto, CA 94301" },
  { name: "James Chen", address: "88 Market Street, Singapore 048948" },
  { name: "Sarah Johnson", address: "45 King St W, Toronto, ON M5H 2C3" },
  { name: "David Kim", address: "Seoul, South Korea 04524" },
  { name: "Priya Patel", address: "Mumbai, Maharashtra 400001" },
  { name: "Oliver Wright", address: "London, EC2A 4NE, United Kingdom" },
  { name: "Hannah Lee", address: "Berlin, 10115, Germany" },
] as const

const LINE_ITEM_TEMPLATES = [
  {
    description: "Advanced Marketplace Connector — Annual License",
    subDescription: "Multi-store synchronization and order routing",
  },
  {
    description: "Custom API Integration (Tier 2)",
    subDescription: "Inventory sync and webhook automation",
  },
  {
    description: "Priority Cloud Support (12 Months)",
    subDescription: "SLA response within 4 business hours",
  },
  {
    description: "Marketplace Order Processing Pack",
    subDescription: "Bulk invoicing and tax calculation module",
  },
] as const

function getInvoiceStatus(index: number): InvoiceStatus {
  const mod = index % 10
  if (mod < 5) return "paid"
  if (mod < 7) return "pending"
  if (mod < 9) return "overdue"
  return "draft"
}

function buildLineItems(globalIndex: number) {
  const count = (globalIndex % 3) + 2

  return Array.from({ length: count }, (_, itemIndex) => {
    const template = LINE_ITEM_TEMPLATES[(globalIndex + itemIndex) % LINE_ITEM_TEMPLATES.length]
    const quantity = itemIndex === 1 ? 2 : 1
    const unitPrice = 350 + ((globalIndex + itemIndex) % 5) * 275

    return {
      id: `${globalIndex + 1}-${itemIndex + 1}`,
      description: template.description,
      subDescription: template.subDescription,
      quantity,
      unitPrice,
    }
  })
}

function buildTimeline(
  globalIndex: number,
  createdAt: string,
  status: InvoiceStatus
): InvoiceTimelineEvent[] {
  const synced = status === "paid" || status === "overdue"
  const exported = status === "paid"

  return [
    {
      id: "generated",
      type: "generated",
      status: "completed",
      timestamp: createdAt,
      meta: `ID-${globalIndex + 1}`,
    },
    {
      id: "synced",
      type: "synced",
      status: synced ? "completed" : "pending",
      timestamp: synced ? createdAt : undefined,
      meta: synced ? "API Active" : undefined,
    },
    {
      id: "exported",
      type: "exported",
      status: exported ? "completed" : "pending",
      timestamp: exported ? createdAt : undefined,
    },
  ]
}

function buildMockInvoice(globalIndex: number): InvoiceDetail {
  const store = STORES[globalIndex % STORES.length]
  const marketplace = MARKETPLACES[globalIndex % MARKETPLACES.length]
  const customer = CUSTOMERS[globalIndex % CUSTOMERS.length]
  const lineItems = buildLineItems(globalIndex)
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const vatPercentage = marketplace.code === "shopify" ? 21 : 8
  const vatAmount = subtotal * (vatPercentage / 100)
  const grandTotal = subtotal + vatAmount
  const status = getInvoiceStatus(globalIndex)
  const orderNumericId = String(globalIndex + 1)
  const externalOrderId = `#TK-${8942 + globalIndex}-${String((globalIndex % 99) + 1).padStart(2, "0")}`
  const day = (globalIndex % 24) + 1
  const month = globalIndex % 2 === 0 ? 6 : 10
  const year = 2026
  const createdAt = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T10:24:00Z`
  const dueAt = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:59Z`
  const currency = marketplace.code === "shopify" ? "EUR" : "USD"

  return {
    id: String(globalIndex + 1),
    orderId: orderNumericId,
    invoiceNo: `INV-${year}${String(month).padStart(2, "0")}-${String(globalIndex + 1).padStart(6, "0")}`,
    externalOrderId,
    customerName: customer.name,
    storeName: store.name,
    marketplaceName: marketplace.name,
    orderDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    subtotal,
    vatAmount,
    vatPercentage,
    grandTotal,
    status,
    currency,
    pdfUrl:
      status === "paid" || status === "overdue"
        ? `/invoices/pdf/${globalIndex + 1}.pdf`
        : undefined,
    createdAt,
    dueAt,
    issuer: {
      name: "Laco Global Marketplace",
      vatNumber: "ES-B12345678",
      address: "Calle de la Innovación 42, 28001 Madrid, Spain",
    },
    billTo: {
      name: customer.name,
      attention: "Finance Department",
      address: customer.address,
    },
    lineItems,
    bankDetails: {
      iban: "ES91 2100 0418 4502 0005 1332",
      swift: "CAIXESBBXXX",
    },
    paymentTermsDays: 30,
    timeline: buildTimeline(globalIndex, createdAt, status),
    erpVoucher:
      status === "paid" || status === "overdue"
        ? { id: `VOU-${99281 + globalIndex}-B` }
        : undefined,
    marketplaceMeta: {
      orderRef: externalOrderId.replace("#", ""),
      skuCount: 8 + (globalIndex % 6),
      countryCode: ["US", "DE", "UK", "SG"][globalIndex % 4],
    },
  }
}

export function getMockInvoiceById(id: string): InvoiceDetail | null {
  const index = Number.parseInt(id, 10)

  if (!Number.isFinite(index) || index < 1 || index > MOCK_INVOICES_TOTAL) {
    return null
  }

  return buildMockInvoice(index - 1)
}

export function getMockInvoicesPage(page: number, limit: number): InvoiceListItem[] {
  const offset = (page - 1) * limit
  const count = Math.min(limit, Math.max(MOCK_INVOICES_TOTAL - offset, 0))

  return Array.from({ length: count }, (_, index) =>
    buildMockInvoice(offset + index)
  )
}

export const INVOICE_STATUS_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.status_all" },
  { value: "paid", labelKey: "status.paid" },
  { value: "pending", labelKey: "status.pending" },
  { value: "overdue", labelKey: "status.overdue" },
  { value: "draft", labelKey: "status.draft" },
] as const

export const INVOICE_MARKETPLACE_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.marketplace_all" },
  { value: "tiktok", labelKey: "filters.marketplace_tiktok" },
  { value: "shopify", labelKey: "filters.marketplace_shopify" },
  { value: "amazon", labelKey: "filters.marketplace_amazon" },
] as const
