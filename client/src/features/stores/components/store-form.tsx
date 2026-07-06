import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { FormCheckBox } from "@/components/common/form-inputs/form-check-box"
import { FormTextInput } from "@/components/common/form-inputs/form-text-input"
import { Form } from "@/components/ui/form"
import {
  createStoreFormSchema,
  type StoreFormValues,
} from "@/features/stores/schemas/store-form-schema"

interface StoreFormProps {
  formId: string
  defaultValues?: Partial<StoreFormValues>
  onSubmit: (values: StoreFormValues) => void | Promise<void>
}

export function StoreForm({
  formId,
  defaultValues,
  onSubmit,
}: StoreFormProps) {
  const { t } = useTranslation("stores")

  const schema = useMemo(
    () =>
      createStoreFormSchema({
        nameRequired: t("form.validation.name_required"),
      }),
    [t]
  )

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      logoUrl: "",
      active: true,
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form
        id={formId}
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
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
          name="logoUrl"
          label={t("form.logo_url_label")}
          placeholder={t("form.logo_url_placeholder")}
        />
        <FormCheckBox
          form={form}
          name="active"
          label={t("form.active_label")}
          description={t("form.active_description")}
        />
      </form>
    </Form>
  )
}
