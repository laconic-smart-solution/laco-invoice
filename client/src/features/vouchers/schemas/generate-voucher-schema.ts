import { z } from "zod"

import {
  DEFAULT_ERP_CURRENCY_ID,
  DEFAULT_ERP_DEPARTMENT_ID,
  VOUCHER_CATEGORIES,
  type VoucherDetail,
} from "@/features/vouchers/types/voucher"

function currentMonthValue(): string {
  return new Date().toISOString().slice(0, 7)
}

export function toMonthValue(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return ""
  }
  return isoDate.slice(0, 7)
}

export function fromMonthValue(month: string | undefined): string | null {
  const value = month?.trim() ?? ""
  if (!value) {
    return null
  }
  return /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value
}

function moneyString(message: string) {
  return z
    .string()
    .trim()
    .refine((value) => value === "" || Number.isFinite(Number(value)), message)
}

export function createGenerateVoucherSchema(messages: {
  briefRequired: string
  itemRequired: string
  accountRequired: string
  vendorRequired: string
  entryAccountRequired: string
  invalidAmount: string
  entryAmountRequired: string
  bothDebitCredit: string
  unbalanced: string
  invalidRate: string
}) {
  const entrySchema = z
    .object({
      externalErpAccountCodeId: z.string().min(1, messages.entryAccountRequired),
      debit: moneyString(messages.invalidAmount),
      credit: moneyString(messages.invalidAmount),
      invoiceNo: z.string().optional(),
      invoiceDate: z.string().optional(),
      externalErpDepartmentId: z.string().optional(),
      exchangeRate: moneyString(messages.invalidRate),
      externalErpCurrencyId: z.string().optional(),
    })
    .superRefine((entry, ctx) => {
      const debit = Number(entry.debit || 0)
      const credit = Number(entry.credit || 0)
      if (debit < 0 || credit < 0) {
        ctx.addIssue({ code: "custom", message: messages.invalidAmount, path: ["debit"] })
      }
      if (debit > 0 && credit > 0) {
        ctx.addIssue({ code: "custom", message: messages.bothDebitCredit, path: ["credit"] })
      }
      if (debit === 0 && credit === 0) {
        ctx.addIssue({ code: "custom", message: messages.entryAmountRequired, path: ["debit"] })
      }
      const rate = Number(entry.exchangeRate || 0)
      if (!Number.isFinite(rate) || rate <= 0) {
        ctx.addIssue({ code: "custom", message: messages.invalidRate, path: ["exchangeRate"] })
      }
    })

  return z
    .object({
      voucherCategory: z.enum(VOUCHER_CATEGORIES),
      voucherDate: z.string().min(1),
      taxMonth: z.string().optional(),
      whtMonth: z.string().optional(),
      voucherBrief: z.string().trim().min(1, messages.briefRequired),
      voucherDescription: z.string().optional(),
      noTaxInvoice: z.boolean(),
      rejectRemark: z.string().optional(),
      storeId: z.string().optional(),
      orderInputRunId: z.string().optional(),
      tradingPartnerTypeId: z.string().optional(),
      selectedFinanceAccountId: z.string().optional(),
      externalErpItemId: z.string().min(1, messages.itemRequired),
      externalErpAccountCodeId: z.string().min(1, messages.accountRequired),
      externalErpVendorId: z.string().min(1, messages.vendorRequired),
      externalErpDepartmentId: z.string().optional(),
      externalErpCurrencyId: z.string().optional(),
      entries: z.array(entrySchema).min(1),
    })
    .superRefine((values, ctx) => {
      const debitTotal = values.entries.reduce(
        (sum, entry) => sum + Number(entry.debit || 0),
        0
      )
      const creditTotal = values.entries.reduce(
        (sum, entry) => sum + Number(entry.credit || 0),
        0
      )
      if (Math.abs(debitTotal - creditTotal) > 0.01) {
        ctx.addIssue({ code: "custom", message: messages.unbalanced, path: ["entries"] })
      }
    })
}

export type GenerateVoucherFormValues = z.infer<
  ReturnType<typeof createGenerateVoucherSchema>
>

