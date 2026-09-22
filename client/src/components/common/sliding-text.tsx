import { useEffect, useRef } from "react"

import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { cn } from "@/lib/utils"

interface SlidingTextProps {
  children: string
  className?: string
}

export function SlidingText({ children, className }: SlidingTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const measure = () => {
      const overflow = Math.max(0, text.scrollWidth - container.clientWidth)
      container.style.setProperty(
        "--slide-x",
        overflow > 0 ? `-${overflow}px` : "0px"
      )
      container.style.setProperty(
        "--slide-ms",
        `${Math.min(2800, Math.max(700, overflow * 16))}ms`
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(text)
    return () => observer.disconnect()
  }, [children])

  return (
    <span
      ref={containerRef}
      className={cn(
        "block min-w-0 overflow-hidden whitespace-nowrap",
        className
      )}
    >
      <span
        ref={textRef}
        className={cn(
          "inline-block max-w-none transition-transform duration-300 ease-out",
          !prefersReducedMotion &&
            "group-hover:translate-x-[var(--slide-x,0px)] group-hover:duration-[var(--slide-ms,700ms)] group-hover:ease-linear"
        )}
      >
        {children}
      </span>
    </span>
  )
}
