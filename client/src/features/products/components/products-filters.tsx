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
import type { ProductFiltersState } from "@/features/products/types/product"
import type { Store } from "@/features/stores/types/store"
import { ERP_STATUS_FILTER_OPTIONS } from "@/features/products/util/erp-status"

interface ProductsFiltersProps {
  stores?: Store[]
  value: ProductFiltersState
  onChange: (value: ProductFiltersState) => void
  disabled?: boolean
}

export function ProductsFilters({
  stores = [],
  value,
  onChange,
  disabled = false,
}: ProductsFiltersProps) {
  const { t } = useTranslation("products")
  const selectedStoreId = value.storeId || "all"
  const storeOptions = Array.isArray(stores) ? stores : []

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.store_label")}
          </Label>
          <Select
            value={selectedStoreId}
            onValueChange={(storeId) =>
              onChange({ ...value, storeId: storeId === "all" ? "" : storeId })
            }
            disabled={disabled || storeOptions.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.store_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.store_all")}</SelectItem>
              {storeOptions.map((store) => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground" htmlFor="products-search">
            {t("filters.search_label")}
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="products-search"
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
            {t("filters.erp_status_label")}
          </Label>
          <Select
            value={value.erpStatus}
            onValueChange={(erpStatus) =>
              onChange({
                ...value,
                erpStatus: erpStatus as ProductFiltersState["erpStatus"],
              })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ERP_STATUS_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.price_range_label")}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder={t("filters.price_min")}
              value={value.priceMin}
              onChange={(event) =>
                onChange({ ...value, priceMin: event.target.value })
              }
              className="h-9"
              disabled={disabled}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              placeholder={t("filters.price_max")}
              value={value.priceMax}
              onChange={(event) =>
                onChange({ ...value, priceMax: event.target.value })
              }
              className="h-9"
              disabled={disabled}
            />
          </div>
        </div>

        <Button
          type="button"
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
