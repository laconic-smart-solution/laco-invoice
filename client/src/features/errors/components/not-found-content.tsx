import { motion } from "framer-motion"
import { ArrowLeft, Compass, Home, LayoutGrid, ShoppingCart, Users } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { defaultTransition, fadeIn } from "@/shared/motion-variants"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"

interface NotFoundContentProps {
  isAuthenticated: boolean
  variant?: "standalone" | "embedded"
}

const QUICK_LINKS = [
  { key: "dashboard", path: ROUTES.dashboard.root, icon: LayoutGrid },
  { key: "orders", path: ROUTES.dashboard.orders, icon: ShoppingCart },
  { key: "customers", path: ROUTES.dashboard.customers, icon: Users },
] as const

export function NotFoundContent({
  isAuthenticated,
  variant = "embedded",
}: NotFoundContentProps) {
  const { t } = useTranslation("errors")
  const location = useLocation()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const requestedPath = `${location.pathname}${location.search}${location.hash}`
  const descriptionId = "not-found-description"
  const pathId = "not-found-path"

  useEffect(() => {
    document.title = t("not_found.page_title")
    headingRef.current?.focus()
  }, [t])

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(isAuthenticated ? ROUTES.dashboard.root : ROUTES.auth.login)
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
      aria-labelledby="not-found-title"
      aria-describedby={`${descriptionId} ${pathId}`}
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
          {t("not_found.code")}
        </p>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex size-14 items-center justify-center border border-border bg-card text-primary shadow-sm">
            <Compass className="size-7" aria-hidden />
          </div>
        </div>
      </div>

      <h1
        ref={headingRef}
        id="not-found-title"
        tabIndex={-1}
        className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        {t("not_found.title")}
      </h1>

      <p
        id={descriptionId}
        className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
      >
        {t("not_found.description")}
      </p>

      <div
        id={pathId}
        className="mt-6 w-full max-w-md border border-border bg-muted/30 px-4 py-3 text-left"
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("not_found.path_label")}
        </p>
        <p className="mt-1 break-all font-mono text-sm text-foreground">{requestedPath}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to={isAuthenticated ? ROUTES.dashboard.root : ROUTES.auth.login}>
            <Home data-icon="inline-start" aria-hidden />
            {isAuthenticated ? t("not_found.go_home") : t("not_found.go_login")}
          </Link>
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={handleGoBack}>
          <ArrowLeft data-icon="inline-start" aria-hidden />
          {t("not_found.go_back")}
        </Button>
      </div>

      {isAuthenticated ? (
        <nav
          aria-label={t("not_found.quick_links_label")}
          className="mt-10 w-full max-w-md border border-border bg-card p-4 shadow-sm"
        >
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("not_found.quick_links_label")}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon

              return (
                <li key={link.key}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 border border-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50"
                  >
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                    {t(`not_found.links.${link.key}`)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      ) : null}
    </motion.section>
  )
}
