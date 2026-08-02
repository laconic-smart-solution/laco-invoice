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
    <div className="grid gap-4 lg:grid-cols-3">
      <StatCard
        title={t("stats.total_users")}
        value={t("stats.total_users_value", {
          count: formatNumber(totalUsers, locale),
        })}
        icon={UserCog}
        iconWrapperClassName="bg-info/10 text-info"
      />
    </div>
  )
}
