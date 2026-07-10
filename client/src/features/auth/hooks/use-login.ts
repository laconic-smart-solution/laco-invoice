import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  getAuthErrorMessage,
  useSignInMutation,
} from "@/shared/queries/auth.query"
import { meService } from "@/shared/services/me.service"
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
  const establishSession = useAuthStore((state) => state.establishSession)
  const setUser = useAuthStore((state) => state.setUser)
  const signInMutation = useSignInMutation()
  const [error, setError] = useState<string | null>(null)

  const mutate = async (values: LoginInput) => {
    setError(null)

    try {
      const response = await signInMutation.mutateAsync({
        identifier: values.email.trim(),
        password: values.password,
        rememberMe: values.rememberMe,
      })

      if (!response.otpVerified) {
        const params = new URLSearchParams({ email: response.email })
        if (values.rememberMe) {
          params.set("rememberMe", "1")
        }
        const returnUrl = searchParams.get("returnUrl")
        if (returnUrl) {
          params.set("returnUrl", returnUrl)
        }
        navigate(`${ROUTES.auth.otpVerify}?${params.toString()}`)
        return
      }

      establishSession()

      try {
        const profile = await meService.getProfile()
        setUser(profile)
      } catch {
        // Profile fetch is best-effort after cookies are set.
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
