import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Mail } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { AuthIconInput } from "@/features/auth/components/auth-icon-input"
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password"
import {
  createForgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas/forgot-password-schema"

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth")
  const { mutate, isPending, error, clearError } = useForgotPassword()

  const forgotPasswordSchema = useMemo(
    () =>
      createForgotPasswordSchema({
        invalidEmail: t("validation.invalid_email"),
      }),
    [t]
  )

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = (values: ForgotPasswordFormValues) => {
    clearError()
    void mutate(values)
  }

  const loginFooter = (
    <Link to={ROUTES.auth.login} className="font-medium text-primary hover:underline">
      {t("forgot_password.back_to_login")}
    </Link>
  )

  return (
    <AuthCard
      title={t("forgot_password.title")}
      subtitle={t("subtitle")}
      footer={loginFooter}
    >
      <p className="mb-5 text-sm text-muted-foreground">
        {t("forgot_password.description")}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <AuthIconInput
            form={form}
            name="email"
            label={t("forgot_password.email_label")}
            icon={Mail}
            type="email"
            placeholder={t("forgot_password.email_placeholder")}
            autoComplete="email"
            required
          />

          <AuthFormError message={error} />

          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={isPending}
          >
            {t("forgot_password.submit")}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
