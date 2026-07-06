import { RefreshCw } from "lucide-react"
import { useState } from "react"
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
  ERP_STATUS_FILTER_OPTIONS,
  MARKETPLACE_SOURCE_OPTIONS,
} from "@/features/products/data/mock-products"
import type { ProductErpFilter } from "@/features/products/types/product"
import { cn } from "@/lib/utils"

export function ProductsFilters() {
  const { t } = useTranslation("products")
  const [marketplace, setMarketplace] = useState("tiktok_fashion_hh")
  const [erpStatus, setErpStatus] = useState<ProductErpFilter>("all")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")

  const handleReset = () => {
    setMarketplace("tiktok_fashion_hh")
    setErpStatus("all")
    setPriceMin("")
    setPriceMax("")
  }

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.marketplace_label")}
          </Label>
          <Select value={marketplace} onValueChange={setMarketplace}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKETPLACE_SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
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
                variant={erpStatus === option.value ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 flex-1 rounded-sm text-xs",
                  erpStatus !== option.value && "text-muted-foreground"
                )}
                onClick={() => setErpStatus(option.value)}
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
              value={priceMin}
              onChange={(event) => setPriceMin(event.target.value)}
              className="h-9"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              placeholder={t("filters.price_max")}
              value={priceMax}
              onChange={(event) => setPriceMax(event.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <Button className="shrink-0" onClick={handleReset}>
          <RefreshCw data-icon="inline-start" />
          {t("filters.reset_view")}
        </Button>
      </div>
    </section>
  )
}
