import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { useIsClassicEmbed } from "@/features/classic-spa/classic-embed-context"
import { useClassicWorkspaceStore } from "@/shared/stores/classic-workspace-store"

export function StoresHeader() {
  const { t } = useTranslation(["stores", "classic"])
  const isClassic = useIsClassicEmbed()
  const navigate = useNavigate()
  const setSetup = useClassicWorkspaceStore((state) => state.setSetup)

  const handleAddStore = () => {
    if (isClassic) {
      setSetup("store")
      void navigate(ROUTES.dashboard.storeCreate, { replace: true })
      return
    }
    void navigate(ROUTES.dashboard.storeCreate)
  }

  const addButton = isClassic ? (
    <Button type="button" size="sm" onClick={handleAddStore}>
      <Plus className="size-4" aria-hidden />
      {t("classic:toolbar.add_store")}
    </Button>
  ) : (
    <Button asChild>
      <Link to={ROUTES.dashboard.storeCreate}>
        <Plus className="size-4" aria-hidden />
        {t("stores:actions.add_store")}
      </Link>
    </Button>
  )

  if (isClassic) {
    return <div className="flex justify-end">{addButton}</div>
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("stores:title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("stores:subtitle")}
        </p>
      </div>
      {addButton}
    </div>
  )
}
