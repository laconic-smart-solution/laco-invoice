import type { AuthSession } from "@/shared/types/auth.types"

const PERSISTENT_KEY = "laco-invoice:auth:session"
const SESSION_KEY = "laco-invoice:auth:session:temp"
const STORAGE_MODE_KEY = "laco-invoice:auth:storage-mode"

type StorageMode = "local" | "session"

function getStorage(mode: StorageMode): Storage {
  return mode === "local" ? localStorage : sessionStorage
}

function readStorageMode(): StorageMode {
  const mode = localStorage.getItem(STORAGE_MODE_KEY)
  return mode === "session" ? "session" : "local"
}

export function setAuthStorageMode(persistent: boolean): void {
  localStorage.setItem(STORAGE_MODE_KEY, persistent ? "local" : "session")
}

export function readAuthSession(): AuthSession | null {
  const raw =
    localStorage.getItem(PERSISTENT_KEY) ?? sessionStorage.getItem(SESSION_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function writeAuthSession(session: AuthSession): void {
  const mode = readStorageMode()
  const storage = getStorage(mode)
  const other = getStorage(mode === "local" ? "session" : "local")
  const key = mode === "local" ? PERSISTENT_KEY : SESSION_KEY
  const otherKey = mode === "local" ? SESSION_KEY : PERSISTENT_KEY
  storage.setItem(key, JSON.stringify(session))
  other.removeItem(otherKey)
}

export function clearAuthSession(): void {
  localStorage.removeItem(PERSISTENT_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

export function getAccessToken(): string | undefined {
  return readAuthSession()?.accessToken
}

export function getRefreshToken(): string | undefined {
  return readAuthSession()?.refreshToken
}
