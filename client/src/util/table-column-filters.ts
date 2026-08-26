import type { ColumnFiltersState } from "@tanstack/react-table"

/** Read a string column filter value by column id. */
export function getColumnFilterValue(
  columnFilters: ColumnFiltersState,
  columnId: string
): string {
  const entry = columnFilters.find((filter) => filter.id === columnId)
  if (entry?.value == null) {
    return ""
  }
  return String(entry.value).trim()
}

/**
 * First non-empty mapped column filter, in priority order of `columnIds`.
 * Useful when several UI columns map to one server search field.
 */
export function getFirstColumnFilterValue(
  columnFilters: ColumnFiltersState,
  columnIds: string[]
): string {
  for (const columnId of columnIds) {
    const value = getColumnFilterValue(columnFilters, columnId)
    if (value) {
      return value
    }
  }
  return ""
}
