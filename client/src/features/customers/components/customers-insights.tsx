import { LineChart, RefreshCw, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

export function CustomersInsights() {
  const { t } = useTranslation("customers")

  const cards = [
    {
      key: "growth",
      icon: LineChart,
      title: t("insights.growth.title"),
      description: t("insights.growth.description"),
      action: t("insights.growth.action"),
    },
    {
      key: "identity",
      icon: Shield,
      title: t("insights.identity.title"),
      description: t("insights.identity.description"),
    },
    {
      key: "sync",
      icon: RefreshCw,
      title: t("insights.sync.title"),
      description: t("insights.sync.description"),
    },
  ] as const

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cards.map((card) => (
        <section
          key={card.key}
          className="flex flex-col gap-3 border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center bg-primary/10 text-primary">
              <card.icon className="size-4" aria-hidden />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-semibold">{card.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>
            </div>
          </div>
          {"action" in card && card.action ? (
            <Button variant="link" className="h-auto w-fit p-0 text-primary">
              {card.action}
            </Button>
          ) : null}
        </section>
      ))}
    </div>
  )
}
