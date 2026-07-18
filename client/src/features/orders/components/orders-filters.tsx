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
import type { MarketplaceProductSource } from "@/features/products/types/product"
import {
  ORDER_STATUS_FILTER_OPTIONS,
  type OrderFiltersState,
} from "@/features/orders/types/order-filters"
import { buildProductSourceKey } from "@/shared/services/marketplace-product.service"

interface OrdersFiltersProps {
  sources: MarketplaceProductSource[]
  value: OrderFiltersState
  selectedSourceKey: string
  onChange: (value: OrderFiltersState) => void
  disabled?: boolean
}

export function OrdersFilters({
  sources,
  value,
  selectedSourceKey,
  onChange,
  disabled = false,
}: OrdersFiltersProps) {
  const { t } = useTranslation("orders")

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.store_label")}
          </Label>
          <Select
            value={selectedSourceKey}
            onValueChange={(sourceKey) =>
              onChange({ ...value, sourceKey: sourceKey === "all" ? "" : sourceKey })
            }
            disabled={disabled || sources.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.store_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.store_all")}</SelectItem>
              {sources.map((source) => {
                const key = buildProductSourceKey(source.storeId, source.marketplaceCode)
                return (
                  <SelectItem key={key} value={key}>
                    {source.label}
                  </SelectItem>
                )
              })}
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
              value={t("filters.date_range_value")}
              className="pr-9"
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
            value={value.orderStatus}
            onValueChange={(orderStatus) => onChange({ ...value, orderStatus })}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_FILTER_OPTIONS.map((option) => (
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
          disabled={disabled}
        >
          <ListFilter />
        </Button>
      </div>
    </section>
  )
}
