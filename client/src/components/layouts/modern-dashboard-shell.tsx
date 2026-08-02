import type { ReactNode } from "react"

import { OrderBulkGeneratePanel } from "@/components/common/order-bulk-generate-panel"
import { Navbar } from "@/components/core/navbar/navbar"
import { Sidebar } from "@/components/core/sidebar/sidebar"
import { SidebarToggle } from "@/components/core/sidebar/sidebar-toggle"
import { cn } from "@/lib/utils"
import { useSidebarKeyboardToggle } from "@/shared/hooks/use-sidebar-keyboard-toggle"
import { useSidebarStore } from "@/shared/stores/sidebar-store"

interface ModernDashboardShellProps {
  children: ReactNode
}

/** Current Laco shell: collapsible sidebar + top navbar. */
export function ModernDashboardShell({ children }: ModernDashboardShellProps) {
  useSidebarKeyboardToggle()
  const isCollapsed = useSidebarStore((state) => state.isCollapsed)

  return (
    <div className="relative flex min-h-svh max-h-svh bg-background">
      <div className="relative z-40 shrink-0">
        <Sidebar />
      </div>
      <div
        className={cn(
          "pointer-events-none absolute top-[4.75rem] z-50 -translate-x-1/2 -translate-y-1/2 motion-safe:transition-[left] motion-safe:duration-200 motion-safe:ease-in-out",
          isCollapsed ? "left-[4.5rem]" : "left-60"
        )}
      >
        <SidebarToggle className="pointer-events-auto" />
      </div>
      <div className="relative z-0 flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <OrderBulkGeneratePanel />
    </div>
  )
}
