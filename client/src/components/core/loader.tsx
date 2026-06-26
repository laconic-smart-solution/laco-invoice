import { motion, useReducedMotion } from "framer-motion"
import { useTranslation } from "react-i18next"

export function Loader() {
  const { t } = useTranslation("common")
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div
        className="flex items-center gap-2"
        role="status"
        aria-live="polite"
        aria-label={t("loading")}
      >
        <motion.span
          className="size-2.5 rounded-full bg-primary/70"
          animate={
            prefersReducedMotion ? undefined : { y: [0, -6, 0], opacity: [0.5, 1, 0.5] }
          }
          transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="size-2.5 rounded-full bg-primary"
          animate={
            prefersReducedMotion ? undefined : { y: [0, -6, 0], opacity: [0.5, 1, 0.5] }
          }
          transition={{
            duration: 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.12,
          }}
        />
        <motion.span
          className="size-2.5 rounded-full bg-primary/70"
          animate={
            prefersReducedMotion ? undefined : { y: [0, -6, 0], opacity: [0.5, 1, 0.5] }
          }
          transition={{
            duration: 0.7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.24,
          }}
        />
      </div>
    </div>
  )
}
