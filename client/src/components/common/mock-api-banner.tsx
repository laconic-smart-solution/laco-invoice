import { env } from "@/app/config/env"

export function MockApiBanner() {
  if (!env.useMockApi) {
    return null
  }

  return (
    <div
      className="fixed bottom-3 right-3 z-[100] rounded-md border border-warning/40 bg-warning/15 px-3 py-1.5 text-xs font-medium text-warning shadow-sm"
      role="status"
    >
      Mock API — no backend
    </div>
  )
}
