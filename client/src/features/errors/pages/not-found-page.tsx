import { Receipt } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DashboardShell } from "@/components/layouts/dashboard-layout"
import { NotFoundContent } from "@/features/errors/components/not-found-content"
import { useAuthStore } from "@/shared/stores/auth-store"

export function NotFoundPage() {
  const { t } = useTranslation(["common", "sidebar"])
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  if (!isHydrated) {
    return null
  }

  if (isAuthenticated) {
    return (
      <DashboardShell>
        <NotFoundContent isAuthenticated variant="embedded" />
      </DashboardShell>
    )
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <Link
          to={ROUTES.auth.login}
          className="inline-flex items-center gap-3 rounded-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
        >
          <span className="flex size-10 items-center justify-center bg-primary text-primary-foreground">
            <Receipt className="size-5" aria-hidden />
          </span>
          <span className="text-left">
            <span className="block font-heading text-base font-semibold text-primary">
              {t("common:app.name")}
            </span>
            <span className="block text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              {t("sidebar:tagline")}
            </span>
          </span>
        </Link>
      </header>
      <NotFoundContent isAuthenticated={false} variant="standalone" />
    </div>
  )
}
