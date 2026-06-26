export const OTP_EMAIL_STORAGE_KEY = "otp-verify-email"

export function persistOtpEmail(email: string) {
  sessionStorage.setItem(OTP_EMAIL_STORAGE_KEY, email)
}

export function readOtpEmail(
  queryEmail: string | null,
  stateEmail?: string | null
) {
  const fromQuery = queryEmail?.trim() ?? ""
  const fromState = stateEmail?.trim() ?? ""
  const fromStorage = sessionStorage.getItem(OTP_EMAIL_STORAGE_KEY)?.trim() ?? ""

  return fromQuery || fromState || fromStorage
}
