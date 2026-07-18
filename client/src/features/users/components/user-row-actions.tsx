import { ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { DataTableRowActions } from "@/components/common/data-table/data-table-row-actions"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { AdminUser } from "@/features/users/types/user"

interface UserRowActionsProps {
  user: AdminUser
  onVerifyOtp: (user: AdminUser) => void
}

export function UserRowActions({ user, onVerifyOtp }: UserRowActionsProps) {
  const { t } = useTranslation("users")

  return (
    <DataTableRowActions>
      <DropdownMenuItem
        disabled={!user.authServerUserId}
        title={
          user.authServerUserId
            ? undefined
            : t("table.actions.verify_otp_unlinked")
        }
        onSelect={() => onVerifyOtp(user)}
      >
        <ShieldCheck aria-hidden />
        {t("table.actions.verify_otp")}
      </DropdownMenuItem>
    </DataTableRowActions>
  )
}
