import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"

import { ROUTES } from "@/app/constants/routes"
import { useAuthStore } from "@/shared/stores/auth-store"

interface Attach401RefreshOptions {
  loginPath?: string
}

type RetriableConfig = InternalAxiosRequestConfig & {
  _retryAfterRefresh?: boolean
  skipAuthRefresh?: boolean
}

const GUEST_AUTH_PATHS = [
  ROUTES.auth.login,
  ROUTES.auth.register,
  ROUTES.auth.forgotPassword,
  ROUTES.auth.resetPassword,
  ROUTES.auth.otpVerify,
]

let refreshInFlight: Promise<boolean> | null = null

function isAuthBypassPath(config: InternalAxiosRequestConfig | undefined): boolean {
  const url = config?.url ?? ""
  return (
    url.includes("/v1/auth/login") ||
    url.includes("/v1/auth/refresh") ||
    url.includes("/v1/auth/logout") ||
    url.includes("/v1/auth/resend-otp") ||
    url.includes("/v1/auth/verify-otp") ||
    url.includes("/v1/auth/change-password")
  )
}

function isGuestAuthPath(pathname: string): boolean {
  return GUEST_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

async function refreshSessionOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { authService } = await import("@/shared/services/auth.service")
        await authService.refresh()
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

async function forceLogoutAndRedirect(loginPath: string): Promise<void> {
  useAuthStore.getState().clearSession()

  if (isGuestAuthPath(window.location.pathname)) {
    return
  }

  try {
    const { authService } = await import("@/shared/services/auth.service")
    await authService.logout()
  } catch {
    // Best-effort cookie clear when session is already invalid.
  }

  window.location.replace(loginPath)
}

export function attach401RefreshInterceptor(
  client: AxiosInstance,
  options?: Attach401RefreshOptions
): void {
  const loginPath = options?.loginPath ?? ROUTES.auth.login

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const status = error.response?.status ?? error.status
      const config = error.config as RetriableConfig | undefined

      if (status !== 401 || !config) {
        return Promise.reject(error)
      }

      if (config.skipAuthRefresh || isAuthBypassPath(config)) {
        return Promise.reject(error)
      }

      if (config._retryAfterRefresh) {
        await forceLogoutAndRedirect(loginPath)
        return Promise.reject(error)
      }

      const refreshed = await refreshSessionOnce()
      if (!refreshed) {
        await forceLogoutAndRedirect(loginPath)
        return Promise.reject(error)
      }

      config._retryAfterRefresh = true
      return client.request(config)
    }
  )
}
