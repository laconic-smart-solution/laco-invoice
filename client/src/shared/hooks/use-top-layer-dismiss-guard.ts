import { useCallback, useEffect, useRef } from "react"

/**
 * Radix defers an outside-click dismissal from `pointerdown` to `click`, but
 * re-evaluates layer stacking at dispatch time. When a click closes a stacked
 * layer (nested dialog, popper), the layer underneath has already become the
 * topmost one by then and dismisses itself too. Record the stacking at
 * pointerdown and block dismissal when the interaction landed above this layer.
 */
export function useTopLayerDismissGuard<T extends HTMLElement>() {
  const layerRef = useRef<T | null>(null)
  const wasTopLayerRef = useRef(true)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const layer = layerRef.current
      const target = event.target

      if (!layer || !(target instanceof Node)) {
        return
      }

      const position = layer.compareDocumentPosition(target)
      const isInsideLayer = (position & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0
      const isAboveLayer = (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

      wasTopLayerRef.current = isInsideLayer || !isAboveLayer
    }

    document.addEventListener("pointerdown", handlePointerDown, true)
    return () => document.removeEventListener("pointerdown", handlePointerDown, true)
  }, [])

  const guardPointerDownOutside = useCallback((event: Event) => {
    if (!wasTopLayerRef.current) {
      event.preventDefault()
    }
  }, [])

  return { layerRef, guardPointerDownOutside }
}
