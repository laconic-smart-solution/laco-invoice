import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  getAuthErrorMessage,
  useResetPasswordMutation,
} from "@/shared/queries/auth.query"
import { useAuthStore } from "@/shared/stores/auth-store"

export function useResetPassword() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const logout = useAuthStore((state) => state.logout)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const resetMutation = useResetPasswordMutation()

  const email = searchParams.get("email") ?? ""

  const submit = async (newPassword: string) => {
    if (!isAuthenticated) {
      throw new Error(t("reset_password.missing_token"))
    }

    try {
      await resetMutation.mutateAsync({ newPassword })
      await logout()
      navigate(ROUTES.auth.login)
    } catch (err: unknown) {
      throw new Error(getAuthErrorMessage(err, t("errors.reset_password_failed")), {
        cause: err,
      })
    }
  }

  return {
    email,
    isAuthenticated,
    submit,
    isPending: resetMutation.isPending,
  }
}
