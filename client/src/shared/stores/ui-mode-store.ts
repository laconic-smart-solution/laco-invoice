import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UiMode = "modern" | "classic"

interface UiModeState {
  mode: UiMode
  setMode: (mode: UiMode) => void
  setModern: () => void
  setClassic: () => void
}

export const useUiModeStore = create<UiModeState>()(
  persist(
    (set) => ({
      mode: "modern",
      setMode: (mode) => set({ mode }),
      setModern: () => set({ mode: "modern" }),
      setClassic: () => set({ mode: "classic" }),
    }),
    {
      name: "ui-mode",
      partialize: (state) => ({ mode: state.mode }),
    }
  )
)
