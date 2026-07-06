import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  getAuthErrorMessage,
  useSignUpMutation,
} from "@/shared/queries/auth.query"
import { deriveUsernameFromEmail } from "@/shared/services/user.service"

interface RegisterInput {
  name: string
  email: string
  password: string
}

export function useRegister() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const signUpMutation = useSignUpMutation()
  const [error, setError] = useState<string | null>(null)

  const mutate = async (values: RegisterInput) => {
    setError(null)
    const email = values.email.trim()

    try {
      await signUpMutation.mutateAsync({
        email,
        username: deriveUsernameFromEmail(email),
        password: values.password,
        fullName: values.name.trim(),
        role: "OWNER",
      })

      const params = new URLSearchParams({
        email,
        flow: "register",
      })
      navigate(`${ROUTES.auth.otpVerify}?${params.toString()}`, {
        state: { email },
      })
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, t("errors.sign_up_failed")))
    }
  }

  return {
    mutate,
    isPending: signUpMutation.isPending,
    error,
    clearError: () => setError(null),
  }
}
