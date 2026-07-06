import { z } from "zod"

import type { UserRole } from "@/shared/types/auth.types"

const userRoles = ["ADMIN", "OWNER", "MANAGER", "STAFF"] as const satisfies readonly UserRole[]

interface UserFormSchemaMessages {
  fullNameRequired: string
  invalidEmail: string
  usernameMin: string
  passwordMin: string
  passwordMismatch: string
}

export function createUserFormSchema(messages: UserFormSchemaMessages) {
  return z
    .object({
      fullName: z.string().trim().min(1, messages.fullNameRequired),
      email: z.email(messages.invalidEmail),
      username: z.string().trim().min(3, messages.usernameMin),
      password: z.string().min(8, messages.passwordMin),
      confirmPassword: z.string().min(8, messages.passwordMin),
      role: z.enum(userRoles),
      active: z.boolean(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMismatch,
      path: ["confirmPassword"],
    })
}

export type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>

export const defaultUserFormValues: UserFormValues = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
  role: "OWNER",
  active: true,
}
