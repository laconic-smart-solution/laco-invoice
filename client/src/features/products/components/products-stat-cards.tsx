import { CheckCircle2, RefreshCw, ShoppingBag } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/common/stat-card"
import type { ProductStats } from "@/features/products/types/product"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatNumber } from "@/util/format"

interface ProductsStatCardsProps {
  stats: ProductStats
}

export function ProductsStatCards({ stats }: ProductsStatCardsProps) {
  const { t } = useTranslation("products")
  const locale = useLocaleStore((state) => state.locale)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <StatCard
        title={t("stats.mapping_rate")}
        value={`${stats.mappingRatePercent}%`}
        icon={CheckCircle2}
        iconWrapperClassName="bg-success/10 text-success"
      />
      <StatCard
        title={t("stats.action_required")}
        value={t("stats.action_required_value", {
          count: formatNumber(stats.actionRequiredCount, locale),
        })}
        icon={RefreshCw}
        iconWrapperClassName="bg-destructive/10 text-destructive"
      />
      <StatCard
        title={t("stats.active_sku")}
        value={t("stats.active_sku_value", {
          count: formatNumber(stats.activeSkuCount, locale),
        })}
        icon={ShoppingBag}
        iconWrapperClassName="bg-info/10 text-info"
      />
    </div>
  )
}
