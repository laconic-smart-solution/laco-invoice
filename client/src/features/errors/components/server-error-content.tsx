import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { ConnectionLostSignal } from "@/features/errors/components/connection-lost-signal"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { defaultTransition, fadeIn, slideUp } from "@/shared/motion-variants"

export function ServerErrorContent() {
  const { t } = useTranslation("errors")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const descriptionId = "server-error-description"

  useEffect(() => {
    document.title = t("server_error.page_title")
    headingRef.current?.focus()
  }, [t])

  const handleTryAgain = () => {
    window.location.reload()
  }

  const containerMotion = prefersReducedMotion
    ? {}
    : {
        initial: "initial" as const,
        animate: "animate" as const,
        variants: fadeIn,
        transition: defaultTransition,
      }

  const headingMotion = prefersReducedMotion
    ? {}
    : {
        initial: "initial" as const,
        animate: "animate" as const,
        variants: slideUp,
        transition: { ...defaultTransition, delay: 0.06 },
      }

  return (
    <motion.section
      {...containerMotion}
      aria-labelledby="server-error-title"
      aria-describedby={descriptionId}
      className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center"
    >
      <ConnectionLostSignal className="mb-10 w-full" />

      <p className="text-[11px] font-semibold tracking-[0.22em] text-primary uppercase">
        {t("server_error.status_label")}
      </p>
      <p className="mt-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {t("server_error.code_label")}
      </p>

      <motion.h1
        {...headingMotion}
        ref={headingRef}
        id="server-error-title"
        tabIndex={-1}
        className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
      >
        {t("server_error.title")}
      </motion.h1>

      <p
        id={descriptionId}
        className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
      >
        {t("server_error.description")}
      </p>

      <div className="mt-10">
        <Button type="button" size="lg" className="min-w-36 px-5" onClick={handleTryAgain}>
          <RefreshCw data-icon="inline-start" aria-hidden />
          {t("server_error.try_again")}
        </Button>
      </div>
    </motion.section>
  )
}
