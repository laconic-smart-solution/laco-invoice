import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { CustomerForm } from "@/features/customers/components/customer-form"
import { CustomerFormPageLayout } from "@/features/customers/components/customer-form-page-layout"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import type { CustomerFormValues } from "@/features/customers/schemas/customer-form-schema"
import {
  getCustomerErrorMessage,
  useCreateCustomerMutation,
} from "@/shared/queries/customer.query"

const FORM_ID = "create-customer-form"

export function CreateCustomerPage() {
  const { t } = useTranslation("customers")
  const navigate = useNavigate()
  const createMutation = useCreateCustomerMutation()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (values: CustomerFormValues) => {
    setError(null)
    try {
      await createMutation.mutateAsync(values)
      navigate(ROUTES.dashboard.customers)
    } catch (err: unknown) {
      setError(getCustomerErrorMessage(err, t("errors.save_failed")))
    }
  }

  const actions = (
    <>
      <Button variant="outline" asChild>
        <Link to={ROUTES.dashboard.customers}>{t("form.cancel")}</Link>
      </Button>
      <Button type="submit" form={FORM_ID} disabled={createMutation.isPending}>
        {t("form.submit_create")}
      </Button>
    </>
  )

  return (
    <CustomerFormPageLayout
      backHref={ROUTES.dashboard.customers}
      backLabel={t("form.back_to_list")}
      title={t("create.title")}
      subtitle={t("create.subtitle")}
      actions={actions}
    >
      <AuthFormError message={error} />
      <CustomerForm formId={FORM_ID} onSubmit={handleSubmit} />
    </CustomerFormPageLayout>
  )
}
