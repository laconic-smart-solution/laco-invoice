import { ShieldCheck } from "lucide-react"
import type { MouseEvent } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import type { AdminUser } from "@/features/users/types/user"

interface UserRowActionsProps {
  user: AdminUser
  onVerifyOtp: (user: AdminUser) => void
}

export function UserRowActions({ user, onVerifyOtp }: UserRowActionsProps) {
  const { t } = useTranslation("users")

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onVerifyOtp(user)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 gap-1.5"
      onClick={handleClick}
      disabled={!user.authServerUserId}
      title={
        user.authServerUserId
          ? undefined
          : t("table.actions.verify_otp_unlinked")
      }
    >
      <ShieldCheck className="size-3.5" aria-hidden />
      {t("table.actions.verify_otp")}
    </Button>
  )
}
