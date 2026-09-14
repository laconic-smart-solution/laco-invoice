import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TableDensity = "default" | "compact"

interface TableDensityState {
  density: TableDensity
  setDensity: (density: TableDensity) => void
  toggleDensity: () => void
}

export const useTableDensityStore = create<TableDensityState>()(
  persist(
    (set) => ({
      density: "compact",
      setDensity: (density) => set({ density }),
      toggleDensity: () =>
        set((state) => ({
          density: state.density === "compact" ? "default" : "compact",
        })),
    }),
    {
      name: "laco-table-density",
    }
  )
)
