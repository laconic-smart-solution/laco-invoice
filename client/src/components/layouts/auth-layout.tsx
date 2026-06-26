import { Outlet } from "react-router-dom"

import { AppBreadcrumb } from "@/components/core/app-breadcrumb"

export function AuthLayout() {
  return (
    <div className="min-h-svh bg-muted/30 text-foreground">
      <div className="border-b border-border bg-background px-6 py-3">
        <AppBreadcrumb />
      </div>
      <Outlet />
    </div>
  )
}
