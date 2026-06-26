import { SidebarBrand } from "@/components/core/sidebar/sidebar-brand"
import { SidebarNav } from "@/components/core/sidebar/sidebar-nav"
import { SidebarUserCard } from "@/components/core/sidebar/sidebar-user-card"

export function Sidebar() {
  return (
    <aside className="flex h-svh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarBrand />
      <SidebarNav />
      <div className="mt-auto p-3">
        <SidebarUserCard />
      </div>
    </aside>
  )
}
