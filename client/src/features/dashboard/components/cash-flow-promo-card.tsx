import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

export function CashFlowPromoCard() {
  const { t } = useTranslation("dashboard")

  return (
    <section className="relative overflow-hidden border border-border bg-foreground p-5 text-background shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,color-mix(in_oklch,var(--primary),transparent_70%)_100%)] opacity-60"
        aria-hidden
      />
      <div className="relative space-y-4">
        <p className="max-w-[220px] text-sm leading-relaxed text-background/90">
          <span className="font-semibold text-background">{t("promo.title")}</span>{" "}
          {t("promo.description")}
        </p>
        <Button size="sm">{t("promo.cta")}</Button>
      </div>
    </section>
  )
}
