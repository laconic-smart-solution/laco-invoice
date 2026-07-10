import { ChevronRight, Plus, Store } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { getEnabledMarketplaces } from "@/features/stores/config/marketplaces"
import { cn } from "@/lib/utils"

export function ActiveMarketplacesCard() {
  const { t } = useTranslation("dashboard")
  const marketplaces = getEnabledMarketplaces()

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-heading text-sm font-semibold">
          {t("marketplaces.title")}
        </h2>
      </div>

      <ul className="divide-y divide-border">
        {marketplaces.map((marketplace) => (
          <li key={marketplace.code}>
            <Link
              to={ROUTES.dashboard.stores}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center bg-muted text-foreground"
                )}
              >
                <Store className="size-4" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-medium">
                {t(`marketplaces.channels.${marketplace.code.toLowerCase()}`)}
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-t border-border p-4">
        <Button
          variant="outline"
          className="w-full border-dashed text-muted-foreground"
          asChild
        >
          <Link to={ROUTES.dashboard.stores}>
            <Plus data-icon="inline-start" />
            {t("marketplaces.connect_channel")}
          </Link>
        </Button>
      </div>
    </section>
  )
}
