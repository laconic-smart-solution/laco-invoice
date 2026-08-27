import type { CreateInvoiceRequest, Invoice, InvoiceItemLine, InvoiceOrderSummary, InvoiceStatus } from "../types/invoice"

const STORAGE_KEY = "laco_invoices_data_v1"

function generateMockOrdersAndItems(count: number, baseDate: string): { orders: InvoiceOrderSummary[]; items: InvoiceItemLine[] } {
  const orders: InvoiceOrderSummary[] = []
  const items: InvoiceItemLine[] = []

  const sampleProducts = [
    { name: "【KINBATA】 Oxygen Bleach ผงฟอกผ้าขาวขจัดคราบฝังแน่น", sku: "N-706", price: 330, disc: 128.77 },
    { name: "【KINBATA】 Fabric Stain Cleaner 1.1kg", sku: "N-545", price: 478, disc: 189.30 },
    { name: "Multi-purpose Kitchen Decontamination Wipes", sku: "K-102", price: 159, disc: 40.00 },
    { name: "Japanese Glass & Window Cleaner 500ml", sku: "G-880", price: 219, disc: 60.00 },
    { name: "Anti-mite Bed Sheet Laundry Detergent", sku: "A-301", price: 389, disc: 99.00 },
  ]

  for (let i = 1; i <= count; i++) {
    const orderId = `584${Math.floor(100000000000000 + Math.random() * 900000000000000)}`
    const product = sampleProducts[i % sampleProducts.length]
    const qty = 1 + (i % 3)
    const lineSubtotal = product.price * qty
    const lineDiscount = product.disc * qty
    const lineTotal = lineSubtotal - lineDiscount
    const vat = Number((lineTotal * 0.07).toFixed(2))
    const exVat = Number((lineTotal - vat).toFixed(2))

    orders.push({
      orderId,
      externalOrderId: orderId,
      orderDate: baseDate,
      itemCount: qty,
      totalAmount: lineTotal,
      vatAmount: vat,
      amountExVat: exVat,
      buyerName: `Customer #${1000 + i}`,
      buyerTaxId: i % 4 === 0 ? `010555${Math.floor(1000000 + Math.random() * 9000000)}` : undefined,
    })

    items.push({
      id: `item-${i}`,
      orderId,
      externalOrderId: orderId,
      orderDate: baseDate,
      platformSkuId: `SKU-${1730000000000000000 + i}`,
      sellerSku: product.sku,
      productName: product.name,
      variation: qty > 1 ? `${qty} PCs Pack` : "1 PC Standard",
      quantity: qty,
      unitPrice: product.price,
      subtotal: lineSubtotal,
      discount: lineDiscount,
      totalAmount: lineTotal,
    })
  }

  return { orders, items }
}

const INITIAL_INVOICES: Invoice[] = [
  (() => {
    const { orders, items } = generateMockOrdersAndItems(441, "2026-08-15")
    const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const vatRate = 0.07
    const subtotal = Number((grandTotal / (1 + vatRate)).toFixed(2))
    const vatAmount = Number((grandTotal - subtotal).toFixed(2))

    return {
      id: "inv-2026-08-01",
      invoiceNumber: "INV-202608-001",
      title: "Yoik August",
      storeId: "1",
      storeName: "Tiktok Shop (1) By Dev Alvin",
      marketplaceCode: "TIKTOK",
      status: "ISSUED",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      orderRunId: "22",
      orderRunTitle: "Yoik August",
      orderCount: 441,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      vatRate,
      vatAmount,
      grandTotal,
      currency: "THB",
      notes: "Consolidated monthly marketplace invoice for Yoik August batch.",
      buyerName: "Yoik Global Trading Co., Ltd.",
      buyerTaxId: "0105559876543",
      buyerAddress: "88/12 Sukhumvit Rd, Khlong Toei, Bangkok 10110, Thailand",
      issuedAt: "2026-08-26T10:00:00Z",
      createdAt: "2026-08-26T10:00:00Z",
      updatedAt: "2026-08-26T10:00:00Z",
      orders,
      items,
    }
  })(),
  (() => {
    const { orders, items } = generateMockOrdersAndItems(185, "2026-07-20")
    const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const vatRate = 0.07
    const subtotal = Number((grandTotal / (1 + vatRate)).toFixed(2))
    const vatAmount = Number((grandTotal - subtotal).toFixed(2))

    return {
      id: "inv-2026-07-01",
      invoiceNumber: "INV-202607-004",
      title: "July Settlement Batch 2",
      storeId: "1",
      storeName: "Tiktok Shop (1) By Dev Alvin",
      marketplaceCode: "TIKTOK",
      status: "PAID",
      startDate: "2026-07-15",
      endDate: "2026-07-31",
      orderCount: 185,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      vatRate,
      vatAmount,
      grandTotal,
      currency: "THB",
      notes: "Settled and verified against bank receipt.",
      buyerName: "Yoik Global Trading Co., Ltd.",
      buyerTaxId: "0105559876543",
      issuedAt: "2026-08-01T09:30:00Z",
      paidAt: "2026-08-05T14:20:00Z",
      createdAt: "2026-08-01T09:30:00Z",
      updatedAt: "2026-08-05T14:20:00Z",
      orders,
      items,
    }
  })(),
]

