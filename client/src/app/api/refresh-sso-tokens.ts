import axios from "axios"

import { env } from "@/app/config/env"
import type { AuthToken } from "@/shared/types/auth.types"

export async function fetchNewTokensFromRefresh(
  refreshToken: string
): Promise<AuthToken> {
  const response = await axios.post<{ data: AuthToken }>(
    `${env.authServerUrl}/lcn-sso/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "X-Application-Code": env.applicationCode,
      },
    }
  )
  const token = response.data?.data
  if (!token?.access_token) {
    throw new Error("Invalid refresh response")
  }
  return token
}
