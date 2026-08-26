import { motion } from "framer-motion"

import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"

interface ConnectionLostSignalProps {
  className?: string
}

export function ConnectionLostSignal({ className }: ConnectionLostSignalProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className={className} aria-hidden>
      <div className="relative mx-auto flex w-full max-w-sm items-center gap-3">
        <div className="h-px flex-1 bg-muted-foreground/35" />
        <motion.span
          className="font-mono text-sm tracking-[0.35em] text-primary"
          animate={
            prefersReducedMotion
              ? undefined
              : { opacity: [0.55, 1, 0.55] }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
        >
          \ · /
        </motion.span>
        <div className="h-px flex-1 bg-muted-foreground/35" />
      </div>
    </div>
  )
}
