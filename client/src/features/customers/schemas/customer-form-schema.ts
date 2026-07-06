import { z } from "zod"

export interface CustomerFormSchemaMessages {
  nameRequired: string
  invalidEmail: string
}

export function createCustomerFormSchema(messages: CustomerFormSchemaMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    email: z
      .string()
      .trim()
      .refine((value) => value === "" || z.string().email().safeParse(value).success, {
        message: messages.invalidEmail,
      }),
    phone: z.string().trim(),
    gender: z.string().trim(),
    address: z.string().trim(),
  })
}

export type CustomerFormValues = z.infer<ReturnType<typeof createCustomerFormSchema>>

export const defaultCustomerFormValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  gender: "",
  address: "",
}
