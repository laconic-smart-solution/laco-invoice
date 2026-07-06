import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { setAuthStorageMode } from "@/shared/auth/auth-storage"
import {
  getAuthErrorMessage,
  useSignInMutation,
} from "@/shared/queries/auth.query"
import { meService } from "@/shared/services/me.service"
import type { AuthSession } from "@/shared/types/auth.types"
import { useAuthStore } from "@/shared/stores/auth-store"

interface LoginInput {
  email: string
  password: string
  rememberMe: boolean
}

function resolveReturnUrl(returnUrl: string | null): string {
  if (!returnUrl || !returnUrl.startsWith("/")) {
    return ROUTES.home
  }
  return returnUrl
}

export function useLogin() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const signInMutation = useSignInMutation()
  const [error, setError] = useState<string | null>(null)

  const mutate = async (values: LoginInput) => {
    setError(null)
    setAuthStorageMode(values.rememberMe)

    try {
      const response = await signInMutation.mutateAsync({
        identifier: values.email.trim(),
        password: values.password,
      })

      if (!response.otpVerified) {
        const params = new URLSearchParams({ email: response.email })
        const returnUrl = searchParams.get("returnUrl")
        if (returnUrl) {
          params.set("returnUrl", returnUrl)
        }
        navigate(`${ROUTES.auth.otpVerify}?${params.toString()}`)
        return
      }

      const session: AuthSession = {
        accessToken: response.token.access_token,
        refreshToken: response.token.refresh_token,
        user: null,
      }
      login(session)

      try {
        const profile = await meService.getProfile()
        login({
          ...session,
          user: profile,
        })
      } catch {
        // Profile fetch is best-effort after token is stored.
      }

      navigate(resolveReturnUrl(searchParams.get("returnUrl")))
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, t("errors.sign_in_failed")))
    }
  }

  return {
    mutate,
    isPending: signInMutation.isPending,
    error,
    clearError: () => setError(null),
  }
}
