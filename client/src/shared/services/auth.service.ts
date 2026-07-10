import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"
import type {
  AuthSessionResponse,
  LoginCredentials,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/shared/types/auth.types"

export const authService = {
  login: async (
    credentials: LoginCredentials & { rememberMe: boolean }
  ): Promise<AuthSessionResponse> => {
    const response = await apiClient.post<ApiResponse<AuthSessionResponse>>(
      "/v1/auth/login",
      {
        identifier: credentials.identifier.trim(),
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      }
    )
    return response.data.data
  },

  resendOtp: async (email: string): Promise<void> => {
    await apiClient.post("/v1/auth/resend-otp", { email: email.trim() })
  },

  verifyOtp: async (
    payload: VerifyOtpRequest & { rememberMe?: boolean }
  ): Promise<AuthSessionResponse> => {
    const response = await apiClient.post<ApiResponse<AuthSessionResponse>>(
      "/v1/auth/verify-otp",
      {
        email: payload.email.trim(),
        otp: payload.otp.trim(),
        rememberMe: payload.rememberMe ?? false,
      }
    )
    return response.data.data
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<void> => {
    await apiClient.post("/v1/auth/change-password", payload)
  },

  refresh: async (): Promise<void> => {
    await apiClient.post("/v1/auth/refresh")
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/v1/auth/logout")
  },
}
