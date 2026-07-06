import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Button } from "@/components/ui/button"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { CustomerForm } from "@/features/customers/components/customer-form"
import { CustomerFormPageLayout } from "@/features/customers/components/customer-form-page-layout"
import type { CustomerFormValues } from "@/features/customers/schemas/customer-form-schema"
import {
  getCustomerErrorMessage,
  useCustomerQuery,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} from "@/shared/queries/customer.query"

const FORM_ID = "edit-customer-form"

function toFormValues(customer: {
  name: string
  email: string | null
  phone: string | null
  gender: string | null
  address: string | null
}): CustomerFormValues {
  return {
    name: customer.name ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    gender: customer.gender ?? "",
    address: customer.address ?? "",
  }
}

export function EditCustomerPage() {
  const { t } = useTranslation(["customers", "common"])
  const navigate = useNavigate()
  const { customerId = "" } = useParams()
  const parsedId = Number(customerId)
  const isValidId = Number.isFinite(parsedId) && parsedId > 0

  const { data: customer, isLoading, isError } = useCustomerQuery(
    isValidId ? parsedId : null
  )
  const updateMutation = useUpdateCustomerMutation()
  const deleteMutation = useDeleteCustomerMutation()
  const [error, setError] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const defaultValues = useMemo(
    () => (customer ? toFormValues(customer) : undefined),
    [customer]
  )

  const handleSubmit = async (values: CustomerFormValues) => {
    if (!isValidId) {
      return
    }
    setError(null)
    try {
      await updateMutation.mutateAsync({ id: parsedId, payload: values })
      navigate(ROUTES.dashboard.customers)
    } catch (err: unknown) {
      setError(getCustomerErrorMessage(err, t("errors.save_failed")))
    }
  }

  const handleDelete = async () => {
    if (!isValidId) {
      return
    }
    try {
      await deleteMutation.mutateAsync(parsedId)
      navigate(ROUTES.dashboard.customers)
    } catch (err: unknown) {
      setError(getCustomerErrorMessage(err, t("errors.delete_failed")))
    }
  }

  if (!isValidId || isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold">
          {t("edit.not_found_title")}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("edit.not_found_description")}
        </p>
        <Button asChild>
          <Link to={ROUTES.dashboard.customers}>{t("form.back_to_list")}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading || !defaultValues) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
        {t("common:loading")}
      </div>
    )
  }

  const actions = (
    <>
      <Button variant="outline" asChild>
        <Link to={ROUTES.dashboard.customers}>{t("form.cancel")}</Link>
      </Button>
      <Button
        variant="destructive"
        type="button"
        onClick={() => setIsDeleteOpen(true)}
        disabled={deleteMutation.isPending}
      >
        {t("form.delete")}
      </Button>
      <Button type="submit" form={FORM_ID} disabled={updateMutation.isPending}>
        {t("form.submit_update")}
      </Button>
    </>
  )

  return (
    <>
      <CustomerFormPageLayout
        backHref={ROUTES.dashboard.customers}
        backLabel={t("form.back_to_list")}
        title={t("edit.title")}
        subtitle={customer?.email ?? customer?.name}
        actions={actions}
      >
        <AuthFormError message={error} />
        <CustomerForm
          key={customer?.id}
          formId={FORM_ID}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
        />
      </CustomerFormPageLayout>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t("delete.confirm_title")}
        description={t("delete.confirm_description", { name: customer?.name })}
        confirmLabel={t("form.delete")}
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </>
  )
}
