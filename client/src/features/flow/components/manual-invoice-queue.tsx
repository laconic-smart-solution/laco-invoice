import { PanelLeftClose, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ManualInvoiceQueueFilter } from "@/features/flow/data/flow-constants"
import type { Invoice } from "@/features/invoices/types/invoice"
import { cn } from "@/lib/utils"

interface ManualInvoiceQueueProps {
  invoices: Invoice[]
  totalCount: number
  alertCount: number
  selectedId: number | null
  search: string
  filter: ManualInvoiceQueueFilter
  isLoading?: boolean
  isFetching: boolean
  onSearchChange: (value: string) => void
  onFilterChange: (filter: ManualInvoiceQueueFilter) => void
  onSelect: (id: number) => void
  onHide?: () => void
}

const FILTERS: ManualInvoiceQueueFilter[] = [
  "all",
  "draft",
  "ready",
  "issued",
  "has_voucher",
]

export function ManualInvoiceQueue({
  invoices,
  totalCount,
  alertCount,
  selectedId,
  search,
  filter,
  isLoading = false,
  isFetching,
  onSearchChange,
  onFilterChange,
  onSelect,
  onHide,
}: ManualInvoiceQueueProps) {
  const { t } = useTranslation("flow")

  return (
    <aside className="flow-queue" aria-label={t("manual.queue.label")}>
      <div className="flow-queue__header">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("manual.queue.title")}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {isFetching && !isLoading
              ? t("manual.queue.fetching")
              : t("manual.queue.count", {
                  filtered: invoices.length,
                  total: totalCount,
                })}
          </p>
        </div>
        <div className="flow-queue__header-actions">
          <span className="flow-count-badge">
            {t("manual.queue.alerts", { count: alertCount })}
          </span>
          {onHide ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              aria-label={t("hide_queue")}
              title={t("hide_queue")}
              onClick={onHide}
            >
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flow-queue__search">
        <Search
          aria-hidden
          className="absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("manual.queue.search")}
          aria-label={t("manual.queue.search")}
          data-shortcut-search="manual"
          className="pl-8"
        />
      </div>
      <div className="flow-queue__filters flex-wrap">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              "flow-filter-chip",
              item === filter && "flow-filter-chip--active"
            )}
            aria-pressed={item === filter}
            onClick={() => onFilterChange(item)}
          >
            {t(`manual.queue.filters.${item}`)}
          </button>
        ))}
      </div>
      <div className="flow-queue__list">
        {invoices.length ? (
          invoices.map((invoice) => (
            <button
              key={invoice.id}
              type="button"
              className={cn(
                "flow-queue-card",
                selectedId === invoice.id && "flow-queue-card--selected"
              )}
              aria-pressed={selectedId === invoice.id}
              onClick={() => onSelect(invoice.id)}
            >
              <span className="flex items-start gap-2">
                <span
                  className={cn(
                    "flow-status-dot",
                    invoice.status === "DRAFT"
                      ? "flow-status-dot--warning"
                      : "flow-status-dot--success"
                  )}
                  aria-hidden
                />
                <span className="min-w-0">
                  <strong className="block truncate text-xs">
                    {invoice.title}
                  </strong>
                  <small className="mt-1 block text-muted-foreground">
                    {invoice.invoiceNumber || t("manual.queue.unnumbered")} ·{" "}
                    {t(`manual.statuses.${invoice.status.toLowerCase()}`)}
                  </small>
                  <small className="mt-1 block font-mono text-muted-foreground">
                    {invoice.currency} {invoice.grandTotal.toFixed(2)}
                  </small>
                </span>
              </span>
            </button>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            {t("manual.queue.empty")}
          </p>
        )}
      </div>
    </aside>
  )
}
