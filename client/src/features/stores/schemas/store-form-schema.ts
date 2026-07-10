import { z } from "zod"

export interface StoreFormSchemaMessages {
  nameRequired: string
}

export function createStoreFormSchema(messages: StoreFormSchemaMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    logoUrl: z.string().trim().optional(),
    active: z.boolean(),
  })
}

export type StoreFormValues = z.infer<ReturnType<typeof createStoreFormSchema>>
