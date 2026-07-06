import { fetchNewTokensFromRefresh } from "@/app/api/refresh-sso-tokens"
import {
  clearAuthSession,
  getRefreshToken,
  readAuthSession,
  writeAuthSession,
} from "@/shared/auth/auth-storage"
import { useAuthStore } from "@/shared/stores/auth-store"

let inflight: Promise<string> | null = null

export function refreshAccessTokenOnce(): Promise<string> {
  if (!inflight) {
    inflight = (async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        throw new Error("NO_REFRESH_TOKEN")
      }

      const session = readAuthSession()
      if (!session) {
        throw new Error("NO_SESSION")
      }

      const token = await fetchNewTokensFromRefresh(refreshToken)
      const next = {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        user: session.user,
      }
      writeAuthSession(next)
      useAuthStore.getState().login(next)
      return token.access_token
    })().finally(() => {
      inflight = null
    })
  }
  return inflight
}

export function forceLogoutAndRedirect(loginPath: string): void {
  clearAuthSession()
  useAuthStore.getState().logout()
  window.location.replace(loginPath)
}
