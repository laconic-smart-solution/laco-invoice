import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"

import { ROUTES } from "@/app/constants/routes"

type ServerErrorConfig = InternalAxiosRequestConfig & {
  skipServerErrorRedirect?: boolean
}

const GATEWAY_STATUSES = new Set([502, 503, 504])

let redirectInFlight = false

function resolveContentTypeHeader(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0]
  }
  return undefined
}

function isJsonContentType(contentType: string | undefined): boolean {
  if (!contentType) {
    return false
  }
  return contentType.toLowerCase().includes("application/json")
}

function looksLikeApiErrorBody(data: unknown): boolean {
  return (
    !!data &&
    typeof data === "object" &&
    ("message" in data || "success" in data || "status" in data)
  )
}

export function isUnreachableServerError(error: AxiosError): boolean {
  if (!error.response) {
    return true
  }

  const { status, data, headers } = error.response

  if (GATEWAY_STATUSES.has(status)) {
    return true
  }

  if (status !== 500) {
    return false
  }

  // Vite proxy failures often return plain text/HTML 500s; Spring returns JSON ApiResponse.
  if (typeof data === "string") {
    return true
  }

  const contentType = resolveContentTypeHeader(headers?.["content-type"])
  if (!isJsonContentType(contentType) && !looksLikeApiErrorBody(data)) {
    return true
  }

  return false
}

async function redirectToServerErrorPage(message?: string): Promise<void> {
  if (redirectInFlight) {
    return
  }

  if (window.location.pathname === ROUTES.errors.serverError) {
    return
  }

  redirectInFlight = true

  try {
    const { router } = await import("@/app/routes/app-router")

    await router.navigate(ROUTES.errors.serverError, {
      replace: true,
      state: message ? { message } : undefined,
    })
  } finally {
    redirectInFlight = false
  }
}

function shouldSkipRedirect(config: ServerErrorConfig | undefined): boolean {
  if (config?.skipServerErrorRedirect) {
    return true
  }

  const url = config?.url ?? ""
  // Avoid racing the 401 refresh/logout flow when the auth server is down.
  return url.includes("/v1/auth/refresh") || url.includes("/v1/auth/logout")
}

export function attachServerErrorRedirectInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const config = error.config as ServerErrorConfig | undefined

      if (!shouldSkipRedirect(config) && isUnreachableServerError(error)) {
        const message =
          typeof error.message === "string" && error.message.trim()
            ? error.message.trim()
            : undefined
        void redirectToServerErrorPage(message)
      }

      return Promise.reject(error)
    }
  )
}
