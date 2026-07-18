import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { FormTextInput } from "@/components/common/form-inputs/form-text-input"
import { Form } from "@/components/ui/form"
import {
  createUsernameEmailFormSchema,
  defaultUsernameEmailFormValues,
  type UsernameEmailFormValues,
} from "@/features/profile/schemas/username-email-form-schema"

interface UsernameEmailFormProps {
  formId: string
  defaultEmail?: string
  onSubmit: (values: UsernameEmailFormValues) => void | Promise<void>
}

export function UsernameEmailForm({
  formId,
  defaultEmail = "",
  onSubmit,
}: UsernameEmailFormProps) {
  const { t } = useTranslation("profile")

  const schema = useMemo(
    () =>
      createUsernameEmailFormSchema({
        currentPasswordRequired: t("username_email.validation.current_password_required"),
        invalidEmail: t("username_email.validation.invalid_email"),
        usernameMin: t("username_email.validation.username_min"),
        atLeastOneChange: t("username_email.validation.at_least_one_change"),
      }),
    [t]
  )

  const form = useForm<UsernameEmailFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultUsernameEmailFormValues,
      newEmail: defaultEmail,
    },
  })

  useEffect(() => {
    form.reset({
      ...defaultUsernameEmailFormValues,
      newEmail: defaultEmail,
    })
  }, [defaultEmail, form])

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-5 md:grid-cols-2"
      >
        <FormTextInput
          form={form}
          name="newEmail"
          label={t("username_email.new_email_label")}
          type="email"
          placeholder={t("username_email.new_email_placeholder")}
          autoComplete="email"
        />
        <FormTextInput
          form={form}
          name="newUsername"
          label={t("username_email.new_username_label")}
          placeholder={t("username_email.new_username_placeholder")}
          autoComplete="username"
        />
        <FormTextInput
          form={form}
          name="currentPassword"
          label={t("username_email.current_password_label")}
          type="password"
          placeholder={t("username_email.current_password_placeholder")}
          autoComplete="current-password"
          required
          wrapperClass="md:col-span-2"
        />
      </form>
    </Form>
  )
}
