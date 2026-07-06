export type UserRole = "OWNER" | "MANAGER" | "STAFF" | "ADMIN"

export interface AuthToken {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  token_type: string
  scope?: string
}

export interface SsoLoginResponse {
  userId: number
  keycloakId?: string
  otpVerified: boolean
  token: AuthToken
  email: string
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

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: MeProfile | null
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
