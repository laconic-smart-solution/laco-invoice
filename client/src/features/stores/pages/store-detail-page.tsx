import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CustomerFormPageLayout } from "@/features/customers/components/customer-form-page-layout"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { getEnabledMarketplaces } from "@/features/stores/config/marketplaces"
import { MarketplaceConnectionsSection } from "@/features/stores/components/marketplace-connections-section"
import {
  getStoreErrorMessage,
  useStoreQuery,
} from "@/shared/queries/store.query"

export function StoreDetailPage() {
  const { t } = useTranslation("stores")
  const { storeId = "" } = useParams()
  const parsedStoreId = Number(storeId)
  const enabledMarketplaces = getEnabledMarketplaces()

  const {
    data: store,
    isLoading: isStoreLoading,
    isError: isStoreError,
    error: storeError,
  } = useStoreQuery(parsedStoreId)

  const loadError = useMemo(() => {
    if (isStoreError && storeError) {
      return getStoreErrorMessage(storeError, t("errors.load_failed"))
    }
    return null
  }, [isStoreError, storeError, t])

  const subtitle = isStoreLoading ? undefined : store?.name

  return (
    <CustomerFormPageLayout
      backHref={ROUTES.dashboard.stores}
      backLabel={t("form.back_to_list")}
      title={t("detail.title")}
      subtitle={subtitle}
      actions={
        <Button variant="outline" asChild>
          <Link to={ROUTES.dashboard.stores}>{t("form.cancel")}</Link>
        </Button>
      }
    >
      <div className="space-y-8">
        <AuthFormError message={loadError} />

        {store ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={store.active ? "secondary" : "destructive"}>
              {store.active ? t("table.status.active") : t("table.status.inactive")}
            </Badge>
          </div>
        ) : null}

        {parsedStoreId > 0
          ? enabledMarketplaces.map((marketplace) => (
              <MarketplaceConnectionsSection
                key={marketplace.code}
                storeId={parsedStoreId}
                marketplace={marketplace}
              />
            ))
          : null}
      </div>
    </CustomerFormPageLayout>
  )
}
