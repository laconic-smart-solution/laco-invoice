import axios from "axios"

import type { ApiResponse } from "@/shared/types/api-response"

const AXIOS_STATUS_MESSAGE = /^Request failed with status code \d+$/

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as ApiResponse<unknown>).message
      if (typeof message === "string" && message.trim()) {
        return message.trim()
      }
    }
    return fallback
  }

  if (error instanceof Error && error.message && !AXIOS_STATUS_MESSAGE.test(error.message)) {
    return error.message
  }

  return fallback
}

export function isAxiosStatusMessage(message: string): boolean {
  return AXIOS_STATUS_MESSAGE.test(message)
}
