import axios from "axios"

import { attach401RefreshInterceptor } from "@/app/api/axios-401-refresh"
import { env } from "@/app/config/env"
import { ROUTES } from "@/app/constants/routes"
import { getAccessToken } from "@/shared/auth/auth-storage"

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

attach401RefreshInterceptor(apiClient, { loginPath: ROUTES.auth.login })
