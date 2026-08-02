import { useEffect } from "react"

import { ROUTES } from "@/app/constants/routes"
import { useAuthStore } from "@/shared/stores/auth-store"

export function AuthHydrate() {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    if (window.location.pathname === ROUTES.errors.serverError) {
      useAuthStore.setState({ isHydrated: true })
      return
    }

    void hydrate()
  }, [hydrate])

  return null
}
