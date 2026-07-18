import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { InvoicesFilters } from "@/features/invoices/components/invoices-filters"
import { InvoicesHeader } from "@/features/invoices/components/invoices-header"
import { InvoicesTable } from "@/features/invoices/components/invoices-table"
import type { InvoiceStatus } from "@/features/invoices/types/invoice"
import {
  getInvoiceErrorMessage,
  useInvoicesPageQuery,
} from "@/shared/queries/invoice.query"
import {
  getPaginationMeta,
  usePagination,
} from "@/shared/hooks/use-pagination"

export function InvoicesPage() {
  const { t } = useTranslation("invoices")
  const { page, limit, setPage, setLimit } = usePagination()
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all")

  const pageRequest = useMemo(
    () => ({
      pageNumber: page,
      pageSize: limit,
      sortBy: "issuedAt",
      sortOrder: "DESC" as const,
      filter: status === "all" ? undefined : { status },
    }),
    [limit, page, status]
  )

  const { data, isLoading, isError, error } = useInvoicesPageQuery(pageRequest)
  const invoices = data?.data ?? []
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const loadError =
    isError && error
      ? getInvoiceErrorMessage(error, t("errors.load_failed"))
      : null

  return (
    <div className="space-y-6 p-6">
      <InvoicesHeader />
      <InvoicesFilters
        status={status}
        onStatusChange={(next) => {
          setStatus(next)
          setPage(1)
        }}
      />
      <AuthFormError message={loadError} />
      <InvoicesTable
        invoices={invoices}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        limit={limit}
        totalPages={totalPages}
        start={start}
        end={end}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  )
}
