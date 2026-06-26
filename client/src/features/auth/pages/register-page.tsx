import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Lock, Mail, User } from "lucide-react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { AuthCard } from "@/features/auth/components/auth-card"
import { AuthIconInput } from "@/features/auth/components/auth-icon-input"
import {
  createRegisterSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas/register-schema"
import { persistOtpEmail } from "@/features/auth/util/otp-email"

export function RegisterPage() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()

  const registerSchema = useMemo(
    () =>
      createRegisterSchema({
        nameRequired: t("validation.name_required"),
        invalidEmail: t("validation.invalid_email"),
        passwordMin: t("validation.password_min"),
        passwordMismatch: t("validation.password_mismatch"),
      }),
    [t]
  )

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = (values: RegisterFormValues) => {
    persistOtpEmail(values.email)
    const params = new URLSearchParams({ email: values.email, flow: "register" })
    navigate(`${ROUTES.auth.otpVerify}?${params.toString()}`, {
      state: { email: values.email },
    })
  }

  const loginFooter = (
    <>
      {t("register.existing_user")}{" "}
      <Link
        to={ROUTES.auth.login}
        className="font-medium text-primary hover:underline"
      >
        {t("register.login_link")}
      </Link>
    </>
  )

  return (
    <AuthCard
      title={t("register.title")}
      subtitle={t("subtitle")}
      footer={loginFooter}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <AuthIconInput
            form={form}
            name="name"
            label={t("register.name_label")}
            icon={User}
            placeholder={t("register.name_placeholder")}
            autoComplete="name"
            required
          />

          <AuthIconInput
            form={form}
            name="email"
            label={t("register.email_label")}
            icon={Mail}
            type="email"
            placeholder={t("register.email_placeholder")}
            autoComplete="email"
            required
          />

          <AuthIconInput
            form={form}
            name="password"
            label={t("register.password_label")}
            icon={Lock}
            type="password"
            placeholder={t("register.password_placeholder")}
            autoComplete="new-password"
            required
          />

          <AuthIconInput
            form={form}
            name="confirmPassword"
            label={t("register.confirm_password_label")}
            icon={Lock}
            type="password"
            placeholder={t("register.confirm_password_placeholder")}
            autoComplete="new-password"
            required
          />

          <Button type="submit" size="lg" className="h-10 w-full">
            {t("register.submit")}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
