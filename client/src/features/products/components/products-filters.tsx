import { RefreshCw } from "lucide-react"
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
import type { MarketplaceProductSource, ProductFiltersState } from "@/features/products/types/product"
import { ERP_STATUS_FILTER_OPTIONS } from "@/features/products/util/erp-status"
import { buildProductSourceKey } from "@/shared/services/marketplace-product.service"
import { cn } from "@/lib/utils"

interface ProductsFiltersProps {
  sources: MarketplaceProductSource[]
  value: ProductFiltersState
  selectedSourceKey: string
  onChange: (value: ProductFiltersState) => void
  disabled?: boolean
}

export function ProductsFilters({
  sources,
  value,
  selectedSourceKey,
  onChange,
  disabled = false,
}: ProductsFiltersProps) {
  const { t } = useTranslation("products")

  const handleReset = () => {
    onChange({
      sourceKey: "",
      erpStatus: "all",
      priceMin: "",
      priceMax: "",
    })
  }

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.marketplace_label")}
          </Label>
          <Select
            value={selectedSourceKey}
            onValueChange={(sourceKey) => onChange({ ...value, sourceKey })}
            disabled={disabled || sources.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("filters.marketplace_placeholder")} />
            </SelectTrigger>
            <SelectContent>
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
                disabled
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
              onChange={(event) => onChange({ ...value, priceMin: event.target.value })}
              className="h-9"
              disabled={disabled}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              placeholder={t("filters.price_max")}
              value={value.priceMax}
              onChange={(event) => onChange({ ...value, priceMax: event.target.value })}
              className="h-9"
              disabled={disabled}
            />
          </div>
        </div>

        <Button className="shrink-0" onClick={handleReset} disabled={disabled}>
          <RefreshCw data-icon="inline-start" />
          {t("filters.reset_view")}
        </Button>
      </div>
    </section>
  )
}
