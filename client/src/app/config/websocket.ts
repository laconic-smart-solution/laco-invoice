import { env } from "@/app/config/env"

export function resolveWebSocketBaseUrl(): string {
  return env.apiBaseUrl.replace(/\/api$/i, "")
}

export function resolveWebSocketUrl(): string {
  return `${resolveWebSocketBaseUrl()}/ws`
}
