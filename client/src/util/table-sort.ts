import type { SortingState } from "@tanstack/react-table"

export type PageSortOrder = "ASC" | "DESC"

export interface PageSortParams {
  sortBy?: string
  sortOrder?: PageSortOrder
}

/**
 * Maps TanStack SortingState to lily-style pageable sortBy / sortOrder.
 * Optional fieldMap remaps column ids to server entity field names.
 */
export function sortingToPageSort(
  sorting: SortingState,
  fieldMap?: Record<string, string>
): PageSortParams {
  const first = sorting[0]
  if (!first?.id) {
    return {}
  }
  const sortBy = fieldMap?.[first.id] ?? first.id
  return {
    sortBy,
    sortOrder: first.desc ? "DESC" : "ASC",
  }
}
