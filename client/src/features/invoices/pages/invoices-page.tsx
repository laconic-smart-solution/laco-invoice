import { useMemo } from "react"

import { InvoicesFilters } from "@/features/invoices/components/invoices-filters"
import { InvoicesHeader } from "@/features/invoices/components/invoices-header"
import { InvoicesTable } from "@/features/invoices/components/invoices-table"
import {
  getMockInvoicesPage,
  MOCK_INVOICES_TOTAL,
} from "@/features/invoices/data/mock-invoices"
import { usePagination } from "@/shared/hooks/use-pagination"

export function InvoicesPage() {
  const {
    page,
    limit,
    totalPages,
    start,
    end,
    canGoPrev,
    canGoNext,
    setPage,
    setLimit,
  } = usePagination({ total: MOCK_INVOICES_TOTAL })

  const invoices = useMemo(
    () => getMockInvoicesPage(page, limit),
    [page, limit]
  )

  return (
    <div className="space-y-6 p-6">
      <InvoicesHeader />
      <InvoicesFilters />
      <InvoicesTable
        invoices={invoices}
        totalCount={MOCK_INVOICES_TOTAL}
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
