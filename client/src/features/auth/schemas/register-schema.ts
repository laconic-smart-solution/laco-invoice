import { z } from "zod"

interface RegisterSchemaMessages {
  nameRequired: string
  invalidEmail: string
  passwordMin: string
  passwordMismatch: string
}

export function createRegisterSchema(messages: RegisterSchemaMessages) {
  return z
    .object({
      name: z.string().min(1, messages.nameRequired),
      email: z.email(messages.invalidEmail),
      password: z.string().min(8, messages.passwordMin),
      confirmPassword: z.string().min(8, messages.passwordMin),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMismatch,
      path: ["confirmPassword"],
    })
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>
