import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { CustomersHeader } from "@/features/customers/components/customers-header"
import { CustomersStatCards } from "@/features/customers/components/customers-stat-cards"
import { CustomersTable } from "@/features/customers/components/customers-table"
import { useAuthStore } from "@/shared/stores/auth-store"
import { useCustomersPageQuery, getCustomerErrorMessage } from "@/shared/queries/customer.query"
import {
  getPaginationMeta,
  usePagination,
} from "@/shared/hooks/use-pagination"

export function CustomersPage() {
  const { t } = useTranslation("customers")
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN")

  const { page, limit, setPage, setLimit } = usePagination()

  const pageRequest = useMemo(
    () => ({
      pageNumber: page,
      pageSize: limit,
    }),
    [page, limit]
  )

  const { data, isLoading, isError, error } = useCustomersPageQuery(pageRequest)

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

  return (
    <div className="space-y-6 p-6">
      <CustomersHeader isAdmin={isAdmin} />
      <CustomersStatCards totalCustomers={totalCount} />
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
