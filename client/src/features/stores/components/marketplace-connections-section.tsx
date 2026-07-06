import { useTranslation } from "react-i18next"

import type { MarketplaceConfig } from "@/features/stores/config/marketplaces"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { ConnectMarketplaceButton } from "@/features/stores/components/connect-marketplace-button"
import { MarketplaceConnectionCard } from "@/features/stores/components/marketplace-connection-card"
import {
  getMarketplaceErrorMessage,
  useMarketplaceConnectionsQuery,
} from "@/shared/queries/marketplace-connection.query"

interface MarketplaceConnectionsSectionProps {
  storeId: number
  marketplace: MarketplaceConfig
}

export function MarketplaceConnectionsSection({
  storeId,
  marketplace,
}: MarketplaceConnectionsSectionProps) {
  const { t } = useTranslation("stores")
  const marketplaceKey = marketplace.code.toLowerCase()

  const {
    data: connections = [],
    isLoading,
    isError,
    error,
  } = useMarketplaceConnectionsQuery(marketplace.code, storeId, marketplace.connectEnabled)

  const loadError =
    isError && error
      ? getMarketplaceErrorMessage(
          error,
          t("errors.marketplace_failed", { marketplace: marketplaceKey })
        )
      : null

  if (!marketplace.connectEnabled) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t(`marketplaces.${marketplaceKey}.connections_title`)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(`marketplaces.${marketplaceKey}.connections_subtitle`)}
          </p>
        </div>
        <ConnectMarketplaceButton storeId={storeId} marketplaceCode={marketplace.code} />
      </div>

      <AuthFormError message={loadError} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("table.loading")}</p>
      ) : connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t(`marketplaces.${marketplaceKey}.no_connections`)}
        </p>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <MarketplaceConnectionCard
              key={connection.externalConnectionId}
              storeId={storeId}
              marketplaceCode={marketplace.code}
              connection={connection}
            />
          ))}
        </div>
      )}
    </section>
  )
}
