import { z } from "zod"

interface OtpVerifySchemaMessages {
  otpLength: string
}

export function createOtpVerifySchema(messages: OtpVerifySchemaMessages) {
  return z.object({
    otp: z.string().length(6, messages.otpLength),
  })
}

export type OtpVerifyFormValues = z.infer<ReturnType<typeof createOtpVerifySchema>>
