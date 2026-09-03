export const VOUCHER_CATEGORIES = ["APV", "ARV", "PV", "RV", "JV"] as const

export type VoucherCategory = (typeof VOUCHER_CATEGORIES)[number]

export type VoucherStatus = "DRAFT" | "GENERATED" | "POSTED" | "FAILED"

export function canEditVoucher(status: VoucherStatus): boolean {
  return status !== "POSTED"
}

export function canPostVoucherToErp(status: VoucherStatus): boolean {
  return status === "GENERATED" || status === "FAILED"
}

export interface Voucher {
  id: number
  voucherNumber: string
  voucherRefNo: string | null
  erpVoucherNo: string | null
  voucherCategory: VoucherCategory
  voucherDate: string
  taxMonth: string | null
  whtMonth: string | null
  currency: string
  chequeTransferNumber: string | null
  voucherBrief: string | null
  voucherDescription: string | null
  noTaxInvoice: boolean
  rejectRemark: string | null
  status: VoucherStatus
  storeId: number | null
  storeName: string | null
  invoiceId: number | null
  invoiceNumber: string | null
  externalErpItemId: number | null
  externalErpAccountCodeId: number | null
  externalErpVendorId: number | null
  debitTotal: number
  creditTotal: number
  generateError: string | null
  createdAt: string
  updatedAt: string
}

export interface VoucherEntry {
  id: number
  externalErpAccountCodeId: number | null
  debit: number
  credit: number
  invoiceNo: string | null
  invoiceDate: string | null
  note: string | null
  externalErpVendorId: number | null
  externalErpDepartmentId: number | null
  externalErpCurrencyId: number | null
  exchangeRate: number
}

export interface VoucherDetail extends Voucher {
  entries: VoucherEntry[]
}

export interface VoucherEntryInput {
  externalErpAccountCodeId: number
  debit: number
  credit: number
  invoiceNo?: string | null
  invoiceDate?: string | null
  note?: string | null
  externalErpVendorId?: number | null
  externalErpDepartmentId?: number | null
  externalErpCurrencyId?: number | null
  exchangeRate?: number
}

export interface GenerateVoucherRequest {
  storeId?: number | null
  invoiceId?: number | null
  voucherCategory: VoucherCategory
  voucherDate: string
  taxMonth?: string | null
  whtMonth?: string | null
  currency?: string
  chequeTransferNumber?: string | null
  voucherBrief: string
  voucherDescription?: string | null
  noTaxInvoice?: boolean
  rejectRemark?: string | null
  externalErpItemId: number
  externalErpAccountCodeId: number
  externalErpVendorId: number
  entries: VoucherEntryInput[]
}

export interface VoucherPageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    storeId?: number
    voucherNumber?: string
    voucherCategory?: VoucherCategory
    status?: VoucherStatus
  }
}

export interface ErpLookupRecord {
  id: number
  code: string
  name: string
}

export const DEFAULT_ERP_DEPARTMENT_ID = 1
export const DEFAULT_ERP_CURRENCY_ID = 1
