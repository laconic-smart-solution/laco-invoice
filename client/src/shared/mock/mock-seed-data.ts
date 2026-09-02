import type { Customer } from "@/features/customers/types/customer"
import type {
  Invoice,
  InvoiceItemLine,
  InvoiceOrderSummary,
} from "@/features/invoices/types/invoice"
import type { PaymentVoucher } from "@/features/invoices/types/voucher"
import type {
  MarketplaceProduct,
  MarketplaceProductDetail,
  MarketplaceProductSource,
  MarketplaceProductSyncRun,
} from "@/features/products/types/product"
import type { Store } from "@/features/stores/types/store"
import type { AdminUser } from "@/features/users/types/user"
import type { ApiOrderImportFileDto } from "@/shared/services/order-import-file.service"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"
import type { MarketplaceConnection } from "@/features/stores/types/store"

const NOW = "2024-06-15T10:00:00Z"

export const MOCK_MARKETPLACES = [
  { id: 1, code: "LAZADA" as const, name: "Lazada" },
  { id: 2, code: "SHOPEE" as const, name: "Shopee" },
  { id: 3, code: "TIKTOK" as const, name: "TikTok Shop" },
]

function buildStores(): Store[] {
  return [
    {
      id: 1,
      ownerId: 1,
      name: "TikTok Shop US",
      logoUrl: null,
      active: true,
      createdAt: NOW,
    },
    {
      id: 2,
      ownerId: 1,
      name: "TikTok Shop UK",
      logoUrl: null,
      active: true,
      createdAt: NOW,
    },
    {
      id: 3,
      ownerId: 1,
      name: "Lazada Thailand",
      logoUrl: null,
      active: true,
      createdAt: NOW,
    },
  ]
}

function buildCustomers(): Customer[] {
  const names = [
    "Marcus Thompson",
    "Elena Rodriguez",
    "James Chen",
    "Sarah Johnson",
    "David Kim",
    "Priya Patel",
    "Oliver Wright",
    "Hannah Lee",
    "Carlos Mendez",
    "Aisha Khan",
  ]

  return Array.from({ length: 48 }, (_, index) => {
    const name = names[index % names.length]
    const slug = name.toLowerCase().replace(/\s+/g, ".")
    const storeId = (index % 3) + 1
    const marketplaceId = storeId === 3 ? 1 : 3

    return {
      id: index + 1,
      storeId,
      storeName: buildStores()[storeId - 1]?.name ?? null,
      marketplaceId,
      marketplaceCode: marketplaceId === 1 ? "LAZADA" : "TIKTOK",
      externalCustomerId: `CUST-${10000 + index}`,
      name,
      email: `${slug}@example.com`,
      phone: `+66 81 ${String(100 + (index % 900)).padStart(3, "0")} ${String(1000 + index).padStart(4, "0")}`,
      gender: index % 2 === 0 ? "female" : "male",
      address: `${index + 10} Sukhumvit Road, Bangkok`,
      createdAt: NOW,
      updatedAt: NOW,
    }
  })
}

function buildUsers(): AdminUser[] {
  const roles: AdminUser["role"][] = ["ADMIN", "OWNER", "MANAGER", "STAFF"]
  return Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    email: `user${index + 1}@example.com`,
    authServerUserId: `mock-auth-${index + 1}`,
    fullName: `Mock User ${index + 1}`,
    role: roles[index % roles.length],
    active: index % 5 !== 0,
    createdAt: NOW,
    updatedAt: NOW,
  }))
}

