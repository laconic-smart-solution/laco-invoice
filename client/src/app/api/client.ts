import axios from "axios"

import { attach401RefreshInterceptor } from "@/app/api/axios-401-refresh"
import { attachServerErrorRedirectInterceptor } from "@/app/api/axios-server-error-redirect"
import { env } from "@/app/config/env"
import { ROUTES } from "@/app/constants/routes"

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

attach401RefreshInterceptor(apiClient, { loginPath: ROUTES.auth.login })
attachServerErrorRedirectInterceptor(apiClient)
