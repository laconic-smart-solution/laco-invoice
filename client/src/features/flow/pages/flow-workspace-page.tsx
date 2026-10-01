import { useRef, useState, type KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"

import { FlowDesktopShell } from "@/features/flow/components/flow-desktop-shell"
import { ManualInvoiceWorkspace } from "@/features/flow/components/manual-invoice-workspace"
import { cn } from "@/lib/utils"

/**
 * UI-only Order → Voucher flow workspace prototype.
 * Route: /app/flow — full-bleed, outside DashboardLayout.
 * i18n and real APIs land when this pattern is ported into production pages.
 */
export function FlowWorkspacePage() {
  const { t } = useTranslation("flow")
  const [activeTab, setActiveTab] = useState<"orders" | "manual">("orders")
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = activeTab === "orders" ? 0 : 1
    let nextIndex: number
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % 2
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + 2) % 2
    else if (event.key === "Home") nextIndex = 0
    else if (event.key === "End") nextIndex = 1
    else return
    event.preventDefault()
    setActiveTab(nextIndex === 0 ? "orders" : "manual")
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="h-dvh overflow-hidden bg-background">
      <div
        role="tablist"
        aria-label={t("tabs.label")}
        className="flex h-12 items-end gap-1 border-b border-border bg-card px-4"
      >
        {(["orders", "manual"] as const).map((tab, index) => (
          <button
            key={tab}
            ref={(node) => {
              tabRefs.current[index] = node
            }}
            id={`flow-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`flow-panel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1}
            className={cn(
              "h-10 border-b-2 px-4 text-sm font-semibold text-muted-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent hover:text-foreground"
            )}
            onClick={() => setActiveTab(tab)}
            onKeyDown={handleTabKeyDown}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>
      <section
        id="flow-panel-orders"
        role="tabpanel"
        aria-labelledby="flow-tab-orders"
        hidden={activeTab !== "orders"}
        className="h-[calc(100dvh-3rem)]"
      >
        <FlowDesktopShell tabbed />
      </section>
      <section
        id="flow-panel-manual"
        role="tabpanel"
        aria-labelledby="flow-tab-manual"
        hidden={activeTab !== "manual"}
        className="h-[calc(100dvh-3rem)]"
      >
        <ManualInvoiceWorkspace />
      </section>
    </div>
  )
}
