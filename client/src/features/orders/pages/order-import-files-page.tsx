import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table"
import { FileSpreadsheet, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { DataTableRowActions } from "@/components/common/data-table/data-table-row-actions"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { getPaginationMeta, usePagination } from "@/shared/hooks/use-pagination"
import {
  getOrderImportFileErrorMessage,
  useOrderImportFilesPageQuery,
} from "@/shared/queries/order-import-file.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import type {
  ApiOrderImportFileDto,
  ApiOrderImportFileStatus,
} from "@/shared/services/order-import-file.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatDateTime } from "@/util/format"
import { sortingToPageSort } from "@/util/table-sort"

const STATUS_BADGE: Record<ApiOrderImportFileStatus, StatusBadgeVariant> = {
  COMPLETED: "synced",
  PARTIAL: "pending",
  FAILED: "failed",
}

const STORES_LIST_REQUEST = {
  pageNumber: 1,
  pageSize: 500,
  sortBy: "name",
  sortOrder: "ASC" as const,
}

const SORT_FIELD_MAP: Record<string, string> = {
  originalFilename: "originalFilename",
  createdAt: "createdAt",
  importedOrders: "importedOrders",
  status: "status",
}

export function OrderImportFilesPage() {
  const { t } = useTranslation("orders")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const { page, limit, setPage, setLimit } = usePagination()
  const [storeId, setStoreId] = useState("")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const { data: storesResponse } = useStoresPageQuery(STORES_LIST_REQUEST)
  const stores = Array.isArray(storesResponse?.data) ? storesResponse.data : []

  const pageSort = useMemo(
    () => sortingToPageSort(sorting, SORT_FIELD_MAP),
    [sorting]
  )

  const pageRequest = useMemo(() => {
    const filter: {
      storeId?: number
      originalFilename?: string
    } = {}
    if (storeId) {
      const parsed = Number(storeId)
      if (Number.isFinite(parsed) && parsed > 0) {
        filter.storeId = parsed
      }
    }
    if (debouncedSearch.trim()) {
      filter.originalFilename = debouncedSearch.trim()
    }
    return {
      pageNumber: page,
      pageSize: limit,
      ...pageSort,
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
    }
  }, [debouncedSearch, limit, page, pageSort, storeId])

  const { data, isLoading, isError, error } =
    useOrderImportFilesPageQuery(pageRequest)

  const rows = data?.data ?? []
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const loadError =
    isError && error
      ? getOrderImportFileErrorMessage(error, t("imports.errors.load_failed"))
      : null

  const columns = useMemo<ColumnDef<ApiOrderImportFileDto>[]>(
    () => [
      {
        accessorKey: "originalFilename",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("imports.table.filename")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.originalFilename}</span>
        ),
        enableColumnFilter: false,
      },
      {
        accessorKey: "storeName",
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("imports.table.store")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => row.original.storeName ?? "—",
      },
      {
        accessorKey: "marketplaceCode",
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("imports.table.marketplace")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => row.original.marketplaceCode ?? "—",
      },
      {
        accessorKey: "status",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("imports.table.status")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_BADGE[row.original.status]}
            label={t(`import.status_${row.original.status.toLowerCase()}`)}
          />
        ),
      },
      {
        accessorKey: "importedOrders",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("imports.table.imported_orders")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => row.original.importedOrders ?? 0,
      },
      {
        accessorKey: "importedItems",
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("imports.table.imported_items")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => row.original.importedItems ?? 0,
      },
      {
        accessorKey: "createdAt",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("imports.table.created_at")}
            enableSearch={false}
          />
        ),
        cell: ({ row }) => formatDateTime(row.original.createdAt, locale) || "—",
      },
      {
        id: "actions",
        enableSorting: false,
        enableColumnFilter: false,
        header: t("imports.table.action"),
        cell: ({ row }) => (
          <DataTableRowActions>
            <DropdownMenuItem
              onSelect={() => {
                void navigate(ROUTES.dashboard.orderImportDetail(row.original.id))
              }}
            >
              {t("imports.table.view_detail")}
            </DropdownMenuItem>
          </DataTableRowActions>
        ),
      },
    ],
    [locale, navigate, t]
  )

  const columnLabels = useMemo(
    () => ({
      originalFilename: t("imports.table.filename"),
      storeName: t("imports.table.store"),
      marketplaceCode: t("imports.table.marketplace"),
      status: t("imports.table.status"),
      importedOrders: t("imports.table.imported_orders"),
      importedItems: t("imports.table.imported_items"),
      createdAt: t("imports.table.created_at"),
    }),
    [t]
  )

  const table = useDataTable({
    data: rows,
    columns,
    pageCount: totalPages,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getRowId: (row) => String(row.id),
    state: {
      sorting,
      columnFilters,
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
  })

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="size-5 text-primary" aria-hidden />
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("imports.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("imports.subtitle")}</p>
      </header>

      <section className="border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("filters.store_label")}
            </Label>
            <Select
              value={storeId || "all"}
              onValueChange={(value) => {
                setStoreId(value === "all" ? "" : value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("filters.store_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.store_all")}</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={String(store.id)}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="import-file-search">
              {t("imports.table.filename")}
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="import-file-search"
                type="search"
                placeholder={t("imports.table.search_placeholder")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                className="h-9 pl-8"
              />
            </div>
          </div>
        </div>
      </section>

      <AuthFormError message={loadError} />

      <section className="border border-border bg-card shadow-sm">
        <div className="flex justify-end border-b border-border px-4 py-2.5">
          <DataTableColumnControls table={table} columnLabels={columnLabels} />
        </div>
        <div className="overflow-x-auto">
          <DataTable
            table={table}
            emptyMessage={t("imports.table.empty")}
            isLoading={isLoading}
            skeletonRowCount={limit}
            onRowClick={(row) => {
              void navigate(ROUTES.dashboard.orderImportDetail(row.id))
            }}
          />
        </div>
        <DataTableFooter
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
          showingLabel={(s, e, total) =>
            t("imports.table.showing", { start: s, end: e, total })
          }
        />
      </section>
    </div>
  )
}
