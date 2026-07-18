import { z } from "zod"

interface PasswordFormMessages {
  currentPasswordRequired: string
  newPasswordMin: string
}

export function createPasswordFormSchema(messages: PasswordFormMessages) {
  return z.object({
    currentPassword: z.string().min(1, messages.currentPasswordRequired),
    newPassword: z.string().min(8, messages.newPasswordMin),
  })
}

export type PasswordFormValues = z.infer<ReturnType<typeof createPasswordFormSchema>>

export const defaultPasswordFormValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
}