function buildProducts(): MarketplaceProduct[] {
  const skus = ["WEP-001", "SWB-014", "UCC-220", "PSH-088", "PPB-512"]
  const names = [
    "Wireless Earbuds Pro",
    "Smart Watch Band",
    "USB-C Charging Cable",
    "Phone Stand Holder",
    "Portable Power Bank",
  ]

  return Array.from({ length: 36 }, (_, index) => {
    const storeId = (index % 3) + 1
    const marketplaceCode = storeId === 3 ? "LAZADA" : "TIKTOK"
    const sku = skus[index % skus.length]
    const name = names[index % names.length]

    return {
      id: index + 1,
      storeId,
      storeName: buildStores()[storeId - 1]?.name ?? "Store",
      marketplaceCode,
      marketplaceName: marketplaceCode,
      externalProductId: `EXT-${10000 + index}`,
      sku,
      name,
      price: String(99 + (index % 20) * 15),
      currency: marketplaceCode === "LAZADA" ? "THB" : "USD",
      status: "ACTIVE",
      erpStatus: index % 4 === 0 ? "unmapped" : "synced",
    }
  })
}

function buildProductDetail(product: MarketplaceProduct): MarketplaceProductDetail {
  return {
    id: product.id,
    storeId: product.storeId,
    storeName: product.storeName,
    marketplaceCode: product.marketplaceCode,
    marketplaceName: product.marketplaceName,
    externalProductId: product.externalProductId,
    sku: product.sku,
    name: product.name,
    description: `Mock description for ${product.name}`,
    price: product.price,
    currency: product.currency,
    status: product.status,
    images: [],
    variants: [
      {
        sku: product.sku,
        price: product.price,
        currency: product.currency,
        status: product.status,
        quantity: "100",
      },
    ],
    erp: {
      status: product.erpStatus === "synced" ? "MAPPED" : "UNMAPPED",
      localProductId: product.erpStatus === "synced" ? product.id : null,
      erpItemId: product.erpStatus === "synced" ? product.id * 10 : null,
      erpSku: product.erpStatus === "synced" ? `ERP-${product.sku}` : null,
      erpName: product.erpStatus === "synced" ? product.name : null,
      mappedAt: product.erpStatus === "synced" ? NOW : null,
    },
  }
}

function buildProductSources(): MarketplaceProductSource[] {
  return buildStores().flatMap((store) => {
    const marketplaceCode = store.id === 3 ? "LAZADA" : "TIKTOK"
    return {
      storeId: store.id,
      storeName: store.name,
      marketplaceCode,
      marketplaceName: marketplaceCode,
      externalConnectionId: `conn-${store.id}-${marketplaceCode}`,
      label: `${store.name} — ${marketplaceCode}`,
      country: store.id === 3 ? "TH" : "US",
      lastSyncedAt: NOW,
      syncStatus: "COMPLETED" as const,
    }
  })
}

function buildImportFiles(): ApiOrderImportFileDto[] {
  return Array.from({ length: 18 }, (_, index) => {
    const storeId = (index % 3) + 1
    const marketplaceId = storeId === 3 ? 1 : 3
    const status: ApiOrderImportFileDto["status"] =
      index % 7 === 0 ? "FAILED" : index % 5 === 0 ? "PARTIAL" : "COMPLETED"

    return {
      id: index + 1,
      storeId,
      storeName: buildStores()[storeId - 1]?.name ?? null,
      marketplaceId,
      marketplaceCode: marketplaceId === 1 ? "LAZADA" : "TIKTOK",
      originalFilename: `orders-import-${index + 1}.xlsx`,
      sheetName: "Order SKU list",
      rowCount: 50 + index * 3,
      importedOrders: 20 + index,
      importedItems: 40 + index * 2,
      status,
      createdAt: NOW,
      updatedAt: NOW,
    }
  })
}

