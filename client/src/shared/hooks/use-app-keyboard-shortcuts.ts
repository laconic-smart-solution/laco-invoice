import { useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  isEditableKeyboardTarget,
  isFlowWorkspaceShortcut,
  shouldOpenFlowWorkspace,
} from "@/features/flow/util/flow-shortcut"
import { useShortcutActionsStore } from "@/shared/stores/shortcut-actions-store"
import { useUiModeStore } from "@/shared/stores/ui-mode-store"

const GO_CHORD_TIMEOUT_MS = 1000
const SHORTCUT_SEARCH_SELECTOR = "[data-shortcut-search]"

const GO_ROUTES: Record<string, string> = {
  h: ROUTES.dashboard.root,
  o: ROUTES.dashboard.orders,
  p: ROUTES.dashboard.products,
  c: ROUTES.dashboard.customers,
  s: ROUTES.dashboard.stores,
  u: ROUTES.dashboard.users,
  k: ROUTES.dashboard.shortcuts,
}

function isEditableTarget(target: EventTarget | null) {
  return isEditableKeyboardTarget(target)
}

function hasOpenModal() {
  return Boolean(
    document.querySelector('[role="dialog"][data-state="open"]') ||
      document.querySelector('[role="alertdialog"][data-state="open"]')
  )
}

function focusShortcutSearch() {
  const el = document.querySelector<HTMLElement>(SHORTCUT_SEARCH_SELECTOR)
  if (!el) {
    return false
  }
  el.focus()
  if (el instanceof HTMLInputElement) {
    el.select()
  }
  return true
}

/**
 * App-wide authenticated shortcuts:
 * - Ctrl/⌘+Shift+M modern UI shell (Ctrl+N is reserved by the browser)
 * - Ctrl/⌘+Shift+O classic (Hongta-style top-nav) shell
 * - Ctrl/⌘+Shift+S open Flow workspace (prevents browser Save As)
 * - `?` open shortcuts page
 * - `g` then letter: navigate (h/o/p/i/c/s/u/k)
 * - `/` focus list search
 * - `e` run page export handler
 * - `Esc` clear selection (or blur search); skipped when a dialog is open
 */
export function useAppKeyboardShortcuts() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const goPendingRef = useRef(false)
  const goTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const clearGoPending = () => {
      goPendingRef.current = false
      if (goTimerRef.current != null) {
        clearTimeout(goTimerRef.current)
        goTimerRef.current = null
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key
      const lower = key.length === 1 ? key.toLowerCase() : key
      const hasMod = event.metaKey || event.ctrlKey

      if (isFlowWorkspaceShortcut(event)) {
        event.preventDefault()
        if (shouldOpenFlowWorkspace(event)) {
          void navigate(ROUTES.dashboard.flow)
        }
        return
      }

      if (event.repeat) {
        return
      }

      // UI shell toggle — use Shift so we don't fight browser New Window / Open File.
      if (hasMod && event.shiftKey && !event.altKey && (lower === "m" || lower === "o")) {
        if (isEditableTarget(event.target)) {
          return
        }
        event.preventDefault()
        if (lower === "m") {
          useUiModeStore.getState().setModern()
        } else {
          useUiModeStore.getState().setClassic()
        }
        return
      }

      // Sidebar uses Ctrl/Cmd+B; leave other modified shortcuts alone.
      if (hasMod || event.altKey) {
        return
      }

      if (goPendingRef.current) {
        clearGoPending()
        if (isEditableTarget(event.target)) {
          return
        }
        const route = GO_ROUTES[lower]
        if (route) {
          event.preventDefault()
          void navigate(route)
        }
        return
      }

      if (key === "Escape") {
        if (pathname === ROUTES.dashboard.flow) {
          return
        }
        if (hasOpenModal()) {
          return
        }
        if (isEditableTarget(event.target) && event.target instanceof HTMLElement) {
          event.target.blur()
          return
        }
        event.preventDefault()
        useShortcutActionsStore.getState().runClearSelection()
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      if (key === "?") {
        event.preventDefault()
        void navigate(ROUTES.dashboard.shortcuts)
        return
      }

      if (key === "/") {
        event.preventDefault()
        focusShortcutSearch()
        return
      }

      if (lower === "g") {
        event.preventDefault()
        goPendingRef.current = true
        goTimerRef.current = setTimeout(clearGoPending, GO_CHORD_TIMEOUT_MS)
        return
      }

      if (lower === "e") {
        event.preventDefault()
        useShortcutActionsStore.getState().runExport()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      clearGoPending()
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [navigate, pathname])
}
