import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EMPTY_TABLE_SELECTION } from "@/components/common/data-table/types"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { UserExportPreviewDialog } from "@/features/users/components/user-export-preview-dialog"
import { UsersFilters } from "@/features/users/components/users-filters"
import { UsersHeader } from "@/features/users/components/users-header"
import { UsersStatCards } from "@/features/users/components/users-stat-cards"
import { UsersTable } from "@/features/users/components/users-table"
import type { AdminUser, UserActiveFilter, UserRoleFilter } from "@/features/users/types/user"
import { useExportSelection } from "@/shared/hooks/use-export-selection"
import {
  getPaginationMeta,
  PAGE_QUERY_KEY,
  usePagination,
} from "@/shared/hooks/use-pagination"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { useRegisterListShortcuts } from "@/shared/hooks/use-register-list-shortcuts"
import {
  getAdminUserErrorMessage,
  useUsersPageQuery,
  useVerifyUserOtpMutation,
} from "@/shared/queries/admin-user.query"
import type { UserExportRequest } from "@/shared/services/admin-user.service"
import type { UserRole } from "@/shared/types/auth.types"
import { getColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"

const ROLE_QUERY_KEY = "role"
const ACTIVE_QUERY_KEY = "active"
const USER_ROLES: UserRole[] = ["ADMIN", "OWNER", "MANAGER", "STAFF"]

const USER_SORT_FIELD_MAP: Record<string, string> = {
  id: "id",
  fullName: "fullName",
  role: "role",
  active: "active",
  createdAt: "createdAt",
}

function parseRoleFilter(value: string | null): UserRoleFilter {
  if (value && USER_ROLES.includes(value as UserRole)) {
    return value as UserRole
  }
  return "all"
}

function parseActiveFilter(value: string | null): UserActiveFilter {
  if (value === "active" || value === "inactive") {
    return value
  }
  return "all"
}

function getUserDisplayName(user: AdminUser): string {
  return user.fullName?.trim() || user.email
}

export function UsersPage() {
  const { t } = useTranslation("users")
  const [searchParams, setSearchParams] = useSearchParams()
  const roleFilter = parseRoleFilter(searchParams.get(ROLE_QUERY_KEY))
  const activeFilter = parseActiveFilter(searchParams.get(ACTIVE_QUERY_KEY))
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const debouncedColumnFilters = useDebounce(columnFilters)
  const [pendingVerifyUser, setPendingVerifyUser] = useState<AdminUser | null>(null)
  const [verifySuccessMessage, setVerifySuccessMessage] = useState<string | null>(null)
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false)
  const [exportScope, setExportScope] = useState<
    Omit<UserExportRequest, "pageNumber" | "pageSize" | "columns">
  >({ exportAll: false })

  const { page, limit, setPage, setLimit } = usePagination()
  const verifyOtpMutation = useVerifyUserOtpMutation()
  const pageSort = useMemo(
    () => sortingToPageSort(sorting, USER_SORT_FIELD_MAP),
    [sorting]
  )
  const columnFullName = useMemo(
    () => getColumnFilterValue(debouncedColumnFilters, "fullName"),
    [debouncedColumnFilters]
  )

  const exportFilter = useMemo(() => {
    const filter: NonNullable<UserExportRequest["filter"]> = {}

    if (roleFilter !== "all") {
      filter.role = roleFilter
    }
    if (activeFilter === "active") {
      filter.active = true
    } else if (activeFilter === "inactive") {
      filter.active = false
    }
    const nameSearch = columnFullName || search.trim()
    if (nameSearch) {
      filter.fullName = nameSearch
    }

    return Object.keys(filter).length > 0 ? filter : undefined
  }, [activeFilter, columnFullName, roleFilter, search])

  const pageRequest = useMemo(() => {
    return {
      pageNumber: page,
      pageSize: limit,
      ...pageSort,
      ...(exportFilter ? { filter: exportFilter } : {}),
    }
  }, [exportFilter, limit, page, pageSort])

  const { data, isLoading, isError, error } = useUsersPageQuery(pageRequest)

  const users = data?.data ?? []
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const {
    setSelection,
    closeConfirm,
    requestAction,
    actionError,
    setActionError,
  } = useExportSelection({ totalCount })

  const loadError =
    isError && error
      ? getAdminUserErrorMessage(error, t("errors.load_failed"))
      : null

  const verifyError =
    verifyOtpMutation.isError && verifyOtpMutation.error
      ? getAdminUserErrorMessage(verifyOtpMutation.error, t("errors.verify_otp_failed"))
      : null

  const openExportPreview = useCallback(
    (scope: Omit<UserExportRequest, "pageNumber" | "pageSize" | "columns">) => {
      setExportScope(scope)
      setExportPreviewOpen(true)
    },
    []
  )

  const handleExportCsv = useCallback(() => {
    const result = requestAction("export")
    if (result.kind === "need_selection") {
      setActionError(t("errors.select_to_export"))
      return
    }
    if (result.kind === "confirm_all") {
      openExportPreview({
        exportAll: true,
        filter: exportFilter,
      })
      closeConfirm()
      return
    }
    if (result.kind === "selected") {
      openExportPreview({
        ids: result.ids.map((id) => Number(id)).filter(Number.isFinite),
      })
    }
  }, [
    closeConfirm,
    exportFilter,
    openExportPreview,
    requestAction,
    setActionError,
    t,
  ])

  const handleClearSelection = useCallback(() => {
    setSelection(EMPTY_TABLE_SELECTION)
  }, [setSelection])

  useRegisterListShortcuts({
    onExport: handleExportCsv,
    onClearSelection: handleClearSelection,
  })

  const handleVerifyOtpRequest = useCallback((user: AdminUser) => {
    setVerifySuccessMessage(null)
    verifyOtpMutation.reset()
    setPendingVerifyUser(user)
  }, [verifyOtpMutation])

  const handleConfirmVerifyOtp = useCallback(async () => {
    if (!pendingVerifyUser) {
      return
    }

    const targetName = getUserDisplayName(pendingVerifyUser)

    await verifyOtpMutation.mutateAsync(pendingVerifyUser.id)
    setVerifySuccessMessage(t("verify_otp.success", { name: targetName }))
    setPendingVerifyUser(null)
  }, [pendingVerifyUser, t, verifyOtpMutation])

  const handleRoleChange = useCallback(
    (role: UserRoleFilter) => {
      setPage(1)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)

          if (role === "all") {
            next.delete(ROLE_QUERY_KEY)
          } else {
            next.set(ROLE_QUERY_KEY, role)
          }

          next.delete(PAGE_QUERY_KEY)
          return next
        },
        { replace: true }
      )
    },
    [setPage, setSearchParams]
  )

  const handleActiveChange = useCallback(
    (active: UserActiveFilter) => {
      setPage(1)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)

          if (active === "all") {
            next.delete(ACTIVE_QUERY_KEY)
          } else {
            next.set(ACTIVE_QUERY_KEY, active)
          }

          next.delete(PAGE_QUERY_KEY)
          return next
        },
        { replace: true }
      )
    },
    [setPage, setSearchParams]
  )

  return (
    <div className="space-y-6 p-6">
      <UsersHeader onExportCsv={handleExportCsv} />
      <UserExportPreviewDialog
        open={exportPreviewOpen}
        onOpenChange={setExportPreviewOpen}
        scope={exportScope}
      />
      <UsersFilters
        role={roleFilter}
        active={activeFilter}
        search={search}
        onRoleChange={handleRoleChange}
        onActiveChange={handleActiveChange}
        onSearchChange={(next) => {
          setSearch(next)
          setPage(1)
        }}
        disabled={isLoading}
      />
      <UsersStatCards totalUsers={totalCount} />
      <AuthFormError message={loadError ?? actionError} />
      <AuthFormError message={verifyError} />
      {verifySuccessMessage ? (
        <p
          role="status"
          className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          {verifySuccessMessage}
        </p>
      ) : null}
      <UsersTable
        users={users}
        totalCount={totalCount}
        page={page}
        limit={limit}
        totalPages={totalPages}
        start={start}
        end={end}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        isLoading={isLoading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onVerifyOtp={handleVerifyOtpRequest}
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
        onSelectionChange={setSelection}
      />

      <ConfirmDialog
        open={pendingVerifyUser !== null}
        onOpenChange={(open) => {
          if (!open && !verifyOtpMutation.isPending) {
            setPendingVerifyUser(null)
          }
        }}
        title={t("verify_otp.confirm_title")}
        description={
          pendingVerifyUser
            ? t("verify_otp.confirm_description", {
                name: getUserDisplayName(pendingVerifyUser),
              })
            : undefined
        }
        confirmLabel={t("verify_otp.confirm_button")}
        isLoading={verifyOtpMutation.isPending}
        onConfirm={handleConfirmVerifyOtp}
      />
    </div>
  )
}