function buildInputRuns(): ApiOrderInputRunDto[] {
  const statuses: ApiOrderInputRunDto["status"][] = [
    "DRAFT",
    "RUNNING",
    "COMPLETED",
    "PARTIAL",
    "FAILED",
  ]

  return Array.from({ length: 8 }, (_, index) => {
    const storeId = (index % 3) + 1
    const marketplaceId = storeId === 3 ? 1 : 3
    const status = statuses[index % statuses.length]
    const inputFileType = index % 2 === 0 ? "SHIPPING_FEE" : "SERVICE_FEE"
    const isShipping = inputFileType === "SHIPPING_FEE"
    const hasFile = index > 0

    return {
      id: index + 1,
      storeId,
      storeName: buildStores()[storeId - 1]?.name ?? null,
      marketplaceId,
      marketplaceCode: marketplaceId === 1 ? "LAZADA" : "TIKTOK",
      title: `Input run ${index + 1}`,
      inputFileType,
      status,
      orderDetailFilename: isShipping && hasFile ? `order-detail-${index}.xlsx` : null,
      orderDetailSize: isShipping && hasFile ? 12000 + index * 100 : null,
      orderDetailStatus: isShipping && hasFile ? "SUCCEEDED" : "MISSING",
      orderDetailError: null,
      orderDetailStartedAt: isShipping && hasFile ? NOW : null,
      orderDetailFinishedAt: isShipping && hasFile ? NOW : null,
      orderDetailBatchId: isShipping && hasFile ? index : null,
      orderDetailImportFileId: isShipping && hasFile ? index : null,
      withdrawFilename: !isShipping && hasFile ? `withdraw-${index}.xlsx` : null,
      withdrawSize: !isShipping && hasFile ? 8000 : null,
      withdrawStatus: !isShipping && hasFile ? "SUCCEEDED" : "MISSING",
      withdrawError: null,
      withdrawStartedAt: !isShipping && hasFile ? NOW : null,
      withdrawFinishedAt: !isShipping && hasFile ? NOW : null,
      withdrawRowCount: !isShipping && hasFile ? 25 : null,
      withdrawMatchedCount: !isShipping && hasFile ? 20 : null,
      withdrawUnmatchedCount: !isShipping && hasFile ? 5 : null,
      invoicePdfFilename: hasFile ? `invoice-${index + 1}.pdf` : null,
      invoicePdfSize: hasFile ? 48000 : null,
      invoicePdfStatus: hasFile ? "READY" : "MISSING",
      invoicePdfError: null,
      invoiceReceiptNumber: hasFile ? "THJV202610002306645" : null,
      invoiceReceiptDate: hasFile ? "2026-05-26" : null,
      invoicePeriodStart: hasFile ? "2026-05-20" : null,
      invoicePeriodEnd: hasFile ? "2026-05-26" : null,
      invoiceIssuerName: hasFile ? "Thai Happy Logistics Ltd." : null,
      invoiceIssuerTaxId: hasFile ? "0105566107906" : null,
      invoiceBuyerName: hasFile ? "Lian Feng Co., Ltd." : null,
      invoiceBuyerTaxId: hasFile ? "0115565023667" : null,
      invoiceTotalAmount: hasFile ? 1918 : null,
      invoiceWithholdingTaxAmount: hasFile ? 19.18 : null,
      invoiceWithholdingTaxRate: hasFile ? 0.01 : null,
      excelMatchedAmount: hasFile ? 1918 : null,
      invoiceMatchStatus: hasFile ? "MATCHED" : "MISSING",
      invoiceMatchDifference: hasFile ? 0 : null,
      orderCount: isShipping ? 15 + index : null,
      itemCount: isShipping ? 30 + index * 2 : null,
      createdAt: NOW,
      updatedAt: NOW,
    }
  })
}

function buildConnections(storeId: number, marketplaceCode: string): MarketplaceConnection[] {
  if (storeId <= 0) {
    return []
  }

  return [
    {
      marketplaceCode: marketplaceCode as MarketplaceConnection["marketplaceCode"],
      localConnectionId: storeId,
      externalConnectionId: `ext-conn-${storeId}-${marketplaceCode}`,
      storeId,
      sellerId: `seller-${storeId}`,
      displayName: `Mock ${marketplaceCode} Shop`,
      country: storeId === 3 ? "TH" : "US",
      account: `account-${storeId}`,
      shortCode: `S${storeId}`,
      tokenExpiresAt: "2025-12-31T00:00:00Z",
      refreshExpiresAt: "2026-06-30T00:00:00Z",
      status: "CONNECTED",
      createdAt: NOW,
    },
  ]
}

