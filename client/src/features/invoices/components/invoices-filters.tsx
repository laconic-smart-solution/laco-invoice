import { Calendar, ListFilter } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  INVOICE_MARKETPLACE_FILTER_OPTIONS,
  INVOICE_STATUS_FILTER_OPTIONS,
} from "@/features/invoices/constants/invoice-filter-options"
import type { InvoiceStatus } from "@/features/invoices/types/invoice"

interface InvoicesFiltersProps {
  status: "all" | InvoiceStatus
  onStatusChange: (status: "all" | InvoiceStatus) => void
}

export function InvoicesFilters({
  status,
  onStatusChange,
}: InvoicesFiltersProps) {
  const { t } = useTranslation("invoices")

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.marketplace_label")}
          </Label>
          <Select defaultValue="all" disabled>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_MARKETPLACE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.date_range_label")}
          </Label>
          <div className="relative">
            <Input
              readOnly
              value={t("filters.date_range_placeholder")}
              className="pr-9"
              disabled
            />
            <Calendar
              className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.status_label")}
          </Label>
          <Select
            value={status}
            onValueChange={(value) =>
              onStatusChange(value as "all" | InvoiceStatus)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label={t("filters.more_filters")}
          disabled
        >
          <ListFilter />
        </Button>
      </div>
    </section>
  )
}
