import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { FormOtpInput } from "@/components/common/form-inputs/form-otp-input"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { useVerifyOtp } from "@/features/auth/hooks/use-verify-otp"
import {
  createOtpVerifySchema,
  type OtpVerifyFormValues,
} from "@/features/auth/schemas/otp-verify-schema"
import { persistOtpEmail, readOtpEmail } from "@/features/auth/util/otp-email"

interface OtpVerifyLocationState {
  email?: string
}

export function OtpVerifyPage() {
  const { t } = useTranslation("auth")
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { verify, resend, isVerifying, isResending, error, clearError } =
    useVerifyOtp()
  const queryEmail = searchParams.get("email")
  const stateEmail = (location.state as OtpVerifyLocationState | null)?.email

  const email = readOtpEmail(queryEmail, stateEmail)

  useEffect(() => {
    if (queryEmail?.trim()) {
      persistOtpEmail(queryEmail.trim())
    }
  }, [queryEmail])

  const otpVerifySchema = useMemo(
    () =>
      createOtpVerifySchema({
        otpLength: t("validation.otp_length"),
      }),
    [t]
  )

  const form = useForm<OtpVerifyFormValues>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: {
      otp: "",
    },
  })

  const onSubmit = (values: OtpVerifyFormValues) => {
    if (!email) {
      return
    }
    clearError()
    void verify(email, values.otp)
  }

  const handleResend = () => {
    if (!email) {
      return
    }
    clearError()
    void resend(email)
  }

  const loginFooter = (
    <Link to={ROUTES.auth.login} className="font-medium text-primary hover:underline">
      {t("otp_verify.back_to_login")}
    </Link>
  )

  const description = email ? (
    <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
      {t("otp_verify.description_prefix")}{" "}
      <span className="font-medium text-foreground">{email}</span>
      {t("otp_verify.description_suffix")}
    </p>
  ) : (
    <p className="mb-6 text-sm text-muted-foreground">
      {t("otp_verify.missing_email")}{" "}
      <Link to={ROUTES.auth.register} className="font-medium text-primary hover:underline">
        {t("otp_verify.register_link")}
      </Link>
    </p>
  )

  return (
    <AuthCard
      title={t("otp_verify.title")}
      subtitle={t("subtitle")}
      footer={loginFooter}
    >
      {description}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormOtpInput
            form={form}
            name="otp"
            label={t("otp_verify.otp_label")}
            labelClass="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            groupClass="gap-2.5"
            slotClass="h-12 w-11 text-lg"
            required
            disabled={!email}
          />

          <AuthFormError message={error} />

          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={!email || isVerifying}
          >
            {t("otp_verify.submit")}
            <ArrowRight className="size-4" aria-hidden />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("otp_verify.resend")}{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
              disabled={!email || isResending}
              onClick={handleResend}
            >
              {t("otp_verify.resend_action")}
            </button>
          </p>
        </form>
      </Form>
    </AuthCard>
  )
}
