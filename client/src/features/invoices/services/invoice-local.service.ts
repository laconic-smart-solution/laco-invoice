import type { CreateInvoiceRequest, Invoice, InvoiceItemLine, InvoiceOrderSummary, InvoiceStatus } from "../types/invoice"

const STORAGE_KEY = "laco_invoices_data_v2"

function generateMockOrdersAndItems(count: number, baseDate: string): { orders: InvoiceOrderSummary[]; items: InvoiceItemLine[] } {
  const orders: InvoiceOrderSummary[] = []
  const items: InvoiceItemLine[] = []

  const sampleProducts = [
    { name: "【KINBATA】 Oxygen Bleach ผงซักผ้าขจัดคราบ", sku: "N-706", price: 330, disc: 128.77 },
    { name: "【KINBATA】 Fabric Stain Cleaner 1.1kg", sku: "N-545", price: 478, disc: 189.30 },
    { name: "Multi-purpose Kitchen Decontamination Wipes", sku: "K-102", price: 159, disc: 40.00 },
    { name: "Japanese Glass & Window Cleaner 500ml", sku: "G-880", price: 219, disc: 60.00 },
    { name: "Anti-mite Bed Sheet Laundry Detergent", sku: "A-301", price: 389, disc: 99.00 },
  ]

  for (let i = 1; i <= count; i++) {
    const orderId = `584${Math.floor(100000000000000 + (i * 123456789) % 900000000000000)}`
    const product = sampleProducts[i % sampleProducts.length]
    const qty = 1 + (i % 3)
    const lineSubtotal = product.price * qty
    const lineDiscount = product.disc * qty
    const lineTotal = Number((lineSubtotal - lineDiscount).toFixed(2))
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
      buyerTaxId: i % 4 === 0 ? `010555${Math.floor(1000000 + (i * 987654) % 9000000)}` : undefined,
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

function ensureInvoiceHasMockData(inv: Invoice): Invoice {
  if (inv.orders && inv.orders.length > 0) {
    return inv
  }

  const count = (inv.title && inv.title.includes("Yoik")) || (inv.orderRunTitle && inv.orderRunTitle.includes("Yoik")) ? 441 : 185
  const baseDate = inv.startDate || new Date().toISOString().slice(0, 10)
  const { orders, items } = generateMockOrdersAndItems(count, baseDate)
  const grandTotal = Number(orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2))
  const vatRate = inv.vatRate ?? 0.07
  const subtotal = Number((grandTotal / (1 + vatRate)).toFixed(2))
  const vatAmount = Number((grandTotal - subtotal).toFixed(2))

  return {
    ...inv,
    orderCount: count,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
    orders,
    items,
  }
}

export const invoiceLocalService = {
  getAll(): Invoice[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const list: Invoice[] = JSON.parse(stored)
        let modified = false
        const enriched = list.map((inv) => {
          const updated = ensureInvoiceHasMockData(inv)
          if (updated !== inv) modified = true
          return updated
        })
        if (modified) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched))
        }
        return enriched
      }
    } catch {
      // ignore
    }
    return []
  },

  getById(id: string): Invoice | undefined {
    const list = this.getAll()
    const found = list.find((inv) => inv.id === id || inv.invoiceNumber === id)
    if (!found) return undefined
    return ensureInvoiceHasMockData(found)
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

    const count = (req.title && req.title.includes("Yoik")) || (req.orderRunTitle && req.orderRunTitle.includes("Yoik")) ? 441 : 185
    const baseDate = req.startDate || new Date().toISOString().slice(0, 10)
    const { orders, items } = generateMockOrdersAndItems(count, baseDate)
    const grandTotal = Number(orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2))
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

  updateStatus(id: string, status: InvoiceStatus): Invoice | undefined {
    const list = this.getAll()
    const idx = list.findIndex((i) => i.id === id)
    if (idx === -1) return undefined
    list[idx] = {
      ...list[idx],
      status,
      paidAt: status === "PAID" ? new Date().toISOString() : list[idx].paidAt,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    return list[idx]
  },

  updateInvoiceNumber(id: string, newInvoiceNumber: string): Invoice | undefined {
    const trimmed = newInvoiceNumber.trim()
    if (!trimmed) {
      throw new Error("Invoice number cannot be empty")
    }
    if (this.isInvoiceNumberTaken(trimmed, id)) {
      throw new Error(`Invoice number "${trimmed}" is already in use by another invoice.`)
    }
    const list = this.getAll()
    const idx = list.findIndex((i) => i.id === id)
    if (idx === -1) return undefined
    list[idx] = {
      ...list[idx],
      invoiceNumber: trimmed,
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
