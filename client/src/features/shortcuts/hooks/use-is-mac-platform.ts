import { useSyncExternalStore } from "react"

function subscribe() {
  return () => {}
}

function getSnapshot() {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
}

function getServerSnapshot() {
  return false
}

export function useIsMacPlatform() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
