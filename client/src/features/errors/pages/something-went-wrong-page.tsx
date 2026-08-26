import { Receipt } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { DashboardShell } from "@/components/layouts/dashboard-layout"
import { SomethingWentWrongContent } from "@/features/errors/components/something-went-wrong-content"
import { useAuthStore } from "@/shared/stores/auth-store"

function logRouteError(error: unknown): void {
  if (import.meta.env.DEV) {
    console.error("[SomethingWentWrong]", error)
    return
  }

  if (isRouteErrorResponse(error)) {
    console.error("[SomethingWentWrong]", error.status, error.statusText)
    return
  }

  if (error instanceof Error) {
    console.error("[SomethingWentWrong]", error.name, error.message)
    return
  }

  console.error("[SomethingWentWrong]", error)
}

export function SomethingWentWrongPage() {
  const { t } = useTranslation(["common", "sidebar"])
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const routeError = useRouteError()

  useEffect(() => {
    logRouteError(routeError)
  }, [routeError])

  if (!isHydrated) {
    return null
  }

  if (isAuthenticated) {
    return (
      <DashboardShell>
        <SomethingWentWrongContent isAuthenticated variant="embedded" />
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
      <SomethingWentWrongContent
        isAuthenticated={false}
        variant="standalone"
      />
    </div>
  )
}