export const invoiceLocalService = {
  getAll(): Invoice[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {
      // ignore
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INVOICES))
    return INITIAL_INVOICES
  },

  getById(id: string): Invoice | undefined {
    const list = this.getAll()
    return list.find((inv) => inv.id === id || inv.invoiceNumber === id)
  },

  isInvoiceNumberTaken(invoiceNumber: string, excludeId?: string): boolean {
    const list = this.getAll()
    const target = invoiceNumber.trim().toLowerCase()
    return list.some((i) => i.id !== excludeId && i.invoiceNumber.trim().toLowerCase() === target)
  },

  getNextInvoiceNumber(): string {
    const list = this.getAll()
    const now = new Date()
    const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-`
    let nextIdx = list.length + 1
    let candidate = `${prefix}${String(nextIdx).padStart(3, "0")}`
    while (this.isInvoiceNumberTaken(candidate)) {
      nextIdx++
      candidate = `${prefix}${String(nextIdx).padStart(3, "0")}`
    }
    return candidate
  },

  create(req: CreateInvoiceRequest): Invoice {
    const list = this.getAll()
    const candidateNumber = req.invoiceNumber?.trim() || this.getNextInvoiceNumber()
    if (this.isInvoiceNumberTaken(candidateNumber)) {
      throw new Error(`Invoice number "${candidateNumber}" already exists. Please choose a unique number.`)
    }

    const count = req.orderRunTitle?.includes("Yoik") ? 441 : Math.floor(25 + Math.random() * 100)
    const { orders, items } = generateMockOrdersAndItems(count, req.startDate)
    const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const vatRate = req.vatRate ?? 0.07
    const subtotal = Number((grandTotal / (1 + vatRate)).toFixed(2))
    const vatAmount = Number((grandTotal - subtotal).toFixed(2))

    const now = new Date().toISOString()
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: candidateNumber,
      title: req.title || `${req.storeName} Invoice`,
      storeId: req.storeId,
      storeName: req.storeName,
      marketplaceCode: req.marketplaceCode,
      status: "ISSUED",
      startDate: req.startDate,
      endDate: req.endDate,
      orderRunId: req.orderRunId,
      orderRunTitle: req.orderRunTitle,
      orderCount: count,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      vatRate,
      vatAmount,
      grandTotal,
      currency: "THB",
      notes: req.notes,
      buyerName: req.buyerName || "Yoik Global Trading Co., Ltd.",
      buyerTaxId: req.buyerTaxId || "0105559876543",
      buyerAddress: req.buyerAddress || "88/12 Sukhumvit Rd, Khlong Toei, Bangkok 10110, Thailand",
      issuedAt: now,
      createdAt: now,
      updatedAt: now,
      orders,
      items,
    }

    const updated = [newInvoice, ...list]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newInvoice
  },

  updateInvoiceNumber(id: string, invoiceNumber: string): Invoice {
    const list = this.getAll()
    const trimmed = invoiceNumber.trim()
    if (!trimmed) {
      throw new Error("Invoice number cannot be empty")
    }
    if (this.isInvoiceNumberTaken(trimmed, id)) {
      throw new Error(`Invoice number "${trimmed}" already exists. Please choose a unique number.`)
    }
    const idx = list.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error("Invoice not found")
    list[idx] = {
      ...list[idx],
      invoiceNumber: trimmed,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return list[idx]
  },

  updateStatus(id: string, status: InvoiceStatus): Invoice | undefined {
    const list = this.getAll()
    const idx = list.findIndex((i) => i.id === id)
    if (idx === -1) return undefined
    list[idx] = {
      ...list[idx],
      status,
      paidAt: status === "PAID" ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return list[idx]
  },

  delete(id: string): boolean {
    const list = this.getAll()
    const filtered = list.filter((i) => i.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered.length !== list.length
  },
}