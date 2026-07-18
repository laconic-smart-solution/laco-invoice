import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/common/data-table/data-table"
import { DataTableFooter } from "@/components/common/data-table/data-table-footer"
import { useDataTable } from "@/components/common/data-table/use-data-table"
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
}: UsersTableProps) {
  const { t } = useTranslation("users")
  const locale = useLocaleStore((state) => state.locale)

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("table.columns.id"),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "fullName",
        header: t("table.columns.name"),
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
        header: t("table.columns.role"),
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
        header: t("table.columns.status"),
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
        header: t("table.columns.created_at"),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateTime(getValue<string>(), locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
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
  })

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <DataTable
          table={table}
          emptyMessage={t("table.empty")}
          isLoading={isLoading}
          skeletonRowCount={limit}
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
