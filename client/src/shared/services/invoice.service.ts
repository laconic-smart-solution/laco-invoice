import { apiClient } from "@/app/api/client"
import type {
  InvoiceDetail,
  InvoiceListItem,
  InvoicePageRequest,
  InvoiceStatus,
} from "@/features/invoices/types/invoice"
import type { ApiResponse } from "@/shared/types/api-response"

export interface ApiInvoiceDto {
  id: number
  orderId: number | null
  invoiceNo: string
  subtotal: number
  vatAmount: number
  vatPercentage: number
  grandTotal: number
  status: InvoiceStatus
  pdfUrl: string | null
  issuedAt: string | null
  createdAt: string | null
}

export interface ApiInvoiceListItemDto {
  id: number
  orderId: number | null
  invoiceNo: string
  storeName: string | null
  marketplaceCode: string | null
  customerName: string | null
  currency: string | null
  grandTotal: number
  vatPercentage: number | null
  status: InvoiceStatus
  issuedAt: string | null
}

export interface ApiInvoiceLineItemDto {
  id: number
  sku: string | null
  productName: string | null
  price: number
  quantity: number
  lineTotal: number
}

export interface ApiInvoiceDetailDto {
  invoice: ApiInvoiceDto
  storeId: number | null
  storeName: string | null
  marketplaceCode: string | null
  externalOrderId: string | null
  currency: string | null
  shippingFee: number | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  customerAddress: string | null
  items: ApiInvoiceLineItemDto[]
}

function mapListItem(dto: ApiInvoiceListItemDto): InvoiceListItem {
  return {
    id: String(dto.id),
    orderId: dto.orderId != null ? String(dto.orderId) : "",
    invoiceNo: dto.invoiceNo,
    storeName: dto.storeName?.trim() || "—",
    marketplaceCode: dto.marketplaceCode?.trim() || "—",
    customerName: dto.customerName?.trim() || "—",
    currency: dto.currency?.trim().toUpperCase() || "THB",
    grandTotal: dto.grandTotal,
    vatPercentage: dto.vatPercentage ?? 7,
    status: dto.status,
    issuedAt: dto.issuedAt,
    pdfUrl: `/api/v1/invoices/${dto.id}/pdf`,
  }
}

export function mapInvoiceDetail(dto: ApiInvoiceDetailDto): InvoiceDetail {
  const inv = dto.invoice
  return {
    id: String(inv.id),
    orderId: inv.orderId != null ? String(inv.orderId) : "",
    invoiceNo: inv.invoiceNo,
    storeName: dto.storeName?.trim() || "—",
    marketplaceCode: dto.marketplaceCode?.trim() || "—",
    customerName: dto.customerName?.trim() || "—",
    currency: dto.currency?.trim().toUpperCase() || "THB",
    grandTotal: inv.grandTotal,
    vatPercentage: inv.vatPercentage ?? 7,
    status: inv.status,
    issuedAt: inv.issuedAt,
    pdfUrl: inv.pdfUrl ?? `/api/v1/invoices/${inv.id}/pdf`,
    subtotal: inv.subtotal,
    vatAmount: inv.vatAmount,
    shippingFee: dto.shippingFee ?? 0,
    externalOrderId: dto.externalOrderId?.trim() || "—",
    customerEmail: dto.customerEmail?.trim() || "—",
    customerPhone: dto.customerPhone?.trim() || "—",
    customerAddress: dto.customerAddress?.trim() || "—",
    lineItems: (dto.items ?? []).map((item) => ({
      id: String(item.id),
      sku: item.sku?.trim() || "—",
      productName: item.productName?.trim() || "—",
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.lineTotal,
    })),
    createdAt: inv.createdAt,
  }
}

export const invoiceService = {
  pageInvoices: async (request: InvoicePageRequest) => {
    const response = await apiClient.post<ApiResponse<ApiInvoiceListItemDto[]>>(
      "/v1/invoices/pageable",
      request
    )
    return {
      ...response.data,
      data: (response.data.data ?? []).map(mapListItem),
    }
  },

  getInvoice: async (id: number) => {
    const response = await apiClient.get<ApiResponse<ApiInvoiceDetailDto>>(
      `/v1/invoices/${id}`
    )
    return mapInvoiceDetail(response.data.data)
  },

  generateForOrder: async (orderId: number) => {
    const response = await apiClient.post<ApiResponse<ApiInvoiceDto>>(
      `/v1/orders/${orderId}/invoices`
    )
    return response.data.data
  },

  voidInvoice: async (id: number) => {
    const response = await apiClient.patch<ApiResponse<ApiInvoiceDto>>(
      `/v1/invoices/${id}/void`
    )
    return response.data.data
  },

  downloadPdf: async (id: number, filename?: string) => {
    const response = await apiClient.get<Blob>(`/v1/invoices/${id}/pdf`, {
      responseType: "blob",
    })
    const blob = response.data
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename ?? `invoice-${id}.pdf`
    anchor.click()
    URL.revokeObjectURL(url)
  },
}
