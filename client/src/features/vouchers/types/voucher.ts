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
  orderInputRunId?: number | null
  orderInputRunTitle?: string | null
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
  orderInputRunId?: number | null
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

export interface ErpItemFinanceAccount {
  tradingPartnerTypeId: number
  tradingPartnerTypeCode: string
  tradingPartnerTypeName: string
  budget?: boolean
  purchaseAccountId?: number | null
  purchaseAccountCode?: string | null
  purchaseAccountTitle?: string | null
  saleAccountId?: number | null
  saleAccountCode?: string | null
  saleAccountTitle?: string | null
  goodsInTransitAccountId?: number | null
  goodsInTransitAccountCode?: string | null
  goodsInTransitAccountTitle?: string | null
  depositAccountId?: number | null
  depositAccountCode?: string | null
  depositAccountTitle?: string | null
  assigned?: boolean
}

export interface VoucherPreviewRequest {
  orderInputRunId: number
  externalErpItemId?: number | null
  tradingPartnerTypeId?: number | null
  debitAccountId?: number | null
  creditAccountId?: number | null
  accountType?: string | null
  externalErpVendorId?: number | null
  externalErpDepartmentId?: number | null
  externalErpCurrencyId?: number | null
  noTaxInvoice?: boolean
}

export interface VoucherPreviewDto {
  storeId?: number | null
  storeName?: string | null
  orderInputRunId?: number | null
  orderInputRunTitle?: string | null
  voucherCategory: VoucherCategory
  voucherDate: string
  taxMonth?: string | null
  whtMonth?: string | null
  currency: string
  voucherBrief: string
  voucherDescription?: string | null
  noTaxInvoice?: boolean
  externalErpItemId: number
  itemCode?: string | null
  itemName?: string | null
  externalErpAccountCodeId: number
  accountCode?: string | null
  accountTitle?: string | null
  externalErpVendorId: number
  vendorCode?: string | null
  vendorName?: string | null
  externalErpDepartmentId?: number | null
  externalErpCurrencyId?: number | null
  totalAmount: number
  debitTotal: number
  creditTotal: number
  entries: VoucherEntryInput[]
  financeAccounts: ErpItemFinanceAccount[]
}

export interface VoucherPageFilter {
  storeId?: number
  voucherNumber?: string
  voucherCategory?: VoucherCategory
  status?: VoucherStatus
}

export interface VoucherPageRequest {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: VoucherPageFilter
}

export type VoucherExportFilter = VoucherPageFilter

export interface VoucherExportRequest {
  ids?: number[]
  exportAll?: boolean
  filter?: VoucherExportFilter
}

export interface ErpLookupRecord {
  id: number
  code: string
  name: string
}

export const DEFAULT_ERP_DEPARTMENT_ID = 1
export const DEFAULT_ERP_CURRENCY_ID = 1
