import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { UsersFilters } from "@/features/users/components/users-filters"
import { UsersHeader } from "@/features/users/components/users-header"
import { UsersStatCards } from "@/features/users/components/users-stat-cards"
import { UsersTable } from "@/features/users/components/users-table"
import type { AdminUser, UserRoleFilter } from "@/features/users/types/user"
import {
  getPaginationMeta,
  PAGE_QUERY_KEY,
  usePagination,
} from "@/shared/hooks/use-pagination"
import {
  getAdminUserErrorMessage,
  useUsersPageQuery,
  useVerifyUserOtpMutation,
} from "@/shared/queries/admin-user.query"
import type { UserRole } from "@/shared/types/auth.types"

const ROLE_QUERY_KEY = "role"
const USER_ROLES: UserRole[] = ["ADMIN", "OWNER", "MANAGER", "STAFF"]

function parseRoleFilter(value: string | null): UserRoleFilter {
  if (value && USER_ROLES.includes(value as UserRole)) {
    return value as UserRole
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
  const [pendingVerifyUser, setPendingVerifyUser] = useState<AdminUser | null>(null)
  const [verifySuccessMessage, setVerifySuccessMessage] = useState<string | null>(null)

  const { page, limit, setPage, setLimit } = usePagination()
  const verifyOtpMutation = useVerifyUserOtpMutation()

  const pageRequest = useMemo(
    () => ({
      pageNumber: page,
      pageSize: limit,
      filter:
        roleFilter === "all"
          ? undefined
          : {
              role: roleFilter,
            },
    }),
    [page, limit, roleFilter]
  )

  const { data, isLoading, isError, error } = useUsersPageQuery(pageRequest)

  const users = data?.data ?? []
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const loadError =
    isError && error
      ? getAdminUserErrorMessage(error, t("errors.load_failed"))
      : null

  const verifyError =
    verifyOtpMutation.isError && verifyOtpMutation.error
      ? getAdminUserErrorMessage(verifyOtpMutation.error, t("errors.verify_otp_failed"))
      : null

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
    [setSearchParams]
  )

  return (
    <div className="space-y-6 p-6">
      <UsersHeader />
      <UsersStatCards totalUsers={totalCount} />
      <UsersFilters role={roleFilter} onRoleChange={handleRoleChange} />
      <AuthFormError message={loadError} />
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