export interface MockInvoiceRecord {
  invoice: Invoice
  orders: InvoiceOrderSummary[]
  items: InvoiceItemLine[]
}

interface MockState {
  stores: Store[]
  customers: Customer[]
  users: AdminUser[]
  products: MarketplaceProduct[]
  productSources: MarketplaceProductSource[]
  importFiles: ApiOrderImportFileDto[]
  inputRuns: ApiOrderInputRunDto[]
  syncRuns: MarketplaceProductSyncRun[]
  invoices: MockInvoiceRecord[]
  vouchers: PaymentVoucher[]
  nextCustomerId: number
  nextUserId: number
  nextStoreId: number
  nextInputRunId: number
  nextInvoiceId: number
  nextInvoiceItemId: number
  nextVoucherId: number
  nextAllocationId: number
}

function buildInvoices(): MockInvoiceRecord[] {
  return [
    {
      invoice: {
        id: 1,
        invoiceNumber: "INV-202609-001",
        title: "TikTok Shop US — October 2023",
        storeId: 1,
        storeName: "TikTok Shop US",
        marketplaceId: 3,
        marketplaceCode: "TIKTOK",
        status: "ISSUED",
        startDate: "2023-10-01",
        endDate: "2023-10-31",
        orderRunId: null,
        orderRunTitle: null,
        orderCount: 3,
        itemCount: 5,
        subtotal: 11682.24,
        vatRate: 0.07,
        vatAmount: 817.76,
        grandTotal: 12500,
        currency: "THB",
        notes: "Mock seeded invoice for development.",
        buyerName: "Marcus Thompson",
        buyerTaxId: "0105558123456",
        buyerAddress: "100 Market Street, San Francisco",
        issuedAt: NOW,
        paidAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
      orders: [
        {
          orderId: 1,
          externalOrderId: "#TK-8942-01",
          orderDate: "2023-10-01",
          itemCount: 2,
          totalAmount: 4200,
          vatAmount: 274.77,
          amountExVat: 3925.23,
          buyerName: "Marcus Thompson",
          buyerTaxId: "0105558123456",
          totalPaidAmount: 0,
          remainingBalance: 4200,
          paymentStatus: "UNPAID",
        },
        {
          orderId: 4,
          externalOrderId: "#TK-8945-04",
          orderDate: "2023-10-04",
          itemCount: 3,
          totalAmount: 5100,
          vatAmount: 333.64,
          amountExVat: 4766.36,
          buyerName: "James Chen",
          buyerTaxId: null,
          totalPaidAmount: 0,
          remainingBalance: 5100,
          paymentStatus: "UNPAID",
        },
        {
          orderId: 7,
          externalOrderId: "#TK-8948-07",
          orderDate: "2023-10-07",
          itemCount: 2,
          totalAmount: 3200,
          vatAmount: 209.35,
          amountExVat: 2990.65,
          buyerName: "Oliver Wright",
          buyerTaxId: "0105559988776",
          totalPaidAmount: 0,
          remainingBalance: 3200,
          paymentStatus: "UNPAID",
        },
      ],
      items: [
        {
          id: 1,
          orderId: 1,
          externalOrderId: "#TK-8942-01",
          orderDate: "2023-10-01",
          platformSkuId: "WEP-001",
          sellerSku: "WEP-001",
          productName: "Wireless Earbuds Pro",
          variation: "Black",
          quantity: 2,
          unitPrice: 1500,
          subtotal: 3000,
          discount: 0,
          totalAmount: 3000,
        },
        {
          id: 2,
          orderId: 1,
          externalOrderId: "#TK-8942-01",
          orderDate: "2023-10-01",
          platformSkuId: "SWB-014",
          sellerSku: "SWB-014",
          productName: "Smart Watch Band",
          variation: null,
          quantity: 1,
          unitPrice: 1200,
          subtotal: 1200,
          discount: 0,
          totalAmount: 1200,
        },
        {
          id: 3,
          orderId: 4,
          externalOrderId: "#TK-8945-04",
          orderDate: "2023-10-04",
          platformSkuId: "UCC-220",
          sellerSku: "UCC-220",
          productName: "USB-C Charging Cable",
          variation: "1.5m",
          quantity: 3,
          unitPrice: 900,
          subtotal: 2700,
          discount: 0,
          totalAmount: 2700,
        },
        {
          id: 4,
          orderId: 4,
          externalOrderId: "#TK-8945-04",
          orderDate: "2023-10-04",
          platformSkuId: "PSH-088",
          sellerSku: "PSH-088",
          productName: "Phone Stand Holder",
          variation: null,
          quantity: 2,
          unitPrice: 1200,
          subtotal: 2400,
          discount: 0,
          totalAmount: 2400,
        },
        {
          id: 5,
          orderId: 7,
          externalOrderId: "#TK-8948-07",
          orderDate: "2023-10-07",
          platformSkuId: "PPB-512",
          sellerSku: "PPB-512",
          productName: "Portable Power Bank",
          variation: "White",
          quantity: 2,
          unitPrice: 1600,
          subtotal: 3200,
          discount: 0,
          totalAmount: 3200,
        },
      ],
    },
    {
      invoice: {
        id: 2,
        invoiceNumber: "INV-202609-002",
        title: "Lazada Thailand — October 2023",
        storeId: 3,
        storeName: "Lazada Thailand",
        marketplaceId: 1,
        marketplaceCode: "LAZADA",
        status: "DRAFT",
        startDate: "2023-10-01",
        endDate: "2023-10-31",
        orderRunId: 3,
        orderRunTitle: "Input run 3",
        orderCount: 2,
        itemCount: 3,
        subtotal: 5607.48,
        vatRate: 0.07,
        vatAmount: 392.52,
        grandTotal: 6000,
        currency: "THB",
        notes: null,
        buyerName: "Elena Rodriguez",
        buyerTaxId: null,
        buyerAddress: null,
        issuedAt: null,
        paidAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
      orders: [
        {
          orderId: 3,
          externalOrderId: "#TK-8944-03",
          orderDate: "2023-10-03",
          itemCount: 2,
          totalAmount: 3500,
          vatAmount: 228.97,
          amountExVat: 3271.03,
          buyerName: "Elena Rodriguez",
          buyerTaxId: null,
          totalPaidAmount: 0,
          remainingBalance: 3500,
          paymentStatus: "UNPAID",
        },
        {
          orderId: 6,
          externalOrderId: "#TK-8947-06",
          orderDate: "2023-10-06",
          itemCount: 2,
          totalAmount: 2500,
          vatAmount: 163.55,
          amountExVat: 2336.45,
          buyerName: "Priya Patel",
          buyerTaxId: "0105557001122",
          totalPaidAmount: 0,
          remainingBalance: 2500,
          paymentStatus: "UNPAID",
        },
      ],
      items: [
        {
          id: 6,
          orderId: 3,
          externalOrderId: "#TK-8944-03",
          orderDate: "2023-10-03",
          platformSkuId: "WEP-001",
          sellerSku: "WEP-001",
          productName: "Wireless Earbuds Pro",
          variation: null,
          quantity: 1,
          unitPrice: 2000,
          subtotal: 2000,
          discount: 0,
          totalAmount: 2000,
        },
        {
          id: 7,
          orderId: 3,
          externalOrderId: "#TK-8944-03",
          orderDate: "2023-10-03",
          platformSkuId: "SWB-014",
          sellerSku: "SWB-014",
          productName: "Smart Watch Band",
          variation: "Navy",
          quantity: 1,
          unitPrice: 1500,
          subtotal: 1500,
          discount: 0,
          totalAmount: 1500,
        },
        {
          id: 8,
          orderId: 6,
          externalOrderId: "#TK-8947-06",
          orderDate: "2023-10-06",
          platformSkuId: "UCC-220",
          sellerSku: "UCC-220",
          productName: "USB-C Charging Cable",
          variation: null,
          quantity: 2,
          unitPrice: 1250,
          subtotal: 2500,
          discount: 0,
          totalAmount: 2500,
        },
      ],
    },
  ]
}

function buildVouchers(): PaymentVoucher[] {
  return [
    {
      id: 1,
      voucherNumber: "VCH-202609-001",
      date: "2024-06-10",
      storeId: 1,
      storeName: "TikTok Shop US",
      customerName: "Marcus Thompson",
      customerTaxId: "0105558123456",
      totalAmount: 5000,
      allocatedAmount: 5000,
      unallocatedAmount: 0,
      paymentMethod: "BANK_TRANSFER",
      bankReference: "TRF-482910",
      proofFileUrl: null,
      notes: "Partial settlement for INV-202609-001",
      status: "CONFIRMED",
      createdAt: NOW,
      updatedAt: NOW,
      allocations: [
        {
          id: 1,
          voucherId: 1,
          orderId: 1,
          externalOrderId: "#TK-8942-01",
          invoiceId: 1,
          invoiceNumber: "INV-202609-001",
          orderTotalAmount: 4200,
          allocatedAmount: 4200,
          previousPaidAmount: 0,
          remainingBalance: 0,
          buyerName: "Marcus Thompson",
          allocatedAt: NOW,
          notes: null,
        },
        {
          id: 2,
          voucherId: 1,
          orderId: 4,
          externalOrderId: "#TK-8945-04",
          invoiceId: 1,
          invoiceNumber: "INV-202609-001",
          orderTotalAmount: 5100,
          allocatedAmount: 800,
          previousPaidAmount: 0,
          remainingBalance: 4300,
          buyerName: "James Chen",
          allocatedAt: NOW,
          notes: null,
        },
      ],
    },
  ]
}

function createInitialState(): MockState {
  const stores = buildStores()
  const products = buildProducts()

  return {
    stores,
    customers: buildCustomers(),
    users: buildUsers(),
    products,
    productSources: buildProductSources(),
    importFiles: buildImportFiles(),
    inputRuns: buildInputRuns(),
    syncRuns: [],
    invoices: buildInvoices(),
    vouchers: buildVouchers(),
    nextCustomerId: 100,
    nextUserId: 100,
    nextStoreId: stores.length + 1,
    nextInputRunId: 100,
    nextInvoiceId: 3,
    nextInvoiceItemId: 9,
    nextVoucherId: 2,
    nextAllocationId: 3,
  }
}

let state = createInitialState()

export function getMockState(): MockState {
  return state
}

export function resetMockState(): void {
  state = createInitialState()
}

export function getStoreById(id: number): Store | undefined {
  return state.stores.find((s) => s.id === id)
}

export function getCustomerById(id: number): Customer | undefined {
  return state.customers.find((c) => c.id === id)
}

export function getUserById(id: number): AdminUser | undefined {
  return state.users.find((u) => u.id === id)
}

export function getProductById(id: number): MarketplaceProduct | undefined {
  return state.products.find((p) => p.id === id)
}

export function getProductDetailById(id: number): MarketplaceProductDetail | null {
  const product = getProductById(id)
  return product ? buildProductDetail(product) : null
}

export function getImportFileById(id: number): ApiOrderImportFileDto | undefined {
  return state.importFiles.find((f) => f.id === id)
}

export function getInputRunById(id: number): ApiOrderInputRunDto | undefined {
  return state.inputRuns.find((r) => r.id === id)
}

export function getConnections(storeId: number, marketplaceCode: string): MarketplaceConnection[] {
  return buildConnections(storeId, marketplaceCode)
}
