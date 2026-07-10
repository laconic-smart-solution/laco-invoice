import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { CustomerFormPageLayout } from "@/features/customers/components/customer-form-page-layout"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { StoreForm } from "@/features/stores/components/store-form"
import type { StoreFormValues } from "@/features/stores/schemas/store-form-schema"
import {
  getStoreErrorMessage,
  useCreateStoreMutation,
} from "@/shared/queries/store.query"

const FORM_ID = "create-store-form"

export function CreateStorePage() {
  const { t } = useTranslation("stores")
  const navigate = useNavigate()
  const createMutation = useCreateStoreMutation()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: StoreFormValues) => {
    setError(null)
    try {
      const store = await createMutation.mutateAsync({
        name: values.name,
        logoUrl: values.logoUrl,
        active: values.active,
      })
      navigate(ROUTES.dashboard.storeDetail(store.id))
    } catch (err: unknown) {
      setError(getStoreErrorMessage(err, t("errors.save_failed")))
    }
  }

  const actions = (
    <>
      <Button variant="outline" asChild>
        <Link to={ROUTES.dashboard.stores}>{t("form.cancel")}</Link>
      </Button>
      <Button type="submit" form={FORM_ID} disabled={createMutation.isPending}>
        {t("form.submit_create")}
      </Button>
    </>
  )

  return (
    <CustomerFormPageLayout
      backHref={ROUTES.dashboard.stores}
      backLabel={t("form.back_to_list")}
      title={t("create.title")}
      subtitle={t("create.subtitle")}
      actions={actions}
    >
      <AuthFormError message={error} />
      <StoreForm formId={FORM_ID} onSubmit={handleSubmit} />
    </CustomerFormPageLayout>
  )
}
