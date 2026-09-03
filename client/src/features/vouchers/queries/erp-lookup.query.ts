import { useQuery } from "@tanstack/react-query"

import { erpLookupService } from "@/shared/services/erp-lookup.service"

export const erpLookupKeys = {
  all: ["erp-lookups"] as const,
  items: () => [...erpLookupKeys.all, "items"] as const,
  accounts: () => [...erpLookupKeys.all, "accounts"] as const,
  vendors: () => [...erpLookupKeys.all, "vendors"] as const,
  departments: () => [...erpLookupKeys.all, "departments"] as const,
  currencies: () => [...erpLookupKeys.all, "currencies"] as const,
}

export function useErpItemsQuery() {
  return useQuery({
    queryKey: erpLookupKeys.items(),
    queryFn: () => erpLookupService.items(),
    staleTime: 60_000,
  })
}

export function useErpAccountsQuery() {
  return useQuery({
    queryKey: erpLookupKeys.accounts(),
    queryFn: () => erpLookupService.accounts(),
    staleTime: 60_000,
  })
}

export function useErpVendorsQuery() {
  return useQuery({
    queryKey: erpLookupKeys.vendors(),
    queryFn: () => erpLookupService.vendors(),
    staleTime: 60_000,
  })
}

export function useErpDepartmentsQuery() {
  return useQuery({
    queryKey: erpLookupKeys.departments(),
    queryFn: () => erpLookupService.departments(),
    staleTime: 60_000,
  })
}

export function useErpCurrenciesQuery() {
  return useQuery({
    queryKey: erpLookupKeys.currencies(),
    queryFn: () => erpLookupService.currencies(),
    staleTime: 60_000,
  })
}

export function erpLookupLabel(
  records: { id: number; code: string; name: string }[] | undefined,
  id: number | null | undefined
): string {
  if (id == null) {
    return "—"
  }
  const match = records?.find((record) => record.id === id)
  return match ? `${match.code} — ${match.name}` : `#${id}`
}

export function erpLookupCode(
  records: { id: number; code: string; name: string }[] | undefined,
  id: number | null | undefined,
  fallback = "THB"
): string {
  if (id == null) {
    return fallback
  }
  return records?.find((record) => record.id === id)?.code ?? fallback
}
