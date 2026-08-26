import { useEffect, useRef } from "react"

interface UseInfiniteScrollSentinelOptions {
  enabled?: boolean
  onIntersect: () => void
  /** Scroll container. Defaults to the browser viewport when omitted. */
  root?: Element | null
  rootMargin?: string
}

/**
 * Observes a sentinel element and calls `onIntersect` when it enters the scroll root.
 */
export function useInfiniteScrollSentinel({
  enabled = true,
  onIntersect,
  root = null,
  rootMargin = "120px",
}: UseInfiniteScrollSentinelOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !enabled) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onIntersect()
        }
      },
      { root, rootMargin, threshold: 0 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, onIntersect, root, rootMargin])

  return sentinelRef
}
