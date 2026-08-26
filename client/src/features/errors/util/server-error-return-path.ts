import { ROUTES } from "@/app/constants/routes"

export const SERVER_ERROR_RETURN_PATH_KEY = "laco-invoice:server-error-return-to"

export function rememberServerErrorReturnPath(): void {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`

  if (path === ROUTES.errors.serverError) {
    return
  }

  sessionStorage.setItem(SERVER_ERROR_RETURN_PATH_KEY, path)
}

export function consumeServerErrorReturnPath(): string {
  const stored = sessionStorage.getItem(SERVER_ERROR_RETURN_PATH_KEY)
  sessionStorage.removeItem(SERVER_ERROR_RETURN_PATH_KEY)

  if (!stored || stored === ROUTES.errors.serverError) {
    return ROUTES.home
  }

  return stored
}
