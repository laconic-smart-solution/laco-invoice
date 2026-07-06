import { Navigate, Outlet } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { useAuthStore } from "@/shared/stores/auth-store"

export function AdminRoute() {
  const user = useAuthStore((state) => state.user)

  if (user?.role !== "ADMIN") {
    return <Navigate to={ROUTES.dashboard.root} replace />
  }

  return <Outlet />
}
