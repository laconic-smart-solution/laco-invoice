import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
} from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableColumnControls } from "@/components/common/data-table/data-table-column-controls"
import { DataTableColumnHeader } from "@/components/common/data-table/data-table-column-header"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { DataTableToolbar } from "@/components/common/data-table/data-table-toolbar"
import {
  useDataTable,
  type RowSelectionState,
} from "@/components/common/data-table/use-data-table"
import type { DataTableSelection } from "@/components/common/data-table/types"
import { UserRowActions } from "@/features/users/components/user-row-actions"
import type { AdminUser } from "@/features/users/types/user"
import { useLocaleStore } from "@/shared/stores/locale-store"
import type { UserRole } from "@/shared/types/auth.types"
import { formatDateTime } from "@/util/format"

function getInitials(name: string | null, email: string): string {
  const source = name?.trim() || email
  return source
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function getRoleLabelKey(role: UserRole): string {
  return `table.roles.${role.toLowerCase()}`
}

function getRoleBadgeVariant(role: UserRole): "default" | "secondary" | "outline" {
  if (role === "ADMIN") {
    return "default"
  }
  if (role === "OWNER") {
    return "secondary"
  }
  return "outline"
}

interface UsersTableProps {
  users: AdminUser[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  start: number
  end: number
  canGoPrev: boolean
  canGoNext: boolean
  isLoading?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onVerifyOtp: (user: AdminUser) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: (filters: ColumnFiltersState) => void
  onSelectionChange?: (selection: DataTableSelection) => void
}

export function UsersTable({
  users,
  totalCount,
  page,
  limit,
  totalPages,
  start,
  end,
  canGoPrev,
  canGoNext,
  isLoading = false,
  onPageChange,
  onLimitChange,
  onVerifyOtp,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  onSelectionChange,
}: UsersTableProps) {
  const { t } = useTranslation("users")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false)

  const pageRowIdsKey = useMemo(
    () => users.map((user) => user.id).join(","),
    [users]
  )

  useEffect(() => {
    setRowSelection({})
    setIsAllMatchingSelected(false)
  }, [totalCount])

  useEffect(() => {
    if (!isAllMatchingSelected || users.length === 0) {
      return
    }
    const next: RowSelectionState = {}
    for (const user of users) {
      next[String(user.id)] = true
    }
    setRowSelection(next)
  }, [isAllMatchingSelected, pageRowIdsKey, users])

  const handleRowClick = useCallback(
    (user: AdminUser) => {
      void navigate(ROUTES.dashboard.userDetail(user.id))
    },
    [navigate]
  )

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      onSortingChange(next)
    },
    [onSortingChange, sorting]
  )

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      const next =
        typeof updater === "function" ? updater(columnFilters) : updater
      onColumnFiltersChange(next)
    },
    [columnFilters, onColumnFiltersChange]
  )

  const columnLabels = useMemo(
    () => ({
      id: t("table.columns.id"),
      fullName: t("table.columns.name"),
      role: t("table.columns.role"),
      active: t("table.columns.status"),
      createdAt: t("table.columns.created_at"),
    }),
    [t]
  )

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "id",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.id")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue<number>()}
          </span>
        ),
      },
      {
        id: "fullName",
        accessorFn: (row) => `${row.fullName ?? ""} ${row.email}`.trim(),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.name")}
          />
        ),
        cell: ({ row }) => {
          const user = row.original
          const displayName = user.fullName?.trim() || user.email

          return (
            <div className="flex min-w-[200px] items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(user.fullName, user.email)}
              </div>
              <div>
                <p className="font-medium text-foreground">{displayName}</p>
                {user.fullName ? (
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                ) : null}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "role",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.role")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => {
          const role = getValue<UserRole>()

          return (
            <Badge variant={getRoleBadgeVariant(role)}>
              {t(getRoleLabelKey(role))}
            </Badge>
          )
        },
      },
      {
        accessorKey: "active",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.status")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => {
          const active = getValue<boolean>()

          return (
            <Badge variant={active ? "secondary" : "destructive"}>
              {active ? t("table.status.active") : t("table.status.inactive")}
            </Badge>
          )
        },
      },
      {
        accessorKey: "createdAt",
        enableColumnFilter: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("table.columns.created_at")}
            enableSearch={false}
          />
        ),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateTime(getValue<string>(), locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        enableSorting: false,
        enableHiding: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <UserRowActions user={row.original} onVerifyOtp={onVerifyOtp} />
        ),
      },
    ],
    [locale, onVerifyOtp, t]
  )

  const table = useDataTable({
    data: users,
    columns,
    getRowId: (row) => String(row.id),
    enableRowSelection: true,
    manualSorting: true,
    manualFiltering: true,
    selectColumnLabels: {
      selectAll: t("table.select_all"),
      selectRow: t("table.select_row"),
    },
    state: { rowSelection, sorting, columnFilters },
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    meta: {
      selectAllMatching: {
        enabled: true,
        isSelected: isAllMatchingSelected,
        onChange: setIsAllMatchingSelected,
      },
    },
  })

  useEffect(() => {
    if (!onSelectionChange) {
      return
    }
    const ids = Object.keys(rowSelection).filter((id) => rowSelection[id])
    const pageRowCount = users.length
    onSelectionChange({
      ids,
      isAllPageSelected: pageRowCount > 0 && ids.length === pageRowCount,
      isAllMatchingSelected,
    })
  }, [isAllMatchingSelected, onSelectionChange, rowSelection, users.length])

  const toolbarSelectedCount = isAllMatchingSelected
    ? totalCount
    : Object.keys(rowSelection).filter((id) => rowSelection[id]).length

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <DataTableToolbar
          table={table}
          selectedLabel={(count) => t("table.selected_count", { count })}
          selectedCount={toolbarSelectedCount}
          className="border-b-0"
        />
        <DataTableColumnControls
          table={table}
          columnLabels={columnLabels}
          className="px-4 py-3"
        />
      </div>

      <div className="overflow-x-auto">
        <DataTable
          table={table}
          emptyMessage={t("table.empty")}
          isLoading={isLoading}
          skeletonRowCount={limit}
          onRowClick={handleRowClick}
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
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        showingLabel={(rangeStart, rangeEnd, total) =>
          t("table.showing", { start: rangeStart, end: rangeEnd, total })
        }
      />
    </section>
  )
}
