import axios from "axios"

import { env } from "@/app/config/env"

export const authClient = axios.create({
  baseURL: env.authServerUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "*/*",
  },
})
