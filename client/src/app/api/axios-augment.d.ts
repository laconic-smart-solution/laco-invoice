import "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean
    skipServerErrorRedirect?: boolean
    _retryAfterRefresh?: boolean
  }
}
