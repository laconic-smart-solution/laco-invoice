import { z } from "zod"

interface UsernameEmailFormMessages {
  currentPasswordRequired: string
  invalidEmail: string
  usernameMin: string
  atLeastOneChange: string
}

export function createUsernameEmailFormSchema(messages: UsernameEmailFormMessages) {
  return z
    .object({
      newEmail: z
        .string()
        .trim()
        .refine((value) => !value || z.string().email().safeParse(value).success, {
          message: messages.invalidEmail,
        }),
      newUsername: z
        .string()
        .trim()
        .refine((value) => !value || value.length >= 3, {
          message: messages.usernameMin,
        }),
      currentPassword: z.string().min(1, messages.currentPasswordRequired),
    })
    .refine((values) => Boolean(values.newEmail) || Boolean(values.newUsername), {
      message: messages.atLeastOneChange,
      path: ["newEmail"],
    })
}

export type UsernameEmailFormValues = z.infer<
  ReturnType<typeof createUsernameEmailFormSchema>
>

export const defaultUsernameEmailFormValues: UsernameEmailFormValues = {
  newEmail: "",
  newUsername: "",
  currentPassword: "",
}
