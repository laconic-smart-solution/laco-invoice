import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"
import { ArrowLeft, FileSpreadsheet } from "lucide-react"

import { ROUTES } from "@/app/constants/routes"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { OrdersFilters } from "@/features/orders/components/orders-filters"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  DEFAULT_ORDER_FILTERS,
  type OrderFiltersState,
} from "@/features/orders/types/order-filters"
import { mapOrderDtoToOrder } from "@/features/orders/util/map-order"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { getPaginationMeta, usePagination } from "@/shared/hooks/use-pagination"
import {
  getOrderImportFileErrorMessage,
  useOrderImportFileDetailQuery,
} from "@/shared/queries/order-import-file.query"
import {
  getOrderErrorMessage,
  useOrdersPageQuery,
} from "@/shared/queries/order.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import type { ApiOrderStatus } from "@/shared/services/order.service"
import type { ApiOrderImportFileStatus } from "@/shared/services/order-import-file.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { getColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"
import { formatDateTime } from "@/util/format"

const STATUS_BADGE: Record<ApiOrderImportFileStatus, StatusBadgeVariant> = {
  COMPLETED: "synced",
  PARTIAL: "pending",
  FAILED: "failed",
}

const ORDER_SORT_FIELD_MAP: Record<string, string> = {
  orderId: "externalOrderId",
  orderDate: "orderDate",
  storeName: "store.name",
  customer: "customer.name",
  totalAmount: "totalAmount",
}

const STORES_LIST_REQUEST = {
  pageNumber: 1,
  pageSize: 500,
  sortBy: "name",
  sortOrder: "ASC" as const,
}

export function OrderImportFileDetailPage() {
  const { t } = useTranslation("orders")
  const { importFileId } = useParams<{ importFileId: string }>()
  const parsedId = Number(importFileId)
  const fileId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null
  const locale = useLocaleStore((state) => state.locale)

  const { page, limit, setPage, setLimit } = usePagination()
  const [filters, setFilters] = useState<OrderFiltersState>({
    ...DEFAULT_ORDER_FILTERS,
    sourceType: "IMPORT",
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const debouncedColumnFilters = useDebounce(columnFilters)

  const detailQuery = useOrderImportFileDetailQuery(fileId)
  const { data: storesResponse } = useStoresPageQuery(STORES_LIST_REQUEST)
  const stores = Array.isArray(storesResponse?.data) ? storesResponse.data : []

  const pageSort = useMemo(
    () => sortingToPageSort(sorting, ORDER_SORT_FIELD_MAP),
    [sorting]
  )
  const columnOrderId = useMemo(
    () => getColumnFilterValue(debouncedColumnFilters, "orderId"),
    [debouncedColumnFilters]
  )

  const pageRequest = useMemo(() => {
    const filter: {
      sourceId?: number
      sourceType: "IMPORT"
      storeId?: number
      orderStatus?: ApiOrderStatus
      externalOrderId?: string
    } = {
      sourceType: "IMPORT",
    }

    if (fileId != null) {
      filter.sourceId = fileId
    }

    if (filters.storeId) {
      const storeId = Number(filters.storeId)
      if (Number.isFinite(storeId) && storeId > 0) {
        filter.storeId = storeId
      }
    }
    if (filters.orderStatus !== "all") {
      filter.orderStatus = filters.orderStatus as ApiOrderStatus
    }
    const orderSearch = columnOrderId || filters.search.trim()
    if (orderSearch) {
      filter.externalOrderId = orderSearch
    }

    return {
      pageNumber: page,
      pageSize: limit,
      ...pageSort,
      filter,
    }
  }, [
    columnOrderId,
    fileId,
    filters.orderStatus,
    filters.search,
    filters.storeId,
    limit,
    page,
    pageSort,
  ])

  const ordersQuery = useOrdersPageQuery(pageRequest, fileId != null)

  const orders = useMemo(
    () => (ordersQuery.data?.data ?? []).map(mapOrderDtoToOrder),
    [ordersQuery.data?.data]
  )
  const totalCount = ordersQuery.data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const file = detailQuery.data
  const detailError =
    detailQuery.isError && detailQuery.error
      ? getOrderImportFileErrorMessage(
          detailQuery.error,
          t("imports.errors.load_detail_failed")
        )
      : fileId == null
        ? t("imports.errors.invalid_id")
        : null
  const ordersError =
    ordersQuery.isError && ordersQuery.error
      ? getOrderErrorMessage(ordersQuery.error, t("errors.load_failed"))
      : null

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={ROUTES.dashboard.orderImports}>
            <ArrowLeft data-icon="inline-start" aria-hidden />
            {t("imports.back_to_list")}
          </Link>
        </Button>
      </div>

      <AuthFormError message={detailError} />

      {file ? (
        <section className="space-y-4 border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-start gap-3">
            <FileSpreadsheet className="mt-0.5 size-5 text-primary" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="font-heading text-xl font-semibold tracking-tight break-all">
                {file.originalFilename}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("imports.detail.subtitle")}
              </p>
            </div>
            <StatusBadge
              status={STATUS_BADGE[file.status]}
              label={t(`import.status_${file.status.toLowerCase()}`)}
            />
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label={t("imports.table.store")} value={file.storeName} />
            <DetailField
              label={t("imports.table.marketplace")}
              value={file.marketplaceCode}
            />
            <DetailField label={t("imports.detail.sheet")} value={file.sheetName} />
            <DetailField
              label={t("imports.detail.row_count")}
              value={file.rowCount != null ? String(file.rowCount) : null}
            />
            <DetailField
              label={t("imports.table.imported_orders")}
              value={
                file.importedOrders != null ? String(file.importedOrders) : null
              }
            />
            <DetailField
              label={t("imports.table.imported_items")}
              value={
                file.importedItems != null ? String(file.importedItems) : null
              }
            />
            <DetailField
              label={t("imports.table.created_at")}
              value={formatDateTime(file.createdAt, locale) || null}
            />
          </dl>
        </section>
      ) : detailQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("imports.detail.loading")}</p>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t("imports.detail.orders_title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("imports.detail.orders_subtitle")}
        </p>
      </div>

      <OrdersFilters
        stores={stores}
        value={filters}
        onChange={(next) => {
          setFilters({ ...next, sourceType: "IMPORT" })
          setPage(1)
        }}
        hideSourceFilter
        disabled={fileId == null}
      />

      <AuthFormError message={ordersError} />

      <OrdersTable
        orders={orders}
        isLoading={ordersQuery.isLoading || fileId == null}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        start={start}
        end={end}
        limit={limit}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
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

interface DetailFieldProps {
  label: string
  value: string | null | undefined
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value?.trim() || "—"}</dd>
    </div>
  )
}
