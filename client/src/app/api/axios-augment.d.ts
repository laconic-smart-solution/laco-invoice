import "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean
    _retryAfterRefresh?: boolean
  }
}
