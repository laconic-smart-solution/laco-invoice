import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { UserForm } from "@/features/users/components/user-form"
import { UserFormPageLayout } from "@/features/users/components/user-form-page-layout"
import type { UserFormValues } from "@/features/users/schemas/user-form-schema"
import {
  getAdminUserErrorMessage,
  useCreateUserMutation,
} from "@/shared/queries/admin-user.query"

const FORM_ID = "create-user-form"

export function CreateUserPage() {
  const { t } = useTranslation("users")
  const navigate = useNavigate()
  const createMutation = useCreateUserMutation()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: UserFormValues) => {
    setError(null)
    try {
      await createMutation.mutateAsync({
        role: values.role,
        email: values.email.trim(),
        username: values.username.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        active: values.active,
      })
      navigate(ROUTES.dashboard.users)
    } catch (err: unknown) {
      setError(getAdminUserErrorMessage(err, t("errors.save_failed")))
    }
  }

  const actions = (
    <>
      <Button variant="outline" asChild>
        <Link to={ROUTES.dashboard.users}>{t("form.cancel")}</Link>
      </Button>
      <Button type="submit" form={FORM_ID} disabled={createMutation.isPending}>
        {t("form.submit_create")}
      </Button>
    </>
  )

  return (
    <UserFormPageLayout
      backHref={ROUTES.dashboard.users}
      backLabel={t("form.back_to_list")}
      title={t("create.title")}
      subtitle={t("create.subtitle")}
      actions={actions}
    >
      <AuthFormError message={error} />
      <UserForm formId={FORM_ID} onSubmit={handleSubmit} />
    </UserFormPageLayout>
  )
}
