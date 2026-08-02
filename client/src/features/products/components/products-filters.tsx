import { RefreshCw, Search } from "lucide-react"
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
import { cn } from "@/lib/utils"

interface ProductsFiltersProps {
  stores?: Store[]
  value: ProductFiltersState
  onChange: (value: ProductFiltersState) => void
  showAdvanced?: boolean
  disabled?: boolean
}

export function ProductsFilters({
  stores = [],
  value,
  onChange,
  showAdvanced = false,
  disabled = false,
}: ProductsFiltersProps) {
  const { t } = useTranslation("products")
  const selectedStoreId = value.storeId || "all"
  const storeOptions = Array.isArray(stores) ? stores : []

  const handleReset = () => {
    onChange({
      storeId: "",
      search: "",
      erpStatus: "all",
      priceMin: "",
      priceMax: "",
    })
  }

  return (
    <section
      id="products-filters"
      className="border border-border bg-card p-4 shadow-sm"
    >
      <div
        className={cn(
          "grid gap-4 md:items-end",
          showAdvanced
            ? "lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto]"
            : "md:grid-cols-[minmax(0,1fr)_auto]"
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
            disabled={disabled || storeOptions.length === 0}
          >
            <SelectTrigger className="w-full max-w-md">
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

        {showAdvanced ? (
          <>
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
              <div className="flex rounded-md border border-border p-0.5">
                {ERP_STATUS_FILTER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={value.erpStatus === option.value ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 flex-1 rounded-sm text-xs",
                      value.erpStatus !== option.value && "text-muted-foreground"
                    )}
                    onClick={() => onChange({ ...value, erpStatus: option.value })}
                    disabled={disabled}
                  >
                    {t(option.labelKey)}
                  </Button>
                ))}
              </div>
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

            <Button className="shrink-0" onClick={handleReset} disabled={disabled}>
              <RefreshCw data-icon="inline-start" />
              {t("filters.reset_view")}
            </Button>
          </>
        ) : null}
      </div>
    </section>
  )
}
