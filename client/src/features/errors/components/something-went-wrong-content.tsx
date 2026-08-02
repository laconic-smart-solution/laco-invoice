import { motion } from "framer-motion"
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { defaultTransition, fadeIn } from "@/shared/motion-variants"

type ErrorCopyKey = "something_went_wrong" | "server_error"

interface SomethingWentWrongContentProps {
  isAuthenticated: boolean
  variant?: "standalone" | "embedded"
  copyKey?: ErrorCopyKey
}

export function SomethingWentWrongContent({
  isAuthenticated,
  variant = "embedded",
  copyKey = "something_went_wrong",
}: SomethingWentWrongContentProps) {
  const { t } = useTranslation("errors")
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const descriptionId = "something-went-wrong-description"

  useEffect(() => {
    document.title = t(`${copyKey}.page_title`)
    headingRef.current?.focus()
  }, [copyKey, t])

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(isAuthenticated ? ROUTES.dashboard.root : ROUTES.auth.login)
  }

  const handleTryAgain = () => {
    window.location.reload()
  }

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: "initial" as const,
        animate: "animate" as const,
        variants: fadeIn,
        transition: defaultTransition,
      }

  return (
    <motion.section
      {...motionProps}
      aria-labelledby="something-went-wrong-title"
      aria-describedby={descriptionId}
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        variant === "standalone" ? "min-h-svh" : "min-h-[calc(100svh-8rem)]"
      )}
    >
      <div className="relative mb-8 w-full max-w-lg">
        <p
          aria-hidden
          className="pointer-events-none select-none font-heading text-[7rem] font-bold leading-none tracking-tighter text-muted-foreground/15 sm:text-[9rem]"
        >
          {t(`${copyKey}.code`)}
        </p>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex size-14 items-center justify-center border border-border bg-card text-destructive shadow-sm">
            <AlertTriangle className="size-7" aria-hidden />
          </div>
        </div>
      </div>

      <h1
        ref={headingRef}
        id="something-went-wrong-title"
        tabIndex={-1}
        className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        {t(`${copyKey}.title`)}
      </h1>

      <p
        id={descriptionId}
        className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
      >
        {t(`${copyKey}.description`)}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" size="lg" onClick={handleTryAgain}>
          <RefreshCw data-icon="inline-start" aria-hidden />
          {t(`${copyKey}.try_again`)}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to={isAuthenticated ? ROUTES.dashboard.root : ROUTES.auth.login}>
            <Home data-icon="inline-start" aria-hidden />
            {isAuthenticated
              ? t(`${copyKey}.go_home`)
              : t(`${copyKey}.go_login`)}
          </Link>
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={handleGoBack}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          {t(`${copyKey}.go_back`)}
        </Button>
      </div>
    </motion.section>
  )
}
