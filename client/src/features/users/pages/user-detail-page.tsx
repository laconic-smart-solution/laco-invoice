import { CalendarCheck, Clock, Mail, User } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getAdminUserErrorMessage,
  useAdminUserDetailQuery,
} from "@/shared/queries/admin-user.query"
import { useLocaleStore } from "@/shared/stores/locale-store"
import type { UserRole } from "@/shared/types/auth.types"
import { formatDateTime } from "@/util/format"

interface DetailRowProps {
  icon: LucideIcon
  label: string
  value: string
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <span className="truncate text-right text-sm text-foreground">{value}</span>
    </div>
  )
}

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

export function UserDetailPage() {
  const { t } = useTranslation("users")
  const { userId = "" } = useParams()
  const locale = useLocaleStore((state) => state.locale)
  const parsedUserId = Number.parseInt(userId, 10)
  const isValidId = Number.isFinite(parsedUserId) && parsedUserId > 0

  const {
    data: user,
    isLoading,
    error,
  } = useAdminUserDetailQuery(isValidId ? parsedUserId : 0)

  if (!isValidId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold">{t("detail.not_found_title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("detail.not_found_description")}
        </p>
        <Button asChild>
          <Link to={ROUTES.dashboard.users}>{t("detail.back_to_users")}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">{t("detail.loading")}</div>
    )
  }

  if (error != null || !user) {
    const errorMessage = error
      ? getAdminUserErrorMessage(error, t("detail.not_found_description"))
      : t("detail.not_found_description")

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold">{t("detail.not_found_title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{errorMessage}</p>
        <Button asChild>
          <Link to={ROUTES.dashboard.users}>{t("detail.back_to_users")}</Link>
        </Button>
      </div>
    )
  }

  const displayName = user.fullName?.trim() || user.email
  const fullName = user.fullName?.trim() || t("detail.empty_value")

  return (
    <div className="space-y-6 p-6">
      <Button variant="link" className="h-auto p-0 text-muted-foreground" asChild>
        <Link to={ROUTES.dashboard.users}>{t("detail.back_to_users")}</Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-14">
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
              {getInitials(user.fullName, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <h1 className="font-heading truncate text-2xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {t(getRoleLabelKey(user.role))}
          </Badge>
          <Badge
            variant="outline"
            className={
              user.active
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }
          >
            {user.active ? t("table.status.active") : t("table.status.inactive")}
          </Badge>
        </div>
      </div>

      <section className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        <DetailRow
          icon={User}
          label={t("detail.fields.full_name")}
          value={fullName}
        />
        <DetailRow
          icon={Mail}
          label={t("detail.fields.email")}
          value={user.email}
        />
        <DetailRow
          icon={CalendarCheck}
          label={t("detail.fields.joined")}
          value={formatDateTime(user.createdAt, locale)}
        />
        <DetailRow
          icon={Clock}
          label={t("detail.fields.last_updated")}
          value={formatDateTime(user.updatedAt, locale)}
        />
      </section>
    </div>
  )
}
