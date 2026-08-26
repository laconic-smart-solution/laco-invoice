export interface AppShortcut {
  id: string
  keys: string[]
  macKeys?: string[]
  descriptionKey: string
  /** When true, show as a "press G then …" chord in the docs. */
  chordPrefix?: string
}

/** Single source of truth for documented app keyboard shortcuts. */
export const APP_SHORTCUTS: AppShortcut[] = [
  {
    id: "toggle-theme",
    keys: ["D"],
    descriptionKey: "items.toggle_theme",
  },
  {
    id: "toggle-sidebar",
    keys: ["Ctrl", "B"],
    macKeys: ["⌘", "B"],
    descriptionKey: "items.toggle_sidebar",
  },
  {
    id: "ui-modern",
    keys: ["Ctrl", "Shift", "M"],
    macKeys: ["⌘", "Shift", "M"],
    descriptionKey: "items.ui_modern",
  },
  {
    id: "ui-classic",
    keys: ["Ctrl", "Shift", "O"],
    macKeys: ["⌘", "Shift", "O"],
    descriptionKey: "items.ui_classic",
  },
  {
    id: "open-shortcuts",
    keys: ["?"],
    descriptionKey: "items.open_shortcuts",
  },
  {
    id: "focus-search",
    keys: ["/"],
    descriptionKey: "items.focus_search",
  },
  {
    id: "export",
    keys: ["E"],
    descriptionKey: "items.export",
  },
  {
    id: "clear-selection",
    keys: ["Esc"],
    descriptionKey: "items.clear_selection",
  },
  {
    id: "go-home",
    keys: ["H"],
    chordPrefix: "G",
    descriptionKey: "items.go_home",
  },
  {
    id: "go-orders",
    keys: ["O"],
    chordPrefix: "G",
    descriptionKey: "items.go_orders",
  },
  {
    id: "go-products",
    keys: ["P"],
    chordPrefix: "G",
    descriptionKey: "items.go_products",
  },
  {
    id: "go-customers",
    keys: ["C"],
    chordPrefix: "G",
    descriptionKey: "items.go_customers",
  },
  {
    id: "go-stores",
    keys: ["S"],
    chordPrefix: "G",
    descriptionKey: "items.go_stores",
  },
  {
    id: "go-users",
    keys: ["U"],
    chordPrefix: "G",
    descriptionKey: "items.go_users",
  },
  {
    id: "go-shortcuts",
    keys: ["K"],
    chordPrefix: "G",
    descriptionKey: "items.go_shortcuts",
  },
]
