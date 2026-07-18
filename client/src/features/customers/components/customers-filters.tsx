import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CustomerFiltersState } from "@/features/customers/types/customer"
import type { MarketplaceProductSource } from "@/features/products/types/product"
import { buildProductSourceKey } from "@/shared/services/marketplace-product.service"

interface CustomersFiltersProps {
  sources: MarketplaceProductSource[]
  value: CustomerFiltersState
  selectedSourceKey: string
  onChange: (value: CustomerFiltersState) => void
  disabled?: boolean
}

export function CustomersFilters({
  sources,
  value,
  selectedSourceKey,
  onChange,
  disabled = false,
}: CustomersFiltersProps) {
  const { t } = useTranslation("customers")

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-end">
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
            <SelectTrigger className="w-full max-w-md">
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
          <Label className="text-xs text-muted-foreground" htmlFor="customers-search">
            {t("filters.search_label")}
          </Label>
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="customers-search"
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
      </div>
    </section>
  )
}
