import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { PasswordForm } from "@/features/profile/components/password-form"
import { ProfileOverview } from "@/features/profile/components/profile-overview"
import { UsernameEmailForm } from "@/features/profile/components/username-email-form"
import type { PasswordFormValues } from "@/features/profile/schemas/password-form-schema"
import type { UsernameEmailFormValues } from "@/features/profile/schemas/username-email-form-schema"
import {
  getAuthErrorMessage,
  useResetPasswordMutation,
} from "@/shared/queries/auth.query"
import {
  getMeErrorMessage,
  useChangeCredentialsMutation,
  useMeProfileQuery,
} from "@/shared/queries/me.query"
import { useAuthStore } from "@/shared/stores/auth-store"
import type { MeCredentialsRequest } from "@/shared/types/auth.types"

const USERNAME_EMAIL_FORM_ID = "username-email-form"
const PASSWORD_FORM_ID = "change-password-form"

export function ProfilePage() {
  const { t } = useTranslation(["profile", "common"])
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const { data: profile, isLoading, isError, refetch } = useMeProfileQuery()
  const changeCredentialsMutation = useChangeCredentialsMutation()
  const changePasswordMutation = useResetPasswordMutation()

  const [credentialsError, setCredentialsError] = useState<string | null>(null)
  const [credentialsSuccess, setCredentialsSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formRevision, setFormRevision] = useState(0)

  const handleUsernameEmailSubmit = async (values: UsernameEmailFormValues) => {
    setCredentialsError(null)
    setCredentialsSuccess(null)

    const nextEmail = values.newEmail.trim()
    const nextUsername = values.newUsername.trim()
    const emailChanged =
      Boolean(nextEmail) &&
      nextEmail.toLowerCase() !== profile?.email.trim().toLowerCase()

    if (!emailChanged && !nextUsername) {
      setCredentialsError(t("username_email.validation.at_least_one_change"))
      return
    }

    const payload: MeCredentialsRequest = {
      currentPassword: values.currentPassword,
    }

    if (emailChanged) {
      payload.newEmail = nextEmail
    }
    if (nextUsername) {
      payload.newUsername = nextUsername
    }

    try {
      await changeCredentialsMutation.mutateAsync(payload)
      setCredentialsSuccess(t("username_email.success"))
      setFormRevision((value) => value + 1)
    } catch (err: unknown) {
      setCredentialsError(
        getMeErrorMessage(err, t("errors.credentials_failed"))
      )
    }
  }

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordError(null)

    try {
      await changePasswordMutation.mutateAsync({
        newPassword: values.newPassword,
      })
      await logout()
      navigate(ROUTES.auth.login)
    } catch (err: unknown) {
      setPasswordError(getAuthErrorMessage(err, t("errors.password_failed")))
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
        {t("common:loading")}
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold">{t("load_error.title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("load_error.description")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={() => void refetch()}>
            {t("load_error.retry")}
          </Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.dashboard.root}>{t("load_error.back_home")}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="border border-border bg-card p-6 shadow-sm">
        <ProfileOverview profile={profile} />
      </div>

      <section className="space-y-4 border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {t("username_email.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("username_email.subtitle")}
          </p>
        </div>

        <AuthFormError message={credentialsError} />
        {credentialsSuccess ? (
          <p
            role="status"
            className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
          >
            {credentialsSuccess}
          </p>
        ) : null}

        <UsernameEmailForm
          key={`${profile.email}-${formRevision}`}
          formId={USERNAME_EMAIL_FORM_ID}
          defaultEmail={profile.email}
          onSubmit={handleUsernameEmailSubmit}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            form={USERNAME_EMAIL_FORM_ID}
            disabled={changeCredentialsMutation.isPending}
          >
            {changeCredentialsMutation.isPending
              ? t("username_email.submitting")
              : t("username_email.submit")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {t("password.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("password.subtitle")}
          </p>
        </div>

        <AuthFormError message={passwordError} />

        <PasswordForm
          formId={PASSWORD_FORM_ID}
          onSubmit={handlePasswordSubmit}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            form={PASSWORD_FORM_ID}
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending
              ? t("password.submitting")
              : t("password.submit")}
          </Button>
        </div>
      </section>
    </div>
  )
}
