import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
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
import { useMarketplaceProductSourcesQuery } from "@/shared/queries/marketplace-product.query"
import { parseProductSourceKey } from "@/shared/services/marketplace-product.service"
import {
  getPaginationMeta,
  usePagination,
} from "@/shared/hooks/use-pagination"

export function CustomersPage() {
  const { t } = useTranslation("customers")
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")
  const [filters, setFilters] = useState<CustomerFiltersState>(DEFAULT_CUSTOMER_FILTERS)

  const { page, limit, setPage, setLimit } = usePagination()
  const { data: sources = [] } = useMarketplaceProductSourcesQuery()

  // Default to "All sources" so customers synced before marketplace binding
  // (null marketplace_id) still appear. Store filter works after re-sync.
  const selectedSourceKey = filters.sourceKey || "all"
  const parsedSource = useMemo(
    () => (filters.sourceKey ? parseProductSourceKey(filters.sourceKey) : null),
    [filters.sourceKey]
  )

  const pageRequest = useMemo(() => {
    const filter: {
      storeId?: number
      marketplaceCode?: string
    } = {}
    if (parsedSource) {
      filter.storeId = parsedSource.storeId
      filter.marketplaceCode = parsedSource.marketplaceCode
    }
    return {
      pageNumber: page,
      pageSize: limit,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    }
  }, [limit, page, parsedSource])

  const { data, isLoading, isError, error } = useCustomersPageQuery(pageRequest)
  const syncMutation = useTriggerOrderSyncMutation()

  const customers = data?.data ?? []
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const loadError =
    isError && error
      ? getCustomerErrorMessage(error, t("errors.load_failed"))
      : null

  const syncError =
    syncMutation.isError && syncMutation.error
      ? getOrderErrorMessage(syncMutation.error, t("errors.sync_failed"))
      : null

  return (
    <div className="space-y-6 p-6">
      <CustomersHeader
        isAdmin={isAdmin}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
      />
      <AuthFormError message={syncError} />
      <CustomersStatCards totalCustomers={totalCount} />
      <CustomersFilters
        sources={sources}
        value={filters}
        selectedSourceKey={selectedSourceKey}
        onChange={(next) => {
          setFilters(next)
          setPage(1)
        }}
        disabled={isLoading}
      />
      <AuthFormError message={loadError} />
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
      />
    </div>
  )
}
