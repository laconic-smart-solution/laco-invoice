import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from "@/shared/auth/auth-storage"
import type { AuthSession, MeProfile } from "@/shared/types/auth.types"
import { create } from "zustand"

interface AuthState {
  user: MeProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isHydrated: boolean
  hydrate: () => void
  login: (session: AuthSession) => void
  setUser: (user: MeProfile | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,
  hydrate: () => {
    const session = readAuthSession()
    if (session?.accessToken) {
      set({
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        isAuthenticated: true,
        isHydrated: true,
      })
      return
    }
    clearAuthSession()
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: true,
    })
  },
  login: (session) => {
    writeAuthSession(session)
    set({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      isAuthenticated: true,
      isHydrated: true,
    })
  },
  setUser: (user) => {
    const session = readAuthSession()
    if (!session) {
      set({ user })
      return
    }
    const next = { ...session, user }
    writeAuthSession(next)
    set({ user })
  },
  logout: () => {
    clearAuthSession()
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: true,
    })
  },
}))
