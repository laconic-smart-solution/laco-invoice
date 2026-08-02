import { useCallback, useState } from "react"

import type { DataTableSelection } from "@/components/common/data-table/types"
import { EMPTY_TABLE_SELECTION } from "@/components/common/data-table/types"

type ExportConfirmAction = "export" | "bulk"

interface UseExportSelectionOptions {
  totalCount: number
}

/**
 * Shared selection + "export all" confirm flow for list pages.
 * Header select-all marks all matching records across pages.
 */
export function useExportSelection({ totalCount }: UseExportSelectionOptions) {
  const [selection, setSelectionState] = useState<DataTableSelection>(EMPTY_TABLE_SELECTION)
  const [confirmAction, setConfirmAction] = useState<ExportConfirmAction | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const setSelection = useCallback((next: DataTableSelection) => {
    setSelectionState((prev) => {
      if (
        prev.isAllMatchingSelected === next.isAllMatchingSelected &&
        prev.isAllPageSelected === next.isAllPageSelected &&
        prev.ids.length === next.ids.length &&
        prev.ids.every((id, index) => id === next.ids[index])
      ) {
        return prev
      }
      return next
    })
  }, [])

  const selectedCount = selection.isAllMatchingSelected
    ? totalCount
    : selection.ids.length

  const needsExportAllConfirm =
    selection.isAllMatchingSelected && totalCount > 0

  const requestAction = useCallback(
    (action: ExportConfirmAction, options?: { requireSelection?: boolean }) => {
      setActionError(null)
      const requireSelection = options?.requireSelection ?? true

      if (requireSelection && selectedCount === 0) {
        return { kind: "need_selection" as const }
      }

      if (needsExportAllConfirm) {
        setConfirmAction(action)
        return { kind: "confirm_all" as const }
      }

      return {
        kind: "selected" as const,
        ids: selection.ids,
        action,
      }
    },
    [needsExportAllConfirm, selectedCount, selection.ids]
  )

  const closeConfirm = useCallback(() => {
    setConfirmAction(null)
  }, [])

  return {
    selection,
    setSelection,
    selectedCount,
    confirmAction,
    closeConfirm,
    requestAction,
    actionError,
    setActionError,
    totalCount,
  }
}
