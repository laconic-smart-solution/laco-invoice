import type { ReactNode } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { AppBreadcrumb } from "@/components/core/app-breadcrumb"
import { ClassicSpaShell } from "@/components/layouts/classic-spa-shell"
import { ModernDashboardShell } from "@/components/layouts/modern-dashboard-shell"
import { ClassicWorkspace } from "@/features/classic-spa/components/classic-workspace"
import { parseClassicRoute } from "@/features/classic-spa/util/classic-route"
import { useAppKeyboardShortcuts } from "@/shared/hooks/use-app-keyboard-shortcuts"
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
  useAppKeyboardShortcuts()
  const mode = useUiModeStore((state) => state.mode)
  const { pathname } = useLocation()
  const classicRoute = mode === "classic" ? parseClassicRoute(pathname) : null

  if (classicRoute) {
    return (
      <DashboardShell>
        <ClassicWorkspace route={classicRoute} />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      {mode === "modern" ? (
        <div className="bg-background px-6 py-3">
          <AppBreadcrumb />
        </div>
      ) : null}
      <Outlet />
    </DashboardShell>
  )
}
