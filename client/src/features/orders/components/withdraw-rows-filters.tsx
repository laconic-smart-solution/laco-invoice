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

export interface WithdrawRowsFiltersState {
  search: string
  matchStatus: string
  applyStatus: string
}

export const DEFAULT_WITHDRAW_ROWS_FILTERS: WithdrawRowsFiltersState = {
  search: "",
  matchStatus: "all",
  applyStatus: "all",
}

const MATCH_STATUS_OPTIONS = [
  { value: "all", labelKey: "inputs.detail.filters.match_all" },
  { value: "MATCHED", labelKey: "inputs.match.matched" },
  { value: "UNMATCHED", labelKey: "inputs.match.unmatched" },
  { value: "INVALID", labelKey: "inputs.match.invalid" },
] as const

const APPLY_STATUS_OPTIONS = [
  { value: "all", labelKey: "inputs.detail.filters.apply_all" },
  { value: "APPLIED", labelKey: "inputs.apply.applied" },
  { value: "SKIPPED", labelKey: "inputs.apply.skipped" },
  { value: "PENDING", labelKey: "inputs.apply.pending" },
  { value: "FAILED", labelKey: "inputs.apply.failed" },
] as const

interface WithdrawRowsFiltersProps {
  value: WithdrawRowsFiltersState
  onChange: (value: WithdrawRowsFiltersState) => void
  disabled?: boolean
}

export function WithdrawRowsFilters({
  value,
  onChange,
  disabled = false,
}: WithdrawRowsFiltersProps) {
  const { t } = useTranslation("orders")

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
        <div className="space-y-1.5">
          <Label
            className="text-xs text-muted-foreground"
            htmlFor="withdraw-rows-search"
          >
            {t("inputs.detail.filters.order_id")}
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="withdraw-rows-search"
              type="search"
              data-shortcut-search
              placeholder={t("inputs.detail.filters.order_id_placeholder")}
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
            {t("inputs.detail.filters.match")}
          </Label>
          <Select
            value={value.matchStatus}
            onValueChange={(matchStatus) => onChange({ ...value, matchStatus })}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("inputs.detail.filters.apply")}
          </Label>
          <Select
            value={value.applyStatus}
            onValueChange={(applyStatus) => onChange({ ...value, applyStatus })}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLY_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}
