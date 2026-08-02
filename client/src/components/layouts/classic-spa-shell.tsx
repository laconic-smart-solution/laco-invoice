import type { ReactNode } from "react"

import { OrderBulkGeneratePanel } from "@/components/common/order-bulk-generate-panel"
import { ClassicSpaChrome } from "@/components/core/classic-spa/classic-spa-chrome"

interface ClassicSpaShellProps {
  children: ReactNode
}

/** Dense top-nav SPA shell (Hongta-style) — no left sidebar. */
export function ClassicSpaShell({ children }: ClassicSpaShellProps) {
  return (
    <div className="relative flex min-h-svh max-h-svh flex-col bg-background">
      <ClassicSpaChrome />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
      <OrderBulkGeneratePanel />
    </div>
  )
}
