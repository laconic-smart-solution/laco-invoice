import { authClient } from "@/app/api/auth-client"
import { env } from "@/app/config/env"
import type {
  AuthToken,
  LoginCredentials,
  ResetPasswordRequest,
  SsoLoginResponse,
  VerifyOtpRequest,
} from "@/shared/types/auth.types"

interface SsoDataEnvelope<T> {
  data: T
}

export const authService = {
  signInToSso: async (credentials: LoginCredentials): Promise<SsoLoginResponse> => {
    const response = await authClient.post<SsoDataEnvelope<SsoLoginResponse>>(
      "/lcn-sso/auth/login",
      {
        username: credentials.identifier.trim(),
        password: credentials.password,
      },
      {
        headers: {
          "X-Application-Code": env.applicationCode,
        },
      }
    )
    return response.data.data
  },

  resendOtp: async (email: string): Promise<void> => {
    await authClient.post(
      `/lcn-sso/auth/resend-otp/email?email=${encodeURIComponent(email.trim())}`,
      {},
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<SsoLoginResponse> => {
    const response = await authClient.post<SsoDataEnvelope<SsoLoginResponse>>(
      "/lcn-sso/auth/verify/otp",
      null,
      {
        params: {
          email: payload.email.trim(),
          otp: payload.otp.trim(),
          applicationCode: env.applicationCode,
        },
      }
    )
    return response.data.data
  },

  resetPassword: async (
    payload: ResetPasswordRequest,
    accessToken: string
  ): Promise<void> => {
    await authClient.post(
      `/lcn-sso/auth/change-password?accessToken=${encodeURIComponent(accessToken)}`,
      payload
    )
  },

  refreshToken: async (refreshToken: string): Promise<AuthToken> => {
    const response = await authClient.post<SsoDataEnvelope<AuthToken>>(
      `/lcn-sso/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`,
      {},
      {
        headers: {
          "X-Application-Code": env.applicationCode,
        },
      }
    )
    return response.data.data
  },
}
