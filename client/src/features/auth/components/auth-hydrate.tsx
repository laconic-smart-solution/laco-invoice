import { useEffect } from "react"

import { useAuthStore } from "@/shared/stores/auth-store"

export function AuthHydrate() {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return null
}
