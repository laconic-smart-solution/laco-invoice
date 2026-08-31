import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Lock, Mail } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { FormCheckBox } from "@/components/common/form-inputs/form-check-box"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { AuthIconInput } from "@/features/auth/components/auth-icon-input"
import { useLogin } from "@/features/auth/hooks/use-login"
import {
  createLoginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login-schema"

export function LoginPage() {
  const { t } = useTranslation("auth")
  const { mutate, isPending, error, clearError } = useLogin()

  const loginSchema = useMemo(
    () =>
      createLoginSchema({
        invalidEmail: t("validation.invalid_email"),
      }),
    [t]
  )

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    clearError()
    void mutate(values)
  }

  const registerFooter = (
    <>
      {t("login.new_user")}{" "}
      <Link
        to={ROUTES.auth.register}
        className="font-medium text-primary hover:underline"
      >
        {t("login.register_link")}
      </Link>
    </>
  )

  return (
    <AuthCard
      title={t("login.title")}
      subtitle={t("subtitle")}
      footer={registerFooter}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <AuthIconInput
            form={form}
            name="email"
            label={t("login.email_label")}
            icon={Mail}
            type="email"
            placeholder={t("login.email_placeholder")}
            autoComplete="email"
            required
          />

          <AuthIconInput
            form={form}
            name="password"
            label={t("login.password_label")}
            icon={Lock}
            type="password"
            placeholder={t("login.password_placeholder")}
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between gap-4">
            <FormCheckBox
              form={form}
              name="rememberMe"
              label={t("login.remember_me")}
              labelClass="text-sm font-normal normal-case text-muted-foreground"
              wrapperClass="space-y-0"
            />
            <Link
              to={ROUTES.auth.forgotPassword}
              className="text-sm text-primary hover:underline"
            >
              {t("login.forgot_password")}
            </Link>
          </div>

          <AuthFormError message={error} />

          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={isPending}
          >
            {t("login.submit")}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
