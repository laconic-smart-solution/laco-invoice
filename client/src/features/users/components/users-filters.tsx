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
import {
  USER_ACTIVE_FILTER_OPTIONS,
  USER_ROLE_FILTER_OPTIONS,
  type UserActiveFilter,
  type UserRoleFilter,
} from "@/features/users/types/user"

interface UsersFiltersProps {
  role: UserRoleFilter
  active: UserActiveFilter
  search: string
  onRoleChange: (role: UserRoleFilter) => void
  onActiveChange: (active: UserActiveFilter) => void
  onSearchChange: (search: string) => void
  disabled?: boolean
}

export function UsersFilters({
  role,
  active,
  search,
  onRoleChange,
  onActiveChange,
  onSearchChange,
  disabled = false,
}: UsersFiltersProps) {
  const { t } = useTranslation("users")

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground" htmlFor="users-search">
            {t("filters.search_label")}
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="users-search"
              type="search"
              data-shortcut-search
              placeholder={t("filters.search_placeholder")}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-9 pl-8"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.role_label")}
          </Label>
          <Select
            value={role}
            onValueChange={(value) => onRoleChange(value as UserRoleFilter)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.active_label")}
          </Label>
          <Select
            value={active}
            onValueChange={(value) => onActiveChange(value as UserActiveFilter)}
            disabled={disabled}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_ACTIVE_FILTER_OPTIONS.map((option) => (
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
