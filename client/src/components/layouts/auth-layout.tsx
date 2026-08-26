import { Outlet } from "react-router-dom"

import { AppBreadcrumb } from "@/components/core/app-breadcrumb"
import { AppDocumentTitle } from "@/components/core/app-document-title"

export function AuthLayout() {
  return (
    <div className="min-h-svh bg-muted/30 text-foreground">
      <AppDocumentTitle />
      <div className="border-b border-border bg-background px-6 py-3">
        <AppBreadcrumb />
      </div>
      <Outlet />
    </div>
  )
}
