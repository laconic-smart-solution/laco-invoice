import { Store } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/common/stat-card"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatNumber } from "@/util/format"

interface StoresStatCardsProps {
  totalStores: number
}

export function StoresStatCards({ totalStores }: StoresStatCardsProps) {
  const { t } = useTranslation("stores")
  const locale = useLocaleStore((state) => state.locale)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title={t("stats.total_stores")}
        value={formatNumber(totalStores, locale)}
        icon={Store}
        iconWrapperClassName="bg-primary/10 text-primary"
      />
    </div>
  )
}
