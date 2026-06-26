import { z } from "zod"

interface ForgotPasswordSchemaMessages {
  invalidEmail: string
}

export function createForgotPasswordSchema(messages: ForgotPasswordSchemaMessages) {
  return z.object({
    email: z.email(messages.invalidEmail),
  })
}

export type ForgotPasswordFormValues = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>
