import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

import { SIDEBAR_NAV_ITEMS } from "@/constants/navigation"

export function SectionPlaceholderPage() {
  const { t } = useTranslation("sidebar")
  const { pathname } = useLocation()

  const navItem = SIDEBAR_NAV_ITEMS.find((item) => item.path === pathname)
  const title = navItem ? t(`nav.${navItem.key}`) : pathname

  return (
    <div className="p-6">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
    </div>
  )
}
