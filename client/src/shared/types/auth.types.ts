export type UserRole = "OWNER" | "MANAGER" | "STAFF" | "ADMIN"

export interface AuthSessionResponse {
  userId: number | null
  email: string
  otpVerified: boolean
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface MeProfile {
  id: number
  email: string
  fullName: string | null
  role: UserRole
  active: boolean
}

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface SignUpRequest {
  email: string
  username: string
  password: string
  fullName: string
  role?: UserRole
}

export interface ResetPasswordRequest {
  newPassword: string
}
