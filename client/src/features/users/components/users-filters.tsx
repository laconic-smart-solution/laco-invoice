import { useTranslation } from "react-i18next"

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
  onRoleChange: (role: UserRoleFilter) => void
}

export function UsersFilters({ role, onRoleChange }: UsersFiltersProps) {
  const { t } = useTranslation("users")

  return (
    <section className="border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 sm:max-w-xs">
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
      </div>
    </section>
  )
}
