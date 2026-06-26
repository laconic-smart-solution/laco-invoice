import { useMemo } from "react"

import { CustomersHeader } from "@/features/customers/components/customers-header"
import { CustomersInsights } from "@/features/customers/components/customers-insights"
import { CustomersStatCards } from "@/features/customers/components/customers-stat-cards"
import { CustomersTable } from "@/features/customers/components/customers-table"
import {
  getMockCustomersPage,
  MOCK_CUSTOMER_STATS,
  MOCK_CUSTOMERS_TOTAL,
} from "@/features/customers/data/mock-customers"
import { usePagination } from "@/shared/hooks/use-pagination"

export function CustomersPage() {
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
  } = usePagination({ total: MOCK_CUSTOMERS_TOTAL })

  const customers = useMemo(
    () => getMockCustomersPage(page, limit),
    [page, limit]
  )

  return (
    <div className="space-y-6 p-6">
      <CustomersHeader />
      <CustomersStatCards stats={MOCK_CUSTOMER_STATS} />
      <CustomersTable
        customers={customers}
        totalCount={MOCK_CUSTOMERS_TOTAL}
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
      <CustomersInsights />
    </div>
  )
}
