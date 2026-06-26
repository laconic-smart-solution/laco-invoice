import axios from "axios"

import { env } from "@/app/config/env"

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(error)
    }

    return Promise.reject(new Error("An unexpected error occurred"))
  }
)
