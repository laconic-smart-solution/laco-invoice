import { create } from "zustand"

import { EMPTY_TABLE_SELECTION } from "@/components/common/data-table/types"
import type { DataTableSelection } from "@/components/common/data-table/types"

interface ShortcutActionsState {
  exportHandler: (() => void) | null
  clearSelectionHandler: (() => void) | null
  setExportHandler: (handler: (() => void) | null) => void
  setClearSelectionHandler: (handler: (() => void) | null) => void
  runExport: () => void
  runClearSelection: () => void
}

export const useShortcutActionsStore = create<ShortcutActionsState>((set, get) => ({
  exportHandler: null,
  clearSelectionHandler: null,
  setExportHandler: (exportHandler) => set({ exportHandler }),
  setClearSelectionHandler: (clearSelectionHandler) => set({ clearSelectionHandler }),
  runExport: () => {
    get().exportHandler?.()
  },
  runClearSelection: () => {
    get().clearSelectionHandler?.()
  },
}))

export function clearTableSelection(
  setSelection: (next: DataTableSelection) => void
) {
  setSelection(EMPTY_TABLE_SELECTION)
}
