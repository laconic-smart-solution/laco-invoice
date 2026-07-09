import { SidebarBrand } from "@/components/core/sidebar/sidebar-brand"
import { SidebarLogoutButton } from "@/components/core/sidebar/sidebar-logout-button"
import { SidebarNav } from "@/components/core/sidebar/sidebar-nav"
import { SidebarUserCard } from "@/components/core/sidebar/sidebar-user-card"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/shared/stores/sidebar-store"

export function Sidebar() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed)

  return (
    <aside
      id="app-sidebar"
      data-collapsed={isCollapsed}
      className={cn(
        "flex h-svh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-in-out",
        isCollapsed ? "w-[4.5rem]" : "w-60"
      )}
    >
      <SidebarBrand isCollapsed={isCollapsed} />
      <SidebarNav isCollapsed={isCollapsed} />
      <div className={cn("mt-auto space-y-2", isCollapsed ? "p-2" : "p-3")}>
        <SidebarUserCard isCollapsed={isCollapsed} />
        <SidebarLogoutButton isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}
