import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { CustomerExportPreviewDialog } from "@/features/customers/components/customer-export-preview-dialog"
import { CustomersFilters } from "@/features/customers/components/customers-filters"
import { CustomersHeader } from "@/features/customers/components/customers-header"
import { CustomersStatCards } from "@/features/customers/components/customers-stat-cards"
import { CustomersTable } from "@/features/customers/components/customers-table"
import {
  DEFAULT_CUSTOMER_FILTERS,
  type CustomerFiltersState,
} from "@/features/customers/types/customer"
import { useAuthStore } from "@/shared/stores/auth-store"
import {
  useCustomersPageQuery,
  getCustomerErrorMessage,
} from "@/shared/queries/customer.query"
import {
  getOrderErrorMessage,
  useTriggerOrderSyncMutation,
} from "@/shared/queries/order.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import type { CustomerExportRequest } from "@/shared/services/customer.service"
import { useExportSelection } from "@/shared/hooks/use-export-selection"
import {
  getPaginationMeta,
  usePagination,
} from "@/shared/hooks/use-pagination"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { getColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"

const CUSTOMER_SORT_FIELD_MAP: Record<string, string> = {
  id: "id",
  name: "name",
  email: "email",
  phone: "phone",
  gender: "gender",
  address: "address",
  store: "store.name",
}

const STORES_LIST_REQUEST = {
  pageNumber: 1,
  pageSize: 500,
  sortBy: "name",
  sortOrder: "ASC" as const,
}

export function CustomersPage() {
  const { t } = useTranslation("customers")
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")
  const [filters, setFilters] = useState<CustomerFiltersState>(DEFAULT_CUSTOMER_FILTERS)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const debouncedColumnFilters = useDebounce(columnFilters)
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false)
  const [exportScope, setExportScope] = useState<
    Omit<CustomerExportRequest, "pageNumber" | "pageSize" | "columns">
  >({ exportAll: false })

  const { page, limit, setPage, setLimit } = usePagination()
  const { data: storesResponse, isLoading: storesLoading } =
    useStoresPageQuery(STORES_LIST_REQUEST)
  const stores = Array.isArray(storesResponse?.data) ? storesResponse.data : []

  const pageSort = useMemo(
    () => sortingToPageSort(sorting, CUSTOMER_SORT_FIELD_MAP),
    [sorting]
  )
  const columnName = useMemo(
    () => getColumnFilterValue(debouncedColumnFilters, "name"),
    [debouncedColumnFilters]
  )
  const columnEmail = useMemo(
    () => getColumnFilterValue(debouncedColumnFilters, "email"),
    [debouncedColumnFilters]
  )
  const columnPhone = useMemo(
    () => getColumnFilterValue(debouncedColumnFilters, "phone"),
    [debouncedColumnFilters]
  )

  const exportFilter = useMemo(() => {
    const filter: NonNullable<CustomerExportRequest["filter"]> = {}

    if (filters.storeId) {
      const storeId = Number(filters.storeId)
      if (Number.isFinite(storeId) && storeId > 0) {
        filter.storeId = storeId
      }
    }

    const nameSearch = columnName || filters.search.trim()
    if (nameSearch) {
      filter.name = nameSearch
    }
    if (columnEmail) {
      filter.email = columnEmail
    }
    if (columnPhone) {
      filter.phone = columnPhone
    }

    return Object.keys(filter).length > 0 ? filter : undefined
  }, [columnEmail, columnName, columnPhone, filters.search, filters.storeId])

  const pageRequest = useMemo(() => {
    return {
      pageNumber: page,
      pageSize: limit,
      ...pageSort,
      ...(exportFilter ? { filter: exportFilter } : {}),
    }
  }, [exportFilter, limit, page, pageSort])

  const { data, isLoading, isError, error } = useCustomersPageQuery(pageRequest)
  const syncMutation = useTriggerOrderSyncMutation()

  const customers = data?.data ?? []
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const {
    setSelection,
    closeConfirm,
    requestAction,
    actionError,
    setActionError,
  } = useExportSelection({ totalCount })

  const loadError =
    isError && error
      ? getCustomerErrorMessage(error, t("errors.load_failed"))
      : null

  const syncError =
    syncMutation.isError && syncMutation.error
      ? getOrderErrorMessage(syncMutation.error, t("errors.sync_failed"))
      : null

  const openExportPreview = useCallback(
    (scope: Omit<CustomerExportRequest, "pageNumber" | "pageSize" | "columns">) => {
      setExportScope(scope)
      setExportPreviewOpen(true)
    },
    []
  )

  const handleExportCsv = () => {
    const result = requestAction("export")
    if (result.kind === "need_selection") {
      setActionError(t("errors.select_to_export"))
      return
    }
    if (result.kind === "confirm_all") {
      openExportPreview({
        exportAll: true,
        filter: exportFilter,
      })
      closeConfirm()
      return
    }
    if (result.kind === "selected") {
      openExportPreview({
        ids: result.ids.map((id) => Number(id)).filter(Number.isFinite),
      })
    }
  }

  return (
    <div className="space-y-6 p-6">
      <CustomersHeader
        isAdmin={isAdmin}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
        onExportCsv={handleExportCsv}
      />
      <CustomerExportPreviewDialog
        open={exportPreviewOpen}
        onOpenChange={setExportPreviewOpen}
        scope={exportScope}
      />
      <AuthFormError message={syncError} />
      <CustomersStatCards totalCustomers={totalCount} />
      <CustomersFilters
        stores={stores}
        value={filters}
        onChange={(next) => {
          setFilters(next)
          setPage(1)
        }}
        disabled={storesLoading || isLoading}
      />
      <AuthFormError message={loadError ?? actionError} />
      <CustomersTable
        customers={customers}
        isAdmin={isAdmin}
        totalCount={totalCount}
        page={page}
        limit={limit}
        totalPages={totalPages}
        start={start}
        end={end}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        isLoading={isLoading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        sorting={sorting}
        onSortingChange={(next) => {
          setSorting(next)
          setPage(1)
        }}
        columnFilters={columnFilters}
        onColumnFiltersChange={(next) => {
          setColumnFilters(next)
          setPage(1)
        }}
        onSelectionChange={setSelection}
      />
    </div>
  )
}
