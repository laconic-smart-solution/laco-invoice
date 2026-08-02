import { Banknote, FileCheck2, FileX2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/common/stat-card"
import type { InvoiceStats } from "@/features/invoices/types/invoice"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatNumber } from "@/util/format"

interface InvoicesStatCardsProps {
  stats: InvoiceStats
}

export function InvoicesStatCards({ stats }: InvoicesStatCardsProps) {
  const { t } = useTranslation("invoices")
  const locale = useLocaleStore((state) => state.locale)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <StatCard
        title={t("stats.issued")}
        value={t("stats.issued_value", {
          count: formatNumber(stats.issuedCount, locale),
        })}
        icon={FileCheck2}
        iconWrapperClassName="bg-success/10 text-success"
      />
      <StatCard
        title={t("stats.total_billed")}
        value={formatCurrency(stats.issuedGrandTotal, locale, "THB")}
        icon={Banknote}
        iconWrapperClassName="bg-info/10 text-info"
      />
      <StatCard
        title={t("stats.voided")}
        value={t("stats.voided_value", {
          count: formatNumber(stats.voidedCount, locale),
        })}
        icon={FileX2}
        iconWrapperClassName="bg-destructive/10 text-destructive"
      />
    </div>
  )
}
