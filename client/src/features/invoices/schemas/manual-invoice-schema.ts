import { z } from "zod"

import type {
  InvoiceDetail,
  ManualInvoiceRequest,
} from "@/features/invoices/types/invoice"

interface ManualInvoiceValidationMessages {
  required: string
  positive: string
  dateRange: string
  lineRequired: string
}

export function createManualInvoiceSchema(
  messages: ManualInvoiceValidationMessages
) {
  const numeric = z
    .string()
    .trim()
    .min(1, messages.required)
    .refine((value) => Number.isFinite(Number(value)), messages.positive)

  return z
    .object({
      invoiceNumber: z.string().trim().optional(),
      title: z.string().trim().min(1, messages.required),
      storeId: z.string().min(1, messages.required),
      marketplaceCode: z.string().trim().min(1, messages.required),
      startDate: z.string().min(1, messages.required),
      endDate: z.string().min(1, messages.required),
      vatRate: numeric.refine((value) => Number(value) >= 0, messages.positive),
      currency: z.string().trim().min(1, messages.required),
      notes: z.string().optional(),
      buyerName: z.string().optional(),
      buyerTaxId: z.string().optional(),
      buyerAddress: z.string().optional(),
      lines: z
        .array(
          z.object({
            productName: z.string().trim().min(1, messages.required),
            sellerSku: z.string().optional(),
            quantity: numeric.refine(
              (value) => Number(value) > 0,
              messages.positive
            ),
            unitPrice: numeric.refine(
              (value) => Number(value) >= 0,
              messages.positive
            ),
            discount: numeric.refine(
              (value) => Number(value) >= 0,
              messages.positive
            ),
          })
        )
        .min(1, messages.lineRequired),
    })
    .refine((values) => values.endDate >= values.startDate, {
      path: ["endDate"],
      message: messages.dateRange,
    })
}

export type ManualInvoiceFormValues = z.infer<
  ReturnType<typeof createManualInvoiceSchema>
>

export function emptyManualInvoiceLine(): ManualInvoiceFormValues["lines"][number] {
  return {
    productName: "",
    sellerSku: "",
    quantity: "1",
    unitPrice: "0",
    discount: "0",
  }
}

export function defaultManualInvoiceValues(): ManualInvoiceFormValues {
  const today = new Date().toISOString().slice(0, 10)
  return {
    invoiceNumber: "",
    title: "",
    storeId: "",
    marketplaceCode: "TIKTOK",
    startDate: today,
    endDate: today,
    vatRate: "0.07",
    currency: "THB",
    notes: "",
    buyerName: "",
    buyerTaxId: "",
    buyerAddress: "",
    lines: [emptyManualInvoiceLine()],
  }
}

export function manualInvoiceToFormValues(
  invoice: InvoiceDetail
): ManualInvoiceFormValues {
  return {
    invoiceNumber: invoice.invoiceNumber ?? "",
    title: invoice.title,
    storeId: invoice.storeId != null ? String(invoice.storeId) : "",
    marketplaceCode: invoice.marketplaceCode ?? "",
    startDate: invoice.startDate,
    endDate: invoice.endDate,
    vatRate: String(invoice.vatRate),
    currency: invoice.currency,
    notes: invoice.notes ?? "",
    buyerName: invoice.buyerName ?? "",
    buyerTaxId: invoice.buyerTaxId ?? "",
    buyerAddress: invoice.buyerAddress ?? "",
    lines:
      invoice.items.length > 0
        ? invoice.items.map((item) => ({
            productName: item.productName ?? "",
            sellerSku: item.sellerSku ?? "",
            quantity: String(item.quantity ?? 1),
            unitPrice: String(item.unitPrice),
            discount: String(item.discount),
          }))
        : [emptyManualInvoiceLine()],
  }
}

export function toManualInvoiceRequest(
  values: ManualInvoiceFormValues
): ManualInvoiceRequest {
  return {
    invoiceNumber: values.invoiceNumber?.trim() || undefined,
    title: values.title.trim(),
    storeId: Number(values.storeId),
    marketplaceCode: values.marketplaceCode.trim(),
    startDate: values.startDate,
    endDate: values.endDate,
    vatRate: Number(values.vatRate),
    currency: values.currency.trim(),
    notes: values.notes?.trim() || undefined,
    buyerName: values.buyerName?.trim() || undefined,
    buyerTaxId: values.buyerTaxId?.trim() || undefined,
    buyerAddress: values.buyerAddress?.trim() || undefined,
    lines: values.lines.map((line) => ({
      productName: line.productName.trim(),
      sku: line.sellerSku?.trim() || undefined,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      discount: Number(line.discount),
    })),
  }
}
