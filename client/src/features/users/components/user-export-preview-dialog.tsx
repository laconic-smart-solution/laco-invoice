import type { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { useDataTable } from "@/components/common/data-table/use-data-table"
import { ExportPreviewDialog } from "@/components/common/export-preview-dialog"
import type { AdminUser } from "@/features/users/types/user"
import { useInfiniteScrollSentinel } from "@/shared/hooks/use-infinite-scroll-sentinel"
import {
  getAdminUserErrorMessage,
  useExportUsersMutation,
  useUserExportPreviewQuery,
} from "@/shared/queries/admin-user.query"
import type { UserExportRequest } from "@/shared/services/admin-user.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import type { UserRole } from "@/shared/types/auth.types"
import { formatDateTime } from "@/util/format"

const DEFAULT_VISIBLE_COLUMNS = [
  "id",
  "fullName",
  "email",
  "role",
  "active",
  "authServerUserId",
  "createdAt",
] as const

function getRoleLabelKey(role: UserRole): string {
  return `table.roles.${role.toLowerCase()}`
}

interface UserExportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scope: Omit<UserExportRequest, "pageNumber" | "pageSize" | "columns">
}

export function UserExportPreviewDialog({
  open,
  onOpenChange,
  scope,
}: UserExportPreviewDialogProps) {
  const { t } = useTranslation("users")
  const locale = useLocaleStore((state) => state.locale)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [exportError, setExportError] = useState<string | null>(null)
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)

  const previewQuery = useUserExportPreviewQuery(scope, open)
  const exportMutation = useExportUsersMutation()

  useEffect(() => {
    if (open) {
      setColumnVisibility({})
      setExportError(null)
    }
  }, [open])

  const rows = useMemo(
    () => previewQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [previewQuery.data?.pages]
  )
  const totalCount = previewQuery.data?.pages[0]?.meta?.totalElements ?? 0

  const columnLabels = useMemo(
    () => ({
      id: t("table.columns.id"),
      fullName: t("table.columns.name"),
      email: t("export.columns.email"),
      role: t("table.columns.role"),
      active: t("table.columns.status"),
      authServerUserId: t("export.columns.auth_server_user_id"),
      createdAt: t("table.columns.created_at"),
    }),
    [t]
  )

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("table.columns.id"),
      },
      {
        accessorKey: "fullName",
        header: t("table.columns.name"),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.fullName?.trim() || row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: t("export.columns.email"),
      },
      {
        accessorKey: "role",
        header: t("table.columns.role"),
        cell: ({ getValue }) => t(getRoleLabelKey(getValue<UserRole>())),
      },
      {
        accessorKey: "active",
        header: t("table.columns.status"),
        cell: ({ getValue }) =>
          getValue<boolean>()
            ? t("table.status.active")
            : t("table.status.inactive"),
      },
      {
        accessorKey: "authServerUserId",
        header: t("export.columns.auth_server_user_id"),
        cell: ({ getValue }) => getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "createdAt",
        header: t("table.columns.created_at"),
        cell: ({ getValue }) => {
          const value = getValue<string | null>()
          return value ? formatDateTime(value, locale) : "—"
        },
      },
    ],
    [locale, t]
  )

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (row) => String(row.id),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  })

  const loadMore = useCallback(() => {
    if (previewQuery.hasNextPage && !previewQuery.isFetchingNextPage) {
      void previewQuery.fetchNextPage()
    }
  }, [previewQuery])

  const sentinelRef = useInfiniteScrollSentinel({
    enabled: open && Boolean(previewQuery.hasNextPage),
    onIntersect: loadMore,
    root: scrollRoot,
  })

  const visibleColumns = table
    .getVisibleLeafColumns()
    .map((column) => column.id)
    .filter((id) =>
      DEFAULT_VISIBLE_COLUMNS.includes(id as (typeof DEFAULT_VISIBLE_COLUMNS)[number])
    )

  const handleExport = async () => {
    setExportError(null)
    try {
      await exportMutation.mutateAsync({
        ...scope,
        columns: visibleColumns.length > 0 ? visibleColumns : [...DEFAULT_VISIBLE_COLUMNS],
      })
      onOpenChange(false)
    } catch (error) {
      setExportError(getAdminUserErrorMessage(error, t("errors.export_failed")))
    }
  }

  const loadError =
    previewQuery.isError && previewQuery.error
      ? getAdminUserErrorMessage(previewQuery.error, t("errors.export_preview_failed"))
      : null

  return (
    <ExportPreviewDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("export.preview_title")}
      description={t("export.preview_description")}
      totalCount={totalCount}
      columnControls={
        <DataTableColumnControls table={table} columnLabels={columnLabels} />
      }
      onConfirmExport={handleExport}
      isExporting={exportMutation.isPending}
      canExport={rows.length > 0 && !previewQuery.isLoading}
      exportError={exportError ?? loadError}
    >
      <div
        ref={setScrollRoot}
        className="h-full max-h-[min(50vh,28rem)] overflow-y-auto"
      >
        <div className="overflow-x-auto px-1">
          <DataTable
            table={table}
            emptyMessage={
              previewQuery.isLoading
                ? t("export.preview_loading")
                : t("export.preview_empty")
            }
            isLoading={previewQuery.isLoading && rows.length === 0}
            skeletonRowCount={10}
          />
          <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
          {previewQuery.isFetchingNextPage ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              {t("export.preview_loading_more")}
            </p>
          ) : null}
          {!previewQuery.hasNextPage && rows.length > 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              {t("export.preview_end")}
            </p>
          ) : null}
        </div>
      </div>
    </ExportPreviewDialog>
  )
}
