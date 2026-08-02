import { ServerErrorContent } from "@/features/errors/components/server-error-content"

export interface ServerErrorLocationState {
  message?: string
}

export function ServerErrorPage() {
  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <ServerErrorContent />
    </div>
  )
}
