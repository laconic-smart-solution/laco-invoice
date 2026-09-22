import { Navigate, Outlet, useLocation } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Loader } from "@/components/core/loader"
import { useAppKeyboardShortcuts } from "@/shared/hooks/use-app-keyboard-shortcuts"
import { useAuthStore } from "@/shared/stores/auth-store"

function ProtectedAppShell() {
  useAppKeyboardShortcuts()
  return <Outlet />
}

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const location = useLocation()

  if (!isHydrated) {
    return <Loader />
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

  return <ProtectedAppShell />
}
