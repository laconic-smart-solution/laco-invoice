import { Outlet } from "react-router-dom"

import { AppBreadcrumb } from "@/components/core/app-breadcrumb"
import { Navbar } from "@/components/core/navbar/navbar"
import { Sidebar } from "@/components/core/sidebar/sidebar"

export function DashboardLayout() {
  return (
    <div className="flex min-h-svh max-h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className=" bg-background px-6 py-3">
            <AppBreadcrumb />
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
