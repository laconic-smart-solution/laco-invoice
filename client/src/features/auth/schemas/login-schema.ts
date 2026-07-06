import { z } from "zod"

interface LoginSchemaMessages {
  invalidEmail: string
}

export function createLoginSchema(messages: LoginSchemaMessages) {
  return z.object({
    email: z.email(messages.invalidEmail),
    password: z.string(),
    rememberMe: z.boolean(),
  })
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>
