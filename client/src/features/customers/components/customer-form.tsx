import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { FormTextAreaInput } from "@/components/common/form-inputs/form-text-area-input"
import { FormSelectInput } from "@/components/common/form-inputs/form-select-input"
import { FormTextInput } from "@/components/common/form-inputs/form-text-input"
import { Form } from "@/components/ui/form"
import {
  createCustomerFormSchema,
  defaultCustomerFormValues,
  type CustomerFormValues,
} from "@/features/customers/schemas/customer-form-schema"

interface CustomerFormProps {
  defaultValues?: CustomerFormValues
  onSubmit: (values: CustomerFormValues) => void | Promise<void>
  formId: string
}

export function CustomerForm({
  defaultValues = defaultCustomerFormValues,
  onSubmit,
  formId,
}: CustomerFormProps) {
  const { t } = useTranslation("customers")

  const schema = useMemo(
    () =>
      createCustomerFormSchema({
        nameRequired: t("form.validation.name_required"),
        invalidEmail: t("form.validation.invalid_email"),
      }),
    [t]
  )

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-5 md:grid-cols-2"
      >
        <FormTextInput
          form={form}
          name="name"
          label={t("form.name_label")}
          placeholder={t("form.name_placeholder")}
          required
        />
        <FormTextInput
          form={form}
          name="email"
          label={t("form.email_label")}
          type="email"
          placeholder={t("form.email_placeholder")}
        />
        <FormTextInput
          form={form}
          name="phone"
          label={t("form.phone_label")}
          placeholder={t("form.phone_placeholder")}
        />
        <FormSelectInput
          form={form}
          name="gender"
          label={t("form.gender_label")}
          placeholder={t("form.gender_placeholder")}
          options={[
            { value: "male", label: t("table.gender.male") },
            { value: "female", label: t("table.gender.female") },
          ]}
        />
        <div className="md:col-span-2">
          <FormTextAreaInput
            form={form}
            name="address"
            label={t("form.address_label")}
            placeholder={t("form.address_placeholder")}
          />
        </div>
      </form>
    </Form>
  )
}
