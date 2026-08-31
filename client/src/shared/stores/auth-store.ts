import { env } from "@/app/config/env"
import { MOCK_USER } from "@/shared/mock/mock-user"
import { meService } from "@/shared/services/me.service"
import type { MeProfile } from "@/shared/types/auth.types"
import { create } from "zustand"

interface AuthState {
  user: MeProfile | null
  isAuthenticated: boolean
  isHydrated: boolean
  hydrate: () => Promise<void>
  setUser: (user: MeProfile | null) => void
  establishSession: (user?: MeProfile | null) => void
  clearSession: () => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  hydrate: async () => {
    if (env.useMockApi) {
      set({
        user: MOCK_USER,
        isAuthenticated: true,
        isHydrated: true,
      })
      return
    }

    try {
      const profile = await meService.getProfile({ skipAuthRefresh: true })
      set({
        user: profile,
        isAuthenticated: true,
        isHydrated: true,
      })
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      })
    }
  },
  setUser: (user) => {
    set({ user })
  },
  establishSession: (user = null) => {
    set({
      user,
      isAuthenticated: true,
      isHydrated: true,
    })
  },
  clearSession: () => {
    set({
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    })
  },
  logout: async () => {
    if (!env.useMockApi) {
      const { authService } = await import("@/shared/services/auth.service")
      try {
        await authService.logout()
      } catch {
        // Clear local state even when the server session is already gone.
      }
    }
    set({
      user: null,
      isAuthenticated: false,
      isHydrated: true,
    })
  },
}))
