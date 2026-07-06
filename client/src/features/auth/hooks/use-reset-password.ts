import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { getAccessToken } from "@/shared/auth/auth-storage"
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
  const resetMutation = useResetPasswordMutation()

  const accessToken = searchParams.get("token") ?? getAccessToken() ?? ""
  const email = searchParams.get("email") ?? ""

  const submit = async (newPassword: string) => {
    if (!accessToken) {
      throw new Error(t("reset_password.missing_token"))
    }

    try {
      await resetMutation.mutateAsync({
        payload: { newPassword },
        accessToken,
      })
      logout()
      navigate(ROUTES.auth.login)
    } catch (err: unknown) {
      throw new Error(getAuthErrorMessage(err, t("errors.reset_password_failed")), {
        cause: err,
      })
    }
  }

  return {
    email,
    accessToken,
    submit,
    isPending: resetMutation.isPending,
  }
}
