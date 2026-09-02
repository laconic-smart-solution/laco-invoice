import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { OrderInputRunStatusBadges } from "@/features/orders/components/order-input-run-status-badges"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { OrderInputRunCreateDialog } from "@/features/orders/components/order-input-run-create-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  getOrderInputRunErrorMessage,
  useDeleteOrderInputRunMutation,
  useOrderInputRunsPageQuery,
} from "@/shared/queries/order-input-run.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import type {
  ApiOrderInputRunDto,
} from "@/shared/services/order-input-run.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatDateTime } from "@/util/format"
import { sortingToPageSort } from "@/util/table-sort"

const STORES_LIST_REQUEST = {
  pageNumber: 1,
  pageSize: 500,
  sortBy: "name",
  sortOrder: "ASC" as const,
}

const SORT_FIELD_MAP: Record<string, string> = {
  title: "title",
  createdAt: "createdAt",
  status: "status",
}

export function OrderInputRunsPage() {
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
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteRunTarget, setDeleteRunTarget] = useState<ApiOrderInputRunDto | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const deleteSetMutation = useDeleteOrderInputRunMutation()

  const { data: storesResponse } = useStoresPageQuery(STORES_LIST_REQUEST)
  const stores = Array.isArray(storesResponse?.data) ? storesResponse.data : []

  const pageSort = useMemo(
    () => sortingToPageSort(sorting, SORT_FIELD_MAP),
    [sorting]
  )

  const pageRequest = useMemo(() => {
    const filter: { storeId?: number; title?: string } = {}
    if (storeId) {
      const parsed = Number(storeId)
      if (Number.isFinite(parsed) && parsed > 0) {
        filter.storeId = parsed
      }
    }
    if (debouncedSearch.trim()) {
      filter.title = debouncedSearch.trim()
    }
    return {
      pageNumber: page,
      pageSize: limit,
      ...pageSort,
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
    }
  }, [debouncedSearch, limit, page, pageSort, storeId])

  const { data, isLoading, isError, error } =
    useOrderInputRunsPageQuery(pageRequest)

  const rows = data?.data ?? []
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const loadError =
    isError && error
      ? getOrderInputRunErrorMessage(error, t("inputs.errors.load_failed"))
      : null

  const columns = useMemo<ColumnDef<ApiOrderInputRunDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("inputs.table.title")} />
        ),
        cell: ({ row }) => (
          <Link
            to={ROUTES.dashboard.orderInputDetail(row.original.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "storeName",
        header: t("inputs.table.store"),
        cell: ({ row }) => row.original.storeName ?? "—",
        enableSorting: false,
      },
      {
        accessorKey: "marketplaceCode",
        header: t("inputs.table.marketplace"),
        cell: ({ row }) => row.original.marketplaceCode ?? "—",
        enableSorting: false,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("inputs.table.status")}
          />
        ),
        cell: ({ row }) => <OrderInputRunStatusBadges run={row.original} />,
      },
      {
        accessorKey: "orderCount",
        header: t("inputs.table.orders"),
        cell: ({ row }) => row.original.orderCount ?? 0,
        enableSorting: false,
      },
      {
        accessorKey: "itemCount",
        header: t("inputs.table.items"),
        cell: ({ row }) => row.original.itemCount ?? 0,
        enableSorting: false,
      },
      {
        accessorKey: "inputFileType",
        header: t("inputs.table.input_file_type"),
        cell: ({ row }) =>
          t(
            `inputs.input_file_type.${row.original.inputFileType === "SHIPPING_FEE" ? "shipping_fee" : "service_fee"}`
          ),
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("inputs.table.created_at")}
          />
        ),
        cell: ({ row }) => formatDateTime(row.original.createdAt, locale),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={t("inputs.detail.delete_set")}
              onClick={(e) => {
                e.stopPropagation()
                setDeleteError(null)
                setDeleteRunTarget(row.original)
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [locale, t]
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
      pagination: { pageIndex: page - 1, pageSize: limit },
    },
    onSortingChange: setSorting,
  })

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {t("inputs.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("inputs.subtitle")}
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus data-icon="inline-start" />
          {t("inputs.create")}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("inputs.filters.store")}
          </Label>
          <Select
            value={storeId || "__all__"}
            onValueChange={(value) => {
              setStoreId(value === "__all__" ? "" : value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t("inputs.filters.store_all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("inputs.filters.store_all")}</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("inputs.filters.search")}
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="w-64 pl-8"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t("inputs.filters.search_placeholder")}
            />
          </div>
        </div>
      </div>

      <AuthFormError message={loadError} />

      <div className="rounded-md border border-border">
        <DataTable
          table={table}
          emptyMessage={
            isLoading ? t("inputs.table.loading") : t("inputs.table.empty")
          }
          isLoading={isLoading && rows.length === 0}
          onRowClick={(row) =>
            void navigate(ROUTES.dashboard.orderInputDetail(row.id))
          }
        />
        <Dialog
        open={deleteRunTarget != null}
        onOpenChange={(open) => {
          if (!open && !deleteSetMutation.isPending) {
            setDeleteRunTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inputs.detail.delete_set_title")}</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground pt-2">
              {t("inputs.detail.delete_set_description")}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? <AuthFormError message={deleteError} /> : null}
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleteSetMutation.isPending}
              onClick={() => {
                setDeleteRunTarget(null)
                setDeleteError(null)
              }}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteSetMutation.isPending}
              onClick={async () => {
                if (!deleteRunTarget) return
                try {
                  await deleteSetMutation.mutateAsync(deleteRunTarget.id)
                  setDeleteRunTarget(null)
                  setDeleteError(null)
                } catch (err: unknown) {
                  setDeleteError(
                    getOrderInputRunErrorMessage(
                      err,
                      t("inputs.errors.load_failed")
                    )
                  )
                }
              }}
            >
              {deleteSetMutation.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Trash2 data-icon="inline-start" />
              )}
              {t("inputs.detail.delete_set_confirm_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            t("inputs.table.showing", { start: s, end: e, total })
          }
        />
      </div>

      <OrderInputRunCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        stores={stores}
        onCreated={(inputRunId) => {
          void navigate(ROUTES.dashboard.orderInputDetail(inputRunId))
        }}
      />
    </div>
  )
}
