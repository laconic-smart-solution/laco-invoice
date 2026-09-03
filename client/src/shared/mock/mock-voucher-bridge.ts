import {
  DEFAULT_ERP_CURRENCY_ID,
  DEFAULT_ERP_DEPARTMENT_ID,
  type GenerateVoucherRequest,
  type Voucher,
  type VoucherCategory,
  type VoucherDetail,
  type VoucherEntry,
  type VoucherPageRequest,
  type VoucherStatus,
} from "@/features/vouchers/types/voucher"
import { MockApiError } from "@/shared/mock/mock-invoice-bridge"
import {
  requireMockErpAccount,
  requireMockErpCurrency,
  requireMockErpDepartment,
  requireMockErpItem,
  requireMockErpVendor,
} from "@/shared/mock/mock-erp-catalog"
import { getMockState, getStoreById } from "@/shared/mock/mock-seed-data"
import { paginateArray } from "@/shared/mock/mock-utils"

function nowIso(): string {
  return new Date().toISOString()
}

function money(value: number): number {
  return Math.round(value * 100) / 100
}

function periodPrefix(category: VoucherCategory): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${category}-${now.getFullYear()}${month}-`
}

function nextVoucherNumber(category: VoucherCategory): string {
  const prefix = periodPrefix(category)
  const maxSuffix = getMockState()
    .vouchers.map((voucher) => voucher.voucherNumber)
    .filter((number) => number.toUpperCase().startsWith(prefix))
    .map((number) => Number.parseInt(number.slice(prefix.length), 10))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 0)
  return `${prefix}${String(maxSuffix + 1).padStart(3, "0")}`
}

function totals(entries: VoucherEntry[]): { debitTotal: number; creditTotal: number } {
  return {
    debitTotal: money(entries.reduce((sum, entry) => sum + entry.debit, 0)),
    creditTotal: money(entries.reduce((sum, entry) => sum + entry.credit, 0)),
  }
}

export function pageMockVouchers(request: VoucherPageRequest) {
  const filter = request.filter
  let items = [...getMockState().vouchers]
  if (filter?.storeId != null) {
    items = items.filter((voucher) => voucher.storeId === filter.storeId)
  }
  if (filter?.voucherNumber) {
    const query = filter.voucherNumber.toLowerCase()
    items = items.filter((voucher) => voucher.voucherNumber.toLowerCase().includes(query))
  }
  if (filter?.voucherCategory) {
    items = items.filter((voucher) => voucher.voucherCategory === filter.voucherCategory)
  }
  if (filter?.status) {
    items = items.filter((voucher) => voucher.status === filter.status)
  }
  items.sort((a, b) => b.id - a.id)
  const page = paginateArray(items, request.pageNumber, request.pageSize)
  return {
    data: page.data.map(toListVoucher),
    meta: page.meta,
  }
}

export function getMockVoucherDetail(id: number): { voucher: Voucher; entries: VoucherEntry[] } {
  const record = getMockState().vouchers.find((voucher) => voucher.id === id)
  if (!record) {
    throw new MockApiError(404, `Voucher not found: id=${id}`)
  }
  return {
    voucher: toListVoucher(record),
    entries: record.entries,
  }
}

export function generateMockVoucher(request: GenerateVoucherRequest): Voucher {
  requireMockErpItem(request.externalErpItemId)
  requireMockErpAccount(request.externalErpAccountCodeId)
  requireMockErpVendor(request.externalErpVendorId)

  if (!request.entries?.length) {
    throw new MockApiError(400, "At least one entry is required.")
  }

  const state = getMockState()
  const store = request.storeId != null ? getStoreById(request.storeId) : undefined
  const now = nowIso()
  const voucherNumber = nextVoucherNumber(request.voucherCategory)

  const entries: VoucherEntry[] = request.entries.map((line) => {
    requireMockErpAccount(line.externalErpAccountCodeId)
    const debit = money(line.debit ?? 0)
    const credit = money(line.credit ?? 0)
    if (debit < 0 || credit < 0) {
      throw new MockApiError(400, "Debit and credit must be zero or positive.")
    }
    if (debit > 0 && credit > 0) {
      throw new MockApiError(400, "An entry cannot have both debit and credit amounts.")
    }
    if (debit === 0 && credit === 0) {
      throw new MockApiError(400, "Each entry must have a debit or credit amount.")
    }
    const departmentId = line.externalErpDepartmentId ?? DEFAULT_ERP_DEPARTMENT_ID
    requireMockErpDepartment(departmentId)
    const currencyId = line.externalErpCurrencyId ?? DEFAULT_ERP_CURRENCY_ID
    requireMockErpCurrency(currencyId)
    const exchangeRate = line.exchangeRate ?? 1
    if (exchangeRate <= 0) {
      throw new MockApiError(400, "Exchange rate must be greater than zero.")
    }
    return {
      id: state.nextVoucherEntryId++,
      externalErpAccountCodeId: line.externalErpAccountCodeId,
      debit,
      credit,
      invoiceNo: line.invoiceNo ?? null,
      invoiceDate: line.invoiceDate ?? null,
      note: line.note ?? null,
      externalErpVendorId: line.externalErpVendorId ?? request.externalErpVendorId,
      externalErpDepartmentId: departmentId,
      externalErpCurrencyId: currencyId,
      exchangeRate,
    }
  })

  const { debitTotal, creditTotal } = totals(entries)
  if (Math.abs(debitTotal - creditTotal) > 0.01) {
    throw new MockApiError(
      400,
      `Voucher entries are not balanced. Debit ${debitTotal} vs credit ${creditTotal}.`
    )
  }

  const voucher: VoucherDetail = {
    id: state.nextVoucherId++,
    voucherNumber,
    voucherRefNo: null,
    erpVoucherNo: voucherNumber,
    voucherCategory: request.voucherCategory,
    voucherDate: request.voucherDate,
    taxMonth: request.taxMonth ?? null,
    whtMonth: request.whtMonth ?? null,
    currency: request.currency ?? "THB",
    chequeTransferNumber: request.chequeTransferNumber ?? null,
    voucherBrief: request.voucherBrief,
    voucherDescription: request.voucherDescription ?? null,
    noTaxInvoice: request.noTaxInvoice === true,
    rejectRemark: request.rejectRemark ?? null,
    status: "GENERATED" satisfies VoucherStatus,
    storeId: store?.id ?? null,
    storeName: store?.name ?? null,
    invoiceId: request.invoiceId ?? null,
    invoiceNumber: null,
    externalErpItemId: request.externalErpItemId,
    externalErpAccountCodeId: request.externalErpAccountCodeId,
    externalErpVendorId: request.externalErpVendorId,
    debitTotal,
    creditTotal,
    generateError: null,
    createdAt: now,
    updatedAt: now,
    entries,
  }

  state.vouchers.unshift(voucher)
  return toListVoucher(voucher)
}

export function updateMockVoucher(id: number, request: GenerateVoucherRequest): Voucher {
  const state = getMockState()
  const index = state.vouchers.findIndex((voucher) => voucher.id === id)
  if (index < 0) {
    throw new MockApiError(404, `Voucher not found: id=${id}`)
  }
  const current = state.vouchers[index]
  if (current.status === "POSTED") {
    throw new MockApiError(400, "Posted vouchers cannot be edited.")
  }
  requireMockErpItem(request.externalErpItemId)
  requireMockErpAccount(request.externalErpAccountCodeId)
  requireMockErpVendor(request.externalErpVendorId)
  if (!request.entries?.length) {
    throw new MockApiError(400, "At least one entry is required.")
  }

  const store = request.storeId != null ? getStoreById(request.storeId) : undefined
  const now = nowIso()
  const entries: VoucherEntry[] = request.entries.map((line) => {
    requireMockErpAccount(line.externalErpAccountCodeId)
    const debit = money(line.debit ?? 0)
    const credit = money(line.credit ?? 0)
    if (debit < 0 || credit < 0) {
      throw new MockApiError(400, "Debit and credit must be zero or positive.")
    }
    if (debit > 0 && credit > 0) {
      throw new MockApiError(400, "An entry cannot have both debit and credit amounts.")
    }
    if (debit === 0 && credit === 0) {
      throw new MockApiError(400, "Each entry must have a debit or credit amount.")
    }
    const departmentId = line.externalErpDepartmentId ?? DEFAULT_ERP_DEPARTMENT_ID
    requireMockErpDepartment(departmentId)
    const currencyId = line.externalErpCurrencyId ?? DEFAULT_ERP_CURRENCY_ID
    requireMockErpCurrency(currencyId)
    const exchangeRate = line.exchangeRate ?? 1
    if (exchangeRate <= 0) {
      throw new MockApiError(400, "Exchange rate must be greater than zero.")
    }
    return {
      id: state.nextVoucherEntryId++,
      externalErpAccountCodeId: line.externalErpAccountCodeId,
      debit,
      credit,
      invoiceNo: line.invoiceNo ?? null,
      invoiceDate: line.invoiceDate ?? null,
      note: line.note ?? null,
      externalErpVendorId: line.externalErpVendorId ?? request.externalErpVendorId,
      externalErpDepartmentId: departmentId,
      externalErpCurrencyId: currencyId,
      exchangeRate,
    }
  })

  const { debitTotal, creditTotal } = totals(entries)
  if (Math.abs(debitTotal - creditTotal) > 0.01) {
    throw new MockApiError(
      400,
      `Voucher entries are not balanced. Debit ${debitTotal} vs credit ${creditTotal}.`
    )
  }

  const nextStatus: VoucherStatus =
    current.status === "FAILED" ? "GENERATED" : current.status
  const updated: VoucherDetail = {
    ...current,
    voucherCategory: request.voucherCategory,
    voucherDate: request.voucherDate,
    taxMonth: request.taxMonth ?? null,
    whtMonth: request.whtMonth ?? null,
    currency: request.currency ?? current.currency,
    chequeTransferNumber: request.chequeTransferNumber ?? null,
    voucherBrief: request.voucherBrief,
    voucherDescription: request.voucherDescription ?? null,
    noTaxInvoice: request.noTaxInvoice === true,
    rejectRemark: request.rejectRemark ?? null,
    status: nextStatus,
    storeId: store?.id ?? null,
    storeName: store?.name ?? null,
    invoiceId: request.invoiceId ?? current.invoiceId,
    externalErpItemId: request.externalErpItemId,
    externalErpAccountCodeId: request.externalErpAccountCodeId,
    externalErpVendorId: request.externalErpVendorId,
    debitTotal,
    creditTotal,
    generateError: nextStatus === "GENERATED" ? null : current.generateError,
    updatedAt: now,
    entries,
  }
  state.vouchers[index] = updated
  return toListVoucher(updated)
}

export function postMockVoucherToErp(id: number): Voucher {
  const record = getMockState().vouchers.find((voucher) => voucher.id === id)
  if (!record) {
    throw new MockApiError(404, `Voucher not found: id=${id}`)
  }
  if (record.status === "POSTED") {
    throw new MockApiError(400, "Voucher is already posted to ERP.")
  }
  if (record.status === "DRAFT") {
    throw new MockApiError(400, "Generate the voucher before posting to ERP.")
  }
  record.status = "POSTED"
  record.generateError = null
  record.erpVoucherNo = record.erpVoucherNo ?? record.voucherNumber
  record.updatedAt = nowIso()
  return toListVoucher(record)
}

function toListVoucher(record: VoucherDetail): Voucher {
  const { entries: _entries, ...voucher } = record
  return voucher
}
