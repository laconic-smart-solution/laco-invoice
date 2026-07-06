import { SidebarBrand } from "@/components/core/sidebar/sidebar-brand"
import { SidebarLogoutButton } from "@/components/core/sidebar/sidebar-logout-button"
import { SidebarNav } from "@/components/core/sidebar/sidebar-nav"
import { SidebarUserCard } from "@/components/core/sidebar/sidebar-user-card"

export function Sidebar() {
  return (
    <aside className="flex h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarBrand />
      <SidebarNav />
      <div className="mt-auto space-y-2 p-3">
        <SidebarUserCard />
        <SidebarLogoutButton />
      </div>
    </aside>
  )
}
