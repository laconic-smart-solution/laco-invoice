import { useEffect, useRef } from "react"
import { PanelLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { isManualInvoiceReadyToIssue } from "@/features/flow/util/manual-invoice"
import { cn } from "@/lib/utils"
import type { Invoice } from "@/features/invoices/types/invoice"

interface ManualInvoiceQueueRailProps {
  invoices: Invoice[]
  selectedId: number | null
  alertCount: number
  onSelect: (id: number) => void
  onExpand: () => void
}

function railTone(invoice: Invoice) {
  if (invoice.status === "DRAFT") {
    return isManualInvoiceReadyToIssue(invoice) ? "warning" : "neutral"
  }
  return "success"
}

export function ManualInvoiceQueueRail({
  invoices,
  selectedId,
  alertCount,
  onSelect,
  onExpand,
}: ManualInvoiceQueueRailProps) {
  const { t } = useTranslation("flow")
  const selectedRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" })
  }, [selectedId])

  return (
    <aside className="flow-queue-rail" aria-label={t("manual.queue.label")}>
      <button
        type="button"
        className="flow-queue-rail__expand"
        aria-label={t("show_queue")}
        title={t("show_queue")}
        onClick={onExpand}
      >
        <PanelLeft className="size-4" aria-hidden />
        {alertCount > 0 ? (
          <span className="flow-queue-rail__badge">{alertCount}</span>
        ) : null}
      </button>
      <div
        className="flow-queue-rail__ids"
        role="listbox"
        aria-label={t("manual.queue.label")}
      >
        {invoices.map((invoice) => {
          const isSelected = selectedId === invoice.id
          const tone = railTone(invoice)
          return (
            <button
              key={invoice.id}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={t("manual.queue.select_invoice", { id: invoice.id })}
              className={cn(
                "flow-queue-rail__id",
                `flow-queue-rail__id--${tone}`,
                isSelected && "flow-queue-rail__id--selected"
              )}
              onClick={() => onSelect(invoice.id)}
            >
              {invoice.id}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
