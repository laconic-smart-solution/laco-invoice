function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/$/, "")
}

export const env = {
  apiBaseUrl: trimTrailingSlash(
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api"
  ),
  authServerUrl: trimTrailingSlash(
    import.meta.env.VITE_AUTH_SERVER_URL ?? "https://api-auths.laconic.co.th/v1"
  ),
  applicationCode: import.meta.env.VITE_APPLICATION_CODE ?? "laco-invoice",
} as const
