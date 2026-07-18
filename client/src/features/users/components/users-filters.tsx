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
import {
  USER_ROLE_FILTER_OPTIONS,
  type UserRoleFilter,
} from "@/features/users/types/user"

interface UsersFiltersProps {
  role: UserRoleFilter
  search: string
  onRoleChange: (role: UserRoleFilter) => void
  onSearchChange: (search: string) => void
}

export function UsersFilters({
  role,
  search,
  onRoleChange,
  onSearchChange,
}: UsersFiltersProps) {
  const { t } = useTranslation("users")

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 sm:max-w-2xl sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t("filters.role_label")}
          </Label>
          <Select value={role} onValueChange={(value) => onRoleChange(value as UserRoleFilter)}>
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
              placeholder={t("filters.search_placeholder")}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
