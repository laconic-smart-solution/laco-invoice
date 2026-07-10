import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { StoresHeader } from "@/features/stores/components/stores-header"
import { StoresStatCards } from "@/features/stores/components/stores-stat-cards"
import { StoresTable } from "@/features/stores/components/stores-table"
import {
  getPaginationMeta,
  usePagination,
} from "@/shared/hooks/use-pagination"
import {
  getStoreErrorMessage,
  useStoresPageQuery,
} from "@/shared/queries/store.query"

export function StoresPage() {
  const { t } = useTranslation("stores")
  const { page, limit, setPage, setLimit } = usePagination()

  const pageRequest = useMemo(
    () => ({
      pageNumber: page,
      pageSize: limit,
    }),
    [page, limit]
  )

  const { data, isLoading, isError, error } = useStoresPageQuery(pageRequest)

  const stores = data?.data ?? []
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const loadError =
    isError && error ? getStoreErrorMessage(error, t("errors.load_failed")) : null

  return (
    <div className="space-y-6 p-6">
      <StoresHeader />
      <StoresStatCards totalStores={totalCount} />
      <AuthFormError message={loadError} />
      <StoresTable
        stores={stores}
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
