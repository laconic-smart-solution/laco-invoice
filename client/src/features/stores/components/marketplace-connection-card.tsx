import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { MarketplaceCode } from "@/features/stores/config/marketplaces"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { StatusBadge } from "@/components/common/status-badge"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { Button } from "@/components/ui/button"
import type { MarketplaceConnection } from "@/features/stores/types/store"
import {
  getMarketplaceErrorMessage,
  useMarketplaceRefreshMutation,
  useMarketplaceRevokeMutation,
} from "@/shared/queries/marketplace-connection.query"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatDateTime } from "@/util/format"

interface MarketplaceConnectionCardProps {
  storeId: number
  marketplaceCode: MarketplaceCode
  connection: MarketplaceConnection
}

export function MarketplaceConnectionCard({
  storeId,
  marketplaceCode,
  connection,
}: MarketplaceConnectionCardProps) {
  const { t } = useTranslation("stores")
  const locale = useLocaleStore((state) => state.locale)
  const marketplaceKey = marketplaceCode.toLowerCase()
  const refreshMutation = useMarketplaceRefreshMutation(marketplaceCode)
  const revokeMutation = useMarketplaceRevokeMutation(marketplaceCode)
  const [error, setError] = useState<string | null>(null)
  const [isRevokeOpen, setIsRevokeOpen] = useState(false)

  const displayName =
    connection.displayName?.trim() ||
    connection.shortCode?.trim() ||
    connection.account?.trim() ||
    connection.sellerId

  const isConnected = connection.status === "CONNECTED"

  const handleRefresh = async () => {
    setError(null)
    try {
      await refreshMutation.mutateAsync({
        storeId,
        externalConnectionId: connection.externalConnectionId,
      })
    } catch (err: unknown) {
      setError(
        getMarketplaceErrorMessage(err, t("errors.marketplace_failed", { marketplace: marketplaceKey }))
      )
    }
  }

  const handleRevoke = async () => {
    setError(null)
    try {
      await revokeMutation.mutateAsync({
        storeId,
        externalConnectionId: connection.externalConnectionId,
      })
      setIsRevokeOpen(false)
    } catch (err: unknown) {
      setError(
        getMarketplaceErrorMessage(err, t("errors.marketplace_failed", { marketplace: marketplaceKey }))
      )
    }
  }

  return (
    <article className="space-y-4 border border-border bg-card p-4 shadow-sm">
      <AuthFormError message={error} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-foreground">{displayName}</h3>
            <StatusBadge
              status={isConnected ? "synced" : "failed"}
              label={
                isConnected
                  ? t(`marketplaces.${marketplaceKey}.status_connected`)
                  : t(`marketplaces.${marketplaceKey}.status_disconnected`)
              }
              showDot
            />
          </div>
          <dl className="grid gap-1 text-sm text-muted-foreground">
            <div>
              <dt className="inline">{t(`marketplaces.${marketplaceKey}.seller_id`)}: </dt>
              <dd className="inline font-mono text-foreground">{connection.sellerId}</dd>
            </div>
            {connection.country ? (
              <div>
                <dt className="inline">{t(`marketplaces.${marketplaceKey}.country`)}: </dt>
                <dd className="inline text-foreground">{connection.country}</dd>
              </div>
            ) : null}
            {connection.tokenExpiresAt ? (
              <div>
                <dt className="inline">{t(`marketplaces.${marketplaceKey}.token_expires`)}: </dt>
                <dd className="inline text-foreground">
                  {formatDateTime(connection.tokenExpiresAt, locale)}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshMutation.isPending || !isConnected}
            onClick={() => void handleRefresh()}
          >
            {t(`marketplaces.${marketplaceKey}.refresh`)}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={revokeMutation.isPending}
            onClick={() => setIsRevokeOpen(true)}
          >
            {t(`marketplaces.${marketplaceKey}.disconnect`)}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={isRevokeOpen}
        onOpenChange={setIsRevokeOpen}
        title={t(`marketplaces.${marketplaceKey}.confirm_disconnect_title`)}
        description={t(`marketplaces.${marketplaceKey}.confirm_disconnect_description`, {
          name: displayName,
        })}
        confirmLabel={t(`marketplaces.${marketplaceKey}.confirm_disconnect_button`)}
        variant="destructive"
        isLoading={revokeMutation.isPending}
        onConfirm={handleRevoke}
      />
    </article>
  )
}
