import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  getAuthErrorMessage,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/shared/queries/auth.query"
import { meService } from "@/shared/services/me.service"
import { useAuthStore } from "@/shared/stores/auth-store"

function isForgotPasswordFlow(mode: string | null, flow: string | null): boolean {
  return mode === "forgot" || flow === "forgot-password"
}

function resolveReturnUrl(returnUrl: string | null): string {
  if (!returnUrl || !returnUrl.startsWith("/")) {
    return ROUTES.home
  }
  return returnUrl
}

export function useVerifyOtp() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const establishSession = useAuthStore((state) => state.establishSession)
  const setUser = useAuthStore((state) => state.setUser)
  const verifyMutation = useVerifyOtpMutation()
  const resendMutation = useResendOtpMutation()
  const [error, setError] = useState<string | null>(null)

  const mode = searchParams.get("mode")
  const flow = searchParams.get("flow")
  const returnUrl = searchParams.get("returnUrl")
  const rememberMe = searchParams.get("rememberMe") === "1"
  const isForgotFlow = isForgotPasswordFlow(mode, flow)

  const verify = async (email: string, otp: string) => {
    setError(null)

    try {
      await verifyMutation.mutateAsync({ email, otp, rememberMe })

      if (isForgotFlow) {
        establishSession()
        const params = new URLSearchParams({ email })
        navigate(`${ROUTES.auth.resetPassword}?${params.toString()}`)
        return
      }

      establishSession()

      try {
        const profile = await meService.getProfile()
        setUser(profile)
      } catch {
        // Profile fetch is best-effort after cookies are set.
      }

      navigate(resolveReturnUrl(returnUrl))
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, t("errors.otp_verify_failed")))
    }
  }

  const resend = async (email: string) => {
    setError(null)
    try {
      await resendMutation.mutateAsync(email)
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, t("errors.otp_resend_failed")))
    }
  }

  return {
    verify,
    resend,
    isVerifying: verifyMutation.isPending,
    isResending: resendMutation.isPending,
    error,
    clearError: () => setError(null),
  }
}
