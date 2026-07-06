import type {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
} from "axios"

import { forceLogoutAndRedirect } from "@/app/api/token-refresh-coordinator"

interface Attach401RefreshOptions {
  loginPath?: string
}

export function attach401RefreshInterceptor(
  client: AxiosInstance,
  options?: Attach401RefreshOptions
): void {
  const loginPath = options?.loginPath ?? "/login"

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const status = error.response?.status ?? error.status

      if (status === 401) {
        forceLogoutAndRedirect(loginPath)
      }

      return Promise.reject(error)
    }
  )
}
