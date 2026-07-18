import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"

import { AppBreadcrumb } from "@/components/core/app-breadcrumb"
import { Navbar } from "@/components/core/navbar/navbar"
import { Sidebar } from "@/components/core/sidebar/sidebar"
import { SidebarToggle } from "@/components/core/sidebar/sidebar-toggle"
import { useSidebarKeyboardToggle } from "@/shared/hooks/use-sidebar-keyboard-toggle"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  useSidebarKeyboardToggle()

  return (
    <div className="flex min-h-svh max-h-svh bg-background">
      <div className="relative z-40 shrink-0">
        <Sidebar />
        <SidebarToggle className="absolute top-[4.75rem] right-0 translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  return (
    <DashboardShell>
      <div className="bg-background px-6 py-3">
        <AppBreadcrumb />
      </div>
      <Outlet />
    </DashboardShell>
  )
}
