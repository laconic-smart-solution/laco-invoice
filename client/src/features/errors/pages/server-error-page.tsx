import { ServerErrorContent } from "@/features/errors/components/server-error-content"
import { useAuthStore } from "@/shared/stores/auth-store"

export interface ServerErrorLocationState {
  message?: string
}

export function ServerErrorPage() {
  const isHydrated = useAuthStore((state) => state.isHydrated)

  if (!isHydrated) {
    return null
  }

  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <ServerErrorContent />
    </div>
  )
}
