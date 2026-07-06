import { Navigate, Outlet, useLocation } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { useAuthStore } from "@/shared/stores/auth-store"

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const location = useLocation()

  if (!isHydrated) {
    return null
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`)
    return (
      <Navigate
        to={`${ROUTES.auth.login}?returnUrl=${returnUrl}`}
        replace
      />
    )
  }

  return <Outlet />
}
