import { z } from "zod"

interface ResetPasswordSchemaMessages {
  passwordMin: string
  passwordMismatch: string
}

export function createResetPasswordSchema(messages: ResetPasswordSchemaMessages) {
  return z
    .object({
      password: z.string().min(8, messages.passwordMin),
      confirmPassword: z.string().min(8, messages.passwordMin),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMismatch,
      path: ["confirmPassword"],
    })
}

export type ResetPasswordFormValues = z.infer<
  ReturnType<typeof createResetPasswordSchema>
>
