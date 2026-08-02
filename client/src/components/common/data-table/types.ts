export interface DataTableSelection {
  ids: string[]
  /** True when every row on the current page is selected. */
  isAllPageSelected: boolean
  /** True when the header select-all targets all matching records (across pages). */
  isAllMatchingSelected: boolean
}

export const EMPTY_TABLE_SELECTION: DataTableSelection = {
  ids: [],
  isAllPageSelected: false,
  isAllMatchingSelected: false,
}

export interface SelectAllMatchingMeta {
  enabled: boolean
  isSelected: boolean
  onChange: (selected: boolean) => void
}

export interface DataTableMeta {
  selectAllMatching?: SelectAllMatchingMeta
}
