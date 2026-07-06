import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  getAuthErrorMessage,
  useResendOtpMutation,
} from "@/shared/queries/auth.query"
import { persistOtpEmail } from "@/features/auth/util/otp-email"

interface ForgotPasswordInput {
  email: string
}

export function useForgotPassword() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const resendMutation = useResendOtpMutation()
  const [error, setError] = useState<string | null>(null)

  const mutate = async (values: ForgotPasswordInput) => {
    setError(null)
    const email = values.email.trim()

    try {
      await resendMutation.mutateAsync(email)
      persistOtpEmail(email)
      const params = new URLSearchParams({
        mode: "forgot",
        email,
      })
      navigate(`${ROUTES.auth.otpVerify}?${params.toString()}`, {
        state: { email },
      })
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, t("errors.otp_resend_failed")))
    }
  }

  return {
    mutate,
    isPending: resendMutation.isPending,
    error,
    clearError: () => setError(null),
  }
}
