import { ListFilter, Search } from "lucide-react"
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
import type { Store } from "@/features/stores/types/store"
import {
  ORDER_SOURCE_FILTER_OPTIONS,
  ORDER_STATUS_FILTER_OPTIONS,
  type OrderFiltersState,
} from "@/features/orders/types/order-filters"
import { cn } from "@/lib/utils"

interface OrdersFiltersProps {
  stores: Store[]
  value: OrderFiltersState
  onChange: (value: OrderFiltersState) => void
  disabled?: boolean
  hideSourceFilter?: boolean
}

export function OrdersFilters({
  stores,
  value,
  onChange,
  disabled = false,
  hideSourceFilter = false,
}: OrdersFiltersProps) {
  const { t } = useTranslation("orders")
  const selectedStoreId = value.storeId || "all"

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div
        className={cn(
          "grid gap-4 md:items-end",
          hideSourceFilter
            ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            : "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
        )}
      >
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.store_label")}
          </Label>
          <Select
            value={selectedStoreId}
            onValueChange={(storeId) =>
              onChange({ ...value, storeId: storeId === "all" ? "" : storeId })
            }
            disabled={disabled || stores.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.store_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.store_all")}</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground" htmlFor="orders-search">
            {t("filters.search_label")}
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="orders-search"
              type="search"
              data-shortcut-search
              placeholder={t("filters.search_placeholder")}
              value={value.search}
              onChange={(event) =>
                onChange({ ...value, search: event.target.value })
              }
              className="h-9 pl-8"
              disabled={disabled}
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

        {!hideSourceFilter ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("filters.source_label")}
            </Label>
            <Select
              value={value.sourceType}
              onValueChange={(sourceType) => onChange({ ...value, sourceType })}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_SOURCE_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

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
