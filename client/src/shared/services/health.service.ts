import { env } from "@/app/config/env"

const HEALTH_CHECK_ATTEMPTS = 2
const HEALTH_CHECK_INTERVAL_MS = 400

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function resolveHealthUrl(): string {
  return `${env.apiBaseUrl}/v1/health`
}

export async function checkApplicationHealthOnce(): Promise<boolean> {
  try {
    const response = await fetch(resolveHealthUrl(), {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      return false
    }

    const payload: unknown = await response.json()
    if (!payload || typeof payload !== "object" || !("status" in payload)) {
      return false
    }

    return String((payload as { status: unknown }).status).toUpperCase() === "UP"
  } catch {
    return false
  }
}

export async function waitForApplicationHealth(): Promise<boolean> {
  for (let attempt = 0; attempt < HEALTH_CHECK_ATTEMPTS; attempt++) {
    const healthy = await checkApplicationHealthOnce()
    if (!healthy) {
      return false
    }

    if (attempt < HEALTH_CHECK_ATTEMPTS - 1) {
      await sleep(HEALTH_CHECK_INTERVAL_MS)
    }
  }

  return true
}
