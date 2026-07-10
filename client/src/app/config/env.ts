function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/$/, "")
}

export const env = {
  apiBaseUrl: trimTrailingSlash(
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8091/api"
  ),
  applicationCode: import.meta.env.VITE_APPLICATION_CODE ?? "laco-invoice",
} as const
