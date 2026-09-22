import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/constants/routes"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrdersFilters } from "@/features/orders/components/orders-filters"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  DEFAULT_WITHDRAW_ROWS_FILTERS,
  WithdrawRowsFilters,
  type WithdrawRowsFiltersState,
} from "@/features/orders/components/withdraw-rows-filters"
import {
  DEFAULT_ORDER_FILTERS,
  type OrderFiltersState,
} from "@/features/orders/types/order-filters"
import { mapOrderDtoToOrder } from "@/features/orders/util/map-order"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { getPaginationMeta } from "@/shared/hooks/use-pagination"
import { useOrderInputRunWithdrawRowsQuery } from "@/shared/queries/order-input-run.query"
import {
  getOrderErrorMessage,
  useOrdersPageQuery,
} from "@/shared/queries/order.query"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"
import type { ApiOrderStatus } from "@/shared/services/order.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { getColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"
import { formatCurrency, formatNumber } from "@/util/format"

const ORDER_SORT_FIELD_MAP: Record<string, string> = {
  orderId: "externalOrderId",
  orderDate: "orderDate",
  storeName: "store.name",
  customer: "customer.name",
  totalAmount: "totalAmount",
}

interface FlowRunRecordsProps {
  run: ApiOrderInputRunDto
}

export function FlowRunRecords({ run }: FlowRunRecordsProps) {
  if (run.inputFileType === "SHIPPING_FEE") {
    return <FlowRunOrdersTable importFileId={run.orderDetailImportFileId} />
  }

  const showWithdrawRows =
    run.withdrawStatus === "SUCCEEDED" ||
    run.withdrawStatus === "PARTIAL" ||
    run.withdrawStatus === "FAILED"

  return (
    <FlowRunWithdrawTable
      run={run}
      enabled={showWithdrawRows}
    />
  )
}

interface FlowRunOrdersTableProps {
  importFileId: number | null
}

function FlowRunOrdersTable({ importFileId }: FlowRunOrdersTableProps) {
  const { t } = useTranslation("orders")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [filters, setFilters] = useState<OrderFiltersState>(DEFAULT_ORDER_FILTERS)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const debouncedColumnFilters = useDebounce(columnFilters)
  const debouncedSearch = useDebounce(filters.search)
  const orderPageSort = useMemo(
    () => sortingToPageSort(sorting, ORDER_SORT_FIELD_MAP),
    [sorting]
  )
  const columnOrderId = useMemo(
    () => getColumnFilterValue(debouncedColumnFilters, "orderId"),
    [debouncedColumnFilters]
  )

  const pageRequest = useMemo(() => {
    const filter: {
      sourceType: "IMPORT"
      sourceId?: number
      externalOrderId?: string
      orderStatus?: ApiOrderStatus
    } = { sourceType: "IMPORT" }
    if (importFileId != null) filter.sourceId = importFileId
    const orderSearch = columnOrderId || debouncedSearch.trim()
    if (orderSearch) filter.externalOrderId = orderSearch
    if (filters.orderStatus !== "all") {
      filter.orderStatus = filters.orderStatus as ApiOrderStatus
    }
    return {
      pageNumber: page,
      pageSize: limit,
      ...orderPageSort,
      filter,
    }
  }, [
    columnOrderId,
    debouncedSearch,
    filters.orderStatus,
    importFileId,
    limit,
    orderPageSort,
    page,
  ])

  const ordersQuery = useOrdersPageQuery(pageRequest, importFileId != null)
  const orders = useMemo(
    () => (ordersQuery.data?.data ?? []).map(mapOrderDtoToOrder),
    [ordersQuery.data?.data]
  )
  const total = ordersQuery.data?.meta?.totalElements ?? 0
  const meta = getPaginationMeta(page, limit, total)
  const error =
    ordersQuery.isError && ordersQuery.error
      ? getOrderErrorMessage(ordersQuery.error, t("errors.load_failed"))
      : null

  if (importFileId == null) {
    return (
      <p className="rounded-lg border border-border px-4 py-6 text-center text-xs text-muted-foreground">
        {t("inputs.detail.orders_empty")}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t("inputs.detail.orders_title")}</h3>
      <OrdersFilters
        stores={[]}
        value={filters}
        onChange={(next) => {
          setFilters(next)
          setPage(1)
        }}
        hideStoreFilter
        hideSourceFilter
      />
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <OrdersTable
        orders={orders}
        isLoading={ordersQuery.isLoading}
        page={page}
        totalPages={meta.totalPages}
        totalCount={total}
        start={meta.start}
        end={meta.end}
        limit={limit}
        canGoPrev={meta.canGoPrev}
        canGoNext={meta.canGoNext}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit)
          setPage(1)
        }}
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
      />
    </div>
  )
}

