import { create } from "zustand"

export type ClassicPanel =
  | "overview"
  | "orders"
  | "products"
  | "stores"
  | "customers"
  | "users"

export type ClassicDetailType =
  | "order"
  | "product"
  | "store"
  | "customer"
  | "user"

export type ClassicSetupType = "store" | "customer"

export interface ClassicDetail {
  type: ClassicDetailType
  id: string
}

/** Optional list filters applied when drilling in from overview stats. */
export interface ClassicPanelFilter {
  // extensible for future panel drilldowns
}

interface ClassicWorkspaceState {
  panel: ClassicPanel
  detail: ClassicDetail | null
  setup: ClassicSetupType | null
  panelFilter: ClassicPanelFilter
  setPanel: (panel: ClassicPanel, filter?: ClassicPanelFilter) => void
  setDetail: (detail: ClassicDetail | null) => void
  setSetup: (setup: ClassicSetupType | null) => void
  clearPanelFilter: () => void
  syncFromRoute: (input: {
    panel: ClassicPanel
    detail?: ClassicDetail | null
    setup?: ClassicSetupType | null
  }) => void
}

export const useClassicWorkspaceStore = create<ClassicWorkspaceState>((set) => ({
  panel: "overview",
  detail: null,
  setup: null,
  panelFilter: {},
  setPanel: (panel, filter = {}) =>
    set({
      panel,
      panelFilter: filter,
      detail: null,
      setup: null,
    }),
  setDetail: (detail) => set({ detail }),
  setSetup: (setup) => set({ setup }),
  clearPanelFilter: () => set({ panelFilter: {} }),
  syncFromRoute: ({ panel, detail = null, setup = null }) =>
    set((state) => ({
      panel,
      detail,
      setup,
      // Keep drill-down filter when staying on the same panel via URL sync.
      panelFilter: state.panel === panel ? state.panelFilter : {},
    })),
}))
