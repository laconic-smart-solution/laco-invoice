import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios"

import { env } from "@/app/config/env"
import { handleMockRequest } from "@/shared/mock/mock-api-handler"

export function attachMockApiAdapter(client: {
  defaults: { adapter?: AxiosAdapter }
}): void {
  if (!env.useMockApi) {
    return
  }

  console.info(
    "%c[dev] Mock API enabled — backend calls are simulated. Set VITE_USE_MOCK_API=false to use the real server.",
    "color: #b45309; font-weight: bold;"
  )

  client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const result = await handleMockRequest(config)

    return {
      data: result.body,
      status: result.status,
      statusText: result.status === 200 ? "OK" : "Error",
      headers: result.headers ?? {},
      config,
      request: {},
    }
  }
}
