import type { ErpLookupRecord } from "@/features/vouchers/types/voucher"

export const MOCK_ERP_ITEMS: ErpLookupRecord[] = [
  { id: 1001, code: "FG-SHIP-FEE", name: "Shipping Fee Service" },
  { id: 1002, code: "FG-COMMISSION", name: "Marketplace Commission" },
  { id: 1003, code: "FG-ADS", name: "Advertising Fee" },
]

export const MOCK_ERP_ACCOUNTS: ErpLookupRecord[] = [
  { id: 2101, code: "2101-000", name: "Accounts Payable" },
  { id: 2102, code: "2102-000", name: "Accrued Expenses" },
  { id: 1101, code: "1101-000", name: "Bank - Kasikorn" },
  { id: 4101, code: "4101-000", name: "Sales Revenue" },
  { id: 5101, code: "5101-000", name: "Shipping Expense" },
  { id: 5102, code: "5102-000", name: "Commission Expense" },
]

export const MOCK_ERP_VENDORS: ErpLookupRecord[] = [
  { id: 501, code: "V-TIKTOK", name: "TikTok Shop (Thailand)" },
  { id: 502, code: "V-LAZADA", name: "Lazada Seller Services" },
  { id: 503, code: "V-SHOPEE", name: "Shopee (Thailand)" },
]

export const MOCK_ERP_DEPARTMENTS: ErpLookupRecord[] = [
  { id: 1, code: "N/A", name: "N/A" },
  { id: 2, code: "AC", name: "Accounting" },
  { id: 3, code: "SA", name: "Sales" },
  { id: 4, code: "WH", name: "Warehouse" },
]

export const MOCK_ERP_CURRENCIES: ErpLookupRecord[] = [
  { id: 1, code: "THB", name: "Thai Baht" },
  { id: 2, code: "USD", name: "US Dollar" },
  { id: 3, code: "JPY", name: "Japanese Yen" },
  { id: 4, code: "EUR", name: "Euro" },
]

function matches(search: string | undefined, code: string, name: string): boolean {
  const query = search?.trim().toLowerCase()
  if (!query) {
    return true
  }
  return code.toLowerCase().includes(query) || name.toLowerCase().includes(query)
}

export function listMockErpItems(search?: string): ErpLookupRecord[] {
  return MOCK_ERP_ITEMS.filter((item) => matches(search, item.code, item.name))
}

export function listMockErpAccounts(search?: string): ErpLookupRecord[] {
  return MOCK_ERP_ACCOUNTS.filter((item) => matches(search, item.code, item.name))
}

export function listMockErpVendors(search?: string): ErpLookupRecord[] {
  return MOCK_ERP_VENDORS.filter((item) => matches(search, item.code, item.name))
}

export function listMockErpDepartments(search?: string): ErpLookupRecord[] {
  return MOCK_ERP_DEPARTMENTS.filter((item) => matches(search, item.code, item.name))
}

export function listMockErpCurrencies(search?: string): ErpLookupRecord[] {
  return MOCK_ERP_CURRENCIES.filter((item) => matches(search, item.code, item.name))
}

export function requireMockErpItem(id: number): ErpLookupRecord {
  const item = MOCK_ERP_ITEMS.find((record) => record.id === id)
  if (!item) {
    throw new Error(`ERP item not found: id=${id}`)
  }
  return item
}

export function requireMockErpAccount(id: number): ErpLookupRecord {
  const item = MOCK_ERP_ACCOUNTS.find((record) => record.id === id)
  if (!item) {
    throw new Error(`ERP account not found: id=${id}`)
  }
  return item
}

export function requireMockErpVendor(id: number): ErpLookupRecord {
  const item = MOCK_ERP_VENDORS.find((record) => record.id === id)
  if (!item) {
    throw new Error(`ERP vendor not found: id=${id}`)
  }
  return item
}

export function requireMockErpDepartment(id: number): ErpLookupRecord {
  const item = MOCK_ERP_DEPARTMENTS.find((record) => record.id === id)
  if (!item) {
    throw new Error(`ERP department not found: id=${id}`)
  }
  return item
}

export function requireMockErpCurrency(id: number): ErpLookupRecord {
  const item = MOCK_ERP_CURRENCIES.find((record) => record.id === id)
  if (!item) {
    throw new Error(`ERP currency not found: id=${id}`)
  }
  return item
}