interface FlowRunWithdrawTableProps {
  run: ApiOrderInputRunDto
  enabled: boolean
}

function FlowRunWithdrawTable({ run, enabled }: FlowRunWithdrawTableProps) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [filters, setFilters] =
    useState<WithdrawRowsFiltersState>(DEFAULT_WITHDRAW_ROWS_FILTERS)
  const debouncedSearch = useDebounce(filters.search)
  const withdrawFilter = useMemo(() => {
    const filter: {
      externalOrderId?: string
      matchStatus?: string
      applyStatus?: string
      sortBy: string
      sortOrder: "ASC" | "DESC"
    } = {
      sortBy: "excelRowIndex",
      sortOrder: "ASC",
    }
    if (debouncedSearch.trim()) filter.externalOrderId = debouncedSearch.trim()
    if (filters.matchStatus !== "all") filter.matchStatus = filters.matchStatus
    if (filters.applyStatus !== "all") filter.applyStatus = filters.applyStatus
    return filter
  }, [debouncedSearch, filters.applyStatus, filters.matchStatus])

  const rowsQuery = useOrderInputRunWithdrawRowsQuery(
    enabled ? run.id : null,
    page,
    limit,
    withdrawFilter,
    enabled
  )
  const rows = rowsQuery.data?.data ?? []
  const total = rowsQuery.data?.meta?.totalElements ?? 0
  const meta = getPaginationMeta(page, limit, total)

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t("inputs.detail.withdraw_title")}</h3>
      {(run.withdrawMatchedCount != null || run.withdrawRowCount != null) ? (
        <p className="text-xs text-muted-foreground">
          {t("inputs.detail.withdraw_summary", {
            rows: formatNumber(run.withdrawRowCount ?? 0, locale),
            matched: formatNumber(run.withdrawMatchedCount ?? 0, locale),
            unmatched: formatNumber(run.withdrawUnmatchedCount ?? 0, locale),
          })}
        </p>
      ) : null}
      {!enabled ? (
        <p className="rounded-lg border border-border px-4 py-6 text-center text-xs text-muted-foreground">
          {t("inputs.detail.withdraw_not_ready")}
        </p>
      ) : (
        <>
          <WithdrawRowsFilters
            value={filters}
            onChange={(next) => {
              setFilters(next)
              setPage(1)
            }}
          />
          <div className="overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inputs.detail.col_no")}</TableHead>
                  <TableHead>{t("inputs.detail.col_order_id")}</TableHead>
                  <TableHead>{t("inputs.detail.col_amount")}</TableHead>
                  <TableHead>{t("inputs.detail.col_fees")}</TableHead>
                  <TableHead>{t("inputs.detail.col_adjustments")}</TableHead>
                  <TableHead>{t("inputs.detail.col_match")}</TableHead>
                  <TableHead>{t("inputs.detail.col_apply")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      {rowsQuery.isLoading
                        ? t("inputs.detail.loading")
                        : t("inputs.detail.withdraw_rows_empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.excelRowIndex ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.orderId ? (
                          <Link
                            to={ROUTES.dashboard.orderDetail(String(row.orderId))}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {row.externalOrderId}
                          </Link>
                        ) : (
                          (row.externalOrderId ?? "—")
                        )}
                      </TableCell>
                      <TableCell>
                        {row.withdrawAmount == null
                          ? "—"
                          : formatCurrency(row.withdrawAmount, locale, row.currency ?? "THB")}
                      </TableCell>
                      <TableCell>
                        {row.totalFees == null
                          ? "—"
                          : formatCurrency(row.totalFees, locale, row.currency ?? "THB")}
                      </TableCell>
                      <TableCell>
                        {row.adjustmentAmount == null
                          ? "—"
                          : formatCurrency(row.adjustmentAmount, locale, row.currency ?? "THB")}
                      </TableCell>
                      <TableCell>
                        {t(`inputs.match.${row.matchStatus.toLowerCase()}`)}
                      </TableCell>
                      <TableCell>
                        {t(`inputs.apply.${row.applyStatus.toLowerCase()}`)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {total > 0 ? (
            <DataTableFooter
              page={page}
              totalPages={meta.totalPages}
              totalCount={total}
              start={meta.start}
              end={meta.end}
              limit={limit}
              canGoPrev={meta.canGoPrev}
              canGoNext={meta.canGoNext}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next)
                setPage(1)
              }}
              showingLabel={(start, end, count) =>
                t("inputs.table.showing", { start, end, total: count })
              }
            />
          ) : null}
        </>
      )}
    </div>
  )
}
