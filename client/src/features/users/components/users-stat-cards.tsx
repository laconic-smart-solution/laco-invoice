import { UserCog } from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatCard } from "@/components/common/stat-card"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatNumber } from "@/util/format"

interface UsersStatCardsProps {
  totalUsers: number
}

export function UsersStatCards({ totalUsers }: UsersStatCardsProps) {
  const { t } = useTranslation("users")
  const locale = useLocaleStore((state) => state.locale)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title={t("stats.total_users")}
        value={formatNumber(totalUsers, locale)}
        icon={UserCog}
      />
    </div>
  )
}
