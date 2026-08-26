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
import type { CustomerFiltersState } from "@/features/customers/types/customer"
import type { Store } from "@/features/stores/types/store"

const GENDER_FILTER_OPTIONS = [
  { value: "all", labelKey: "filters.gender.all" },
  { value: "male", labelKey: "filters.gender.male" },
  { value: "female", labelKey: "filters.gender.female" },
] as const

interface CustomersFiltersProps {
  stores: Store[]
  value: CustomerFiltersState
  onChange: (value: CustomerFiltersState) => void
  disabled?: boolean
}

export function CustomersFilters({
  stores = [],
  value,
  onChange,
  disabled = false,
}: CustomersFiltersProps) {
  const { t } = useTranslation("customers")
  const selectedStoreId = value.storeId || "all"
  const storeOptions = Array.isArray(stores) ? stores : []

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
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
          <Label className="text-xs text-muted-foreground" htmlFor="customers-search">
            {t("filters.search_label")}
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="customers-search"
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
            {t("filters.gender_label")}
          </Label>
          <Select
            value={value.gender}
            onValueChange={(gender) =>
              onChange({
                ...value,
                gender: gender as CustomerFiltersState["gender"],
              })
            }
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENDER_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
