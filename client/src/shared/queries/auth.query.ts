import { useMutation } from "@tanstack/react-query"

import { authService } from "@/shared/services/auth.service"
import { userService } from "@/shared/services/user.service"
import type {
  LoginCredentials,
  ResetPasswordRequest,
  SignUpRequest,
  VerifyOtpRequest,
} from "@/shared/types/auth.types"

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message === "string"
  ) {
    return (
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ?? fallback
    )
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

export function useSignInMutation() {
  return useMutation({
    mutationFn: (body: LoginCredentials) => authService.signInToSso(body),
  })
}

export function useSignUpMutation() {
  return useMutation({
    mutationFn: (body: SignUpRequest) => userService.signUp(body),
  })
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (body: VerifyOtpRequest) => authService.verifyOtp(body),
  })
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.resendOtp(email),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({
      payload,
      accessToken,
    }: {
      payload: ResetPasswordRequest
      accessToken: string
    }) => authService.resetPassword(payload, accessToken),
  })
}
