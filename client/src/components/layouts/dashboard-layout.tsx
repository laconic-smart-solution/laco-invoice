import type { ReactNode } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { AppBreadcrumb } from "@/components/core/app-breadcrumb"
import { AppDocumentTitle } from "@/components/core/app-document-title"
import { ClassicSpaShell } from "@/components/layouts/classic-spa-shell"
import { ModernDashboardShell } from "@/components/layouts/modern-dashboard-shell"
import { ClassicWorkspace } from "@/features/classic-spa/components/classic-workspace"
import { parseClassicRoute } from "@/features/classic-spa/util/classic-route"
import { useUiModeStore } from "@/shared/stores/ui-mode-store"

interface DashboardShellProps {
  children: ReactNode
}

/** Picks modern (sidebar) or classic (top-nav) chrome from persisted UI mode. */
export function DashboardShell({ children }: DashboardShellProps) {
  const mode = useUiModeStore((state) => state.mode)

  if (mode === "classic") {
    return <ClassicSpaShell>{children}</ClassicSpaShell>
  }

  return <ModernDashboardShell>{children}</ModernDashboardShell>
}

export function DashboardLayout() {
  const mode = useUiModeStore((state) => state.mode)
  const { pathname } = useLocation()
  const classicRoute = mode === "classic" ? parseClassicRoute(pathname) : null

  if (classicRoute) {
    return (
      <DashboardShell>
        <AppDocumentTitle />
        <ClassicWorkspace route={classicRoute} />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <AppDocumentTitle />
      {mode === "modern" ? (
        <div className="bg-background px-6 py-3">
          <AppBreadcrumb />
        </div>
      ) : null}
      {mode === "classic" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      ) : (
        <Outlet />
      )}
    </DashboardShell>
  )
}