export function emptyVoucherEntry(
  accountId = "",
  departmentId = String(DEFAULT_ERP_DEPARTMENT_ID),
  currencyId = String(DEFAULT_ERP_CURRENCY_ID)
): GenerateVoucherFormValues["entries"][number] {
  return {
    externalErpAccountCodeId: accountId,
    debit: "",
    credit: "",
    invoiceNo: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    externalErpDepartmentId: departmentId || String(DEFAULT_ERP_DEPARTMENT_ID),
    exchangeRate: "1",
    externalErpCurrencyId: currencyId || String(DEFAULT_ERP_CURRENCY_ID),
  }
}

export function voucherToFormValues(
  voucher: VoucherDetail
): GenerateVoucherFormValues {
  const first = voucher.entries[0]
  return {
    voucherCategory: voucher.voucherCategory,
    voucherDate: voucher.voucherDate,
    taxMonth: toMonthValue(voucher.taxMonth),
    whtMonth: toMonthValue(voucher.whtMonth),
    voucherBrief: voucher.voucherBrief ?? "",
    voucherDescription: voucher.voucherDescription ?? "",
    noTaxInvoice: voucher.noTaxInvoice === true,
    rejectRemark: voucher.rejectRemark ?? "",
    storeId: voucher.storeId != null ? String(voucher.storeId) : "",
    orderInputRunId:
      voucher.orderInputRunId != null ? String(voucher.orderInputRunId) : "",
    tradingPartnerTypeId: "",
    selectedFinanceAccountId: "",
    externalErpItemId:
      voucher.externalErpItemId != null ? String(voucher.externalErpItemId) : "",
    externalErpAccountCodeId:
      voucher.externalErpAccountCodeId != null
        ? String(voucher.externalErpAccountCodeId)
        : "",
    externalErpVendorId:
      voucher.externalErpVendorId != null
        ? String(voucher.externalErpVendorId)
        : "",
    externalErpDepartmentId: String(
      first?.externalErpDepartmentId ?? DEFAULT_ERP_DEPARTMENT_ID
    ),
    externalErpCurrencyId: String(
      first?.externalErpCurrencyId ?? DEFAULT_ERP_CURRENCY_ID
    ),
    entries:
      voucher.entries.length > 0
        ? voucher.entries.map((entry) => ({
            externalErpAccountCodeId:
              entry.externalErpAccountCodeId != null
                ? String(entry.externalErpAccountCodeId)
                : "",
            debit: entry.debit ? String(entry.debit) : "",
            credit: entry.credit ? String(entry.credit) : "",
            invoiceNo: entry.invoiceNo ?? "",
            invoiceDate: entry.invoiceDate ?? "",
            externalErpDepartmentId: String(
              entry.externalErpDepartmentId ?? DEFAULT_ERP_DEPARTMENT_ID
            ),
            exchangeRate: String(entry.exchangeRate ?? 1),
            externalErpCurrencyId: String(
              entry.externalErpCurrencyId ?? DEFAULT_ERP_CURRENCY_ID
            ),
          }))
        : [emptyVoucherEntry(), emptyVoucherEntry()],
  }
}

export function defaultGenerateVoucherValues(
  defaultOrderInputRunId?: number | null
): GenerateVoucherFormValues {
  return {
    voucherCategory: "JV",
    voucherDate: new Date().toISOString().slice(0, 10),
    taxMonth: currentMonthValue(),
    whtMonth: currentMonthValue(),
    voucherBrief: "",
    voucherDescription: "",
    noTaxInvoice: false,
    rejectRemark: "",
    storeId: "",
    orderInputRunId:
      defaultOrderInputRunId != null ? String(defaultOrderInputRunId) : "",
    tradingPartnerTypeId: "",
    selectedFinanceAccountId: "",
    externalErpItemId: "",
    externalErpAccountCodeId: "",
    externalErpVendorId: "",
    externalErpDepartmentId: String(DEFAULT_ERP_DEPARTMENT_ID),
    externalErpCurrencyId: String(DEFAULT_ERP_CURRENCY_ID),
    entries: [emptyVoucherEntry(), emptyVoucherEntry()],
  }
}
