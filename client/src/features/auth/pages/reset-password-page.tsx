import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Lock } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { AuthIconInput } from "@/features/auth/components/auth-icon-input"
import { useResetPassword } from "@/features/auth/hooks/use-reset-password"
import {
  createResetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas/reset-password-schema"

export function ResetPasswordPage() {
  const { t } = useTranslation("auth")
  const { email, isAuthenticated, submit, isPending } = useResetPassword()
  const [error, setError] = useState<string | null>(null)
  const hasValidSession = isAuthenticated

  const resetPasswordSchema = useMemo(
    () =>
      createResetPasswordSchema({
        passwordMin: t("validation.password_min"),
        passwordMismatch: t("validation.password_mismatch"),
      }),
    [t]
  )

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setError(null)
    try {
      await submit(values.password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.reset_password_failed"))
    }
  }

  const loginFooter = (
    <Link to={ROUTES.auth.login} className="font-medium text-primary hover:underline">
      {t("reset_password.back_to_login")}
    </Link>
  )

  const description = hasValidSession ? (
    <p className="mb-5 text-sm text-muted-foreground">
      {email
        ? t("reset_password.description", { email })
        : t("reset_password.description_generic")}
    </p>
  ) : (
    <p className="mb-5 text-sm text-muted-foreground">
      {t("reset_password.missing_token")}{" "}
      <Link
        to={ROUTES.auth.forgotPassword}
        className="font-medium text-primary hover:underline"
      >
        {t("reset_password.forgot_link")}
      </Link>
    </p>
  )

  return (
    <AuthCard
      title={t("reset_password.title")}
      subtitle={t("subtitle")}
      footer={loginFooter}
    >
      {description}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <AuthIconInput
            form={form}
            name="password"
            label={t("reset_password.password_label")}
            icon={Lock}
            type="password"
            placeholder={t("reset_password.password_placeholder")}
            autoComplete="new-password"
            required
            disabled={!hasValidSession}
          />

          <AuthIconInput
            form={form}
            name="confirmPassword"
            label={t("reset_password.confirm_password_label")}
            icon={Lock}
            type="password"
            placeholder={t("reset_password.confirm_password_placeholder")}
            autoComplete="new-password"
            required
            disabled={!hasValidSession}
          />

          <AuthFormError message={error} />

          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={!hasValidSession || isPending}
          >
            {t("reset_password.submit")}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
