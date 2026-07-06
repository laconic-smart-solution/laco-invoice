import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { FormCheckBox } from "@/components/common/form-inputs/form-check-box"
import { FormSelectInput } from "@/components/common/form-inputs/form-select-input"
import { FormTextInput } from "@/components/common/form-inputs/form-text-input"
import { Form } from "@/components/ui/form"
import {
  createUserFormSchema,
  defaultUserFormValues,
  type UserFormValues,
} from "@/features/users/schemas/user-form-schema"
import { USER_ROLE_FILTER_OPTIONS } from "@/features/users/types/user"
import { deriveUsernameFromEmail } from "@/shared/services/user.service"

interface UserFormProps {
  defaultValues?: UserFormValues
  onSubmit: (values: UserFormValues) => void | Promise<void>
  formId: string
}

const ROLE_OPTIONS = USER_ROLE_FILTER_OPTIONS.filter((option) => option.value !== "all")

export function UserForm({
  defaultValues = defaultUserFormValues,
  onSubmit,
  formId,
}: UserFormProps) {
  const { t } = useTranslation("users")

  const schema = useMemo(
    () =>
      createUserFormSchema({
        fullNameRequired: t("form.validation.full_name_required"),
        invalidEmail: t("form.validation.invalid_email"),
        usernameMin: t("form.validation.username_min"),
        passwordMin: t("form.validation.password_min"),
        passwordMismatch: t("form.validation.password_mismatch"),
      }),
    [t]
  )

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const emailValue = form.watch("email")
  const usernameValue = form.watch("username")

  useEffect(() => {
    if (usernameValue.trim()) {
      return
    }

    const email = emailValue.trim()
    if (!email) {
      return
    }

    form.setValue("username", deriveUsernameFromEmail(email), {
      shouldDirty: false,
      shouldValidate: false,
    })
  }, [emailValue, form, usernameValue])

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-5 md:grid-cols-2"
      >
        <FormTextInput
          form={form}
          name="fullName"
          label={t("form.full_name_label")}
          placeholder={t("form.full_name_placeholder")}
          required
        />
        <FormTextInput
          form={form}
          name="email"
          label={t("form.email_label")}
          type="email"
          placeholder={t("form.email_placeholder")}
          required
        />
        <FormTextInput
          form={form}
          name="username"
          label={t("form.username_label")}
          placeholder={t("form.username_placeholder")}
          required
        />
        <FormSelectInput
          form={form}
          name="role"
          label={t("form.role_label")}
          placeholder={t("form.role_placeholder")}
          options={ROLE_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
          required
        />
        <FormTextInput
          form={form}
          name="password"
          label={t("form.password_label")}
          type="password"
          placeholder={t("form.password_placeholder")}
          autoComplete="new-password"
          required
        />
        <FormTextInput
          form={form}
          name="confirmPassword"
          label={t("form.confirm_password_label")}
          type="password"
          placeholder={t("form.confirm_password_placeholder")}
          autoComplete="new-password"
          required
        />
        <div className="md:col-span-2">
          <FormCheckBox
            form={form}
            name="active"
            label={t("form.active_label")}
            description={t("form.active_description")}
          />
        </div>
      </form>
    </Form>
  )
}
