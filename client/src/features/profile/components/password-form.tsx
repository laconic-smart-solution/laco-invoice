import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { FormTextInput } from "@/components/common/form-inputs/form-text-input"
import { Form } from "@/components/ui/form"
import {
  createPasswordFormSchema,
  defaultPasswordFormValues,
  type PasswordFormValues,
} from "@/features/profile/schemas/password-form-schema"

interface PasswordFormProps {
  formId: string
  onSubmit: (values: PasswordFormValues) => void | Promise<void>
}

export function PasswordForm({ formId, onSubmit }: PasswordFormProps) {
  const { t } = useTranslation("profile")

  const schema = useMemo(
    () =>
      createPasswordFormSchema({
        currentPasswordRequired: t("password.validation.current_password_required"),
        newPasswordMin: t("password.validation.new_password_min"),
      }),
    [t]
  )

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultPasswordFormValues,
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
          name="currentPassword"
          label={t("password.current_password_label")}
          type="password"
          placeholder={t("password.current_password_placeholder")}
          autoComplete="current-password"
          required
        />
        <FormTextInput
          form={form}
          name="newPassword"
          label={t("password.new_password_label")}
          type="password"
          placeholder={t("password.new_password_placeholder")}
          autoComplete="new-password"
          required
        />
      </form>
    </Form>
  )
}
