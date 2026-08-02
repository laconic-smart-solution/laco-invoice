import { useEffect } from "react"

import { useShortcutActionsStore } from "@/shared/stores/shortcut-actions-store"

interface UseRegisterListShortcutsOptions {
  onExport?: () => void
  onClearSelection?: () => void
}

/** Registers page-level handlers for global E / Esc shortcuts. */
export function useRegisterListShortcuts({
  onExport,
  onClearSelection,
}: UseRegisterListShortcutsOptions) {
  const setExportHandler = useShortcutActionsStore((state) => state.setExportHandler)
  const setClearSelectionHandler = useShortcutActionsStore(
    (state) => state.setClearSelectionHandler
  )

  useEffect(() => {
    setExportHandler(onExport ?? null)
    return () => setExportHandler(null)
  }, [onExport, setExportHandler])

  useEffect(() => {
    setClearSelectionHandler(onClearSelection ?? null)
    return () => setClearSelectionHandler(null)
  }, [onClearSelection, setClearSelectionHandler])
}
