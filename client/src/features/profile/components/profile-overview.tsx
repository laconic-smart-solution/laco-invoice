import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { MeProfile, UserRole } from "@/shared/types/auth.types"

interface ProfileOverviewProps {
  profile: MeProfile
}

function getRoleLabelKey(role: UserRole): string {
  return `roles.${role.toLowerCase()}`
}

function getRoleBadgeVariant(role: UserRole): "default" | "secondary" | "outline" {
  if (role === "ADMIN" || role === "OWNER") {
    return "default"
  }
  if (role === "MANAGER") {
    return "secondary"
  }
  return "outline"
}

export function ProfileOverview({ profile }: ProfileOverviewProps) {
  const { t } = useTranslation("profile")

  const fields = [
    {
      key: "fullName",
      label: t("overview.full_name"),
      value: profile.fullName?.trim() || t("overview.empty_value"),
    },
    {
      key: "email",
      label: t("overview.email"),
      value: profile.email,
    },
  ]

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {t("overview.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("overview.subtitle")}</p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {field.label}
            </dt>
            <dd className="text-sm text-foreground">{field.value}</dd>
          </div>
        ))}

        <div className="space-y-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("overview.role")}
          </dt>
          <dd>
            <Badge variant={getRoleBadgeVariant(profile.role)}>
              {t(getRoleLabelKey(profile.role))}
            </Badge>
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("overview.status")}
          </dt>
          <dd>
            <Badge
              variant={profile.active ? "outline" : "destructive"}
              className={
                profile.active
                  ? "border-success/20 bg-success/10 text-success"
                  : undefined
              }
            >
              {profile.active
                ? t("overview.status_active")
                : t("overview.status_inactive")}
            </Badge>
          </dd>
        </div>
      </dl>
    </section>
  )
}
