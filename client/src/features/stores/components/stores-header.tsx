import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"

export function StoresHeader() {
  const { t } = useTranslation("stores")

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Button asChild>
        <Link to={ROUTES.dashboard.storeCreate}>
          <Plus className="size-4" aria-hidden />
          {t("actions.add_store")}
        </Link>
      </Button>
    </div>
  )
}
