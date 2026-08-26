import { useEffect } from "react"

import { ROUTES } from "@/app/constants/routes"
import { router } from "@/app/routes"
import { useAuthStore } from "@/shared/stores/auth-store"

export function AuthHydrate() {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    if (router.state.location.pathname !== ROUTES.errors.serverError) {
      void hydrate()
      return
    }

    useAuthStore.setState({ isHydrated: true })

    // Backend may be down on /500 — hydrate once after leaving that page.
    let hydratedAfterRecovery = false
    return router.subscribe((state) => {
      if (
        hydratedAfterRecovery ||
        state.location.pathname === ROUTES.errors.serverError
      ) {
        return
      }
      hydratedAfterRecovery = true
      void hydrate()
    })
  }, [hydrate])

  return null
}
