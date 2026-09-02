import { useCallback, useState } from "react"

/** Tracks open Radix selects/menus inside a dialog to prevent accidental dialog dismiss. */
export function useDialogNestedOverlayOpen() {
  const [openCount, setOpenCount] = useState(0)

  const onOverlayOpenChange = useCallback((open: boolean) => {
    setOpenCount((count) => Math.max(0, count + (open ? 1 : -1)))
  }, [])

  const resetOverlays = useCallback(() => {
    setOpenCount(0)
  }, [])

  return {
    hasOpenOverlay: openCount > 0,
    onOverlayOpenChange,
    resetOverlays,
  }
}
