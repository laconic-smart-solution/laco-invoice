import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { Copy, Minus, Square, X } from "lucide-react"

import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
import { cn } from "@/lib/utils"

interface FlowWindowProps {
  id: string
  title: string
  active: boolean
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  maximized: boolean
  children: ReactNode
  className?: string
}

export function FlowWindow({
  id,
  title,
  active,
  x,
  y,
  width,
  height,
  zIndex,
  maximized,
  children,
  className,
}: FlowWindowProps) {
  const titleId = useId()
  const focus = useFlowWindowsStore((s) => s.focus)
  const minimize = useFlowWindowsStore((s) => s.minimize)
  const toggleMaximize = useFlowWindowsStore((s) => s.toggleMaximize)
  const close = useFlowWindowsStore((s) => s.close)
  const move = useFlowWindowsStore((s) => s.move)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  useEffect(() => {
    if (!active || !panelRef.current) return
    const focusable = panelRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()
  }, [active, id])

  const onTitlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (maximized || (event.target as HTMLElement).closest("button")) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: x,
      originY: y,
    }
    focus(id)
  }

  const onTitlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const dx = event.clientX - dragRef.current.startX
    const dy = event.clientY - dragRef.current.startY
    move(id, dragRef.current.originX + dx, dragRef.current.originY + dy)
  }

  const onTitlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId)
      dragRef.current = null
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation()
      close(id)
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={cn(
        "flow-window",
        active && "flow-window--active",
        maximized && "flow-window--maximized",
        className
      )}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex,
      }}
      onMouseDown={() => focus(id)}
      onKeyDown={onKeyDown}
    >
      <div
        className="flow-window__titlebar"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onPointerCancel={onTitlePointerUp}
        onDoubleClick={() => toggleMaximize(id)}
      >
        <h2 id={titleId} className="flow-window__title">
          {title}
        </h2>
        <div className="flow-window__controls">
          <button
            type="button"
            className="flow-window__control"
            aria-label={`Minimize ${title}`}
            onClick={() => minimize(id)}
          >
            <Minus className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="flow-window__control"
            aria-label={
              maximized
                ? `Restore ${title} to window size`
                : `Maximize ${title}`
            }
            title={maximized ? "Restore" : "Maximize"}
            onClick={() => toggleMaximize(id)}
          >
            {maximized ? (
              <Copy className="size-3.5" aria-hidden />
            ) : (
              <Square className="size-3.5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="flow-window__control flow-window__control--close"
            aria-label={`Close ${title}`}
            onClick={() => close(id)}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="flow-window__body @container">{children}</div>
    </div>
  )
}
