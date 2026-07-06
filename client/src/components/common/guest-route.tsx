import { Navigate, Outlet } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { useAuthStore } from "@/shared/stores/auth-store"

export function GuestRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)

  if (!isHydrated) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <Outlet />
}
