import { apiClient } from "@/app/api/client"
import type { ApiResponse } from "@/shared/types/api-response"
import type { SignUpRequest, UserRole } from "@/shared/types/auth.types"

interface UserDto {
  id: number
  email: string
  authServerUserId: string | null
  fullName: string | null
  role: UserRole
  active: boolean
}

interface CreateUserPayload {
  role: UserRole
  email: string
  username: string
  password: string
  fullName: string
}

export function deriveUsernameFromEmail(email: string): string {
  const localPart = email.trim().split("@")[0] ?? email.trim()
  const sanitized = localPart.replace(/[^a-zA-Z0-9._-]/g, "")
  return sanitized.length >= 3 ? sanitized : email.trim()
}

export const userService = {
  signUp: async (request: SignUpRequest): Promise<UserDto> => {
    const payload: CreateUserPayload = {
      role: request.role ?? "OWNER",
      email: request.email.trim(),
      username: request.username.trim(),
      password: request.password,
      fullName: request.fullName.trim(),
    }
    const response = await apiClient.post<ApiResponse<UserDto>>("/v1/users", payload)
    return response.data.data
  },
}
