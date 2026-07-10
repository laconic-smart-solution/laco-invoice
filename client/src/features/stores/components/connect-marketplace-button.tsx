import { Link2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { MarketplaceCode } from "@/features/stores/config/marketplaces"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { Button } from "@/components/ui/button"
import {
  getMarketplaceErrorMessage,
  useMarketplaceAuthorizeUrlMutation,
} from "@/shared/queries/marketplace-connection.query"

interface ConnectMarketplaceButtonProps {
  storeId: number
  marketplaceCode: MarketplaceCode
}

export function ConnectMarketplaceButton({
  storeId,
  marketplaceCode,
}: ConnectMarketplaceButtonProps) {
  const { t } = useTranslation("stores")
  const authorizeMutation = useMarketplaceAuthorizeUrlMutation(marketplaceCode)
  const [error, setError] = useState<string | null>(null)

  const marketplaceKey = marketplaceCode.toLowerCase()

  const handleConnect = async () => {
    setError(null)
    try {
      const result = await authorizeMutation.mutateAsync(storeId)
      window.location.assign(result.url)
    } catch (err: unknown) {
      setError(
        getMarketplaceErrorMessage(err, t(`errors.marketplace_failed`, { marketplace: marketplaceKey }))
      )
    }
  }

  return (
    <div className="space-y-2">
      <AuthFormError message={error} />
      <Button
        type="button"
        onClick={() => void handleConnect()}
        disabled={authorizeMutation.isPending}
      >
        <Link2 className="size-4" aria-hidden />
        {authorizeMutation.isPending
          ? t(`marketplaces.${marketplaceKey}.connecting`)
          : t(`marketplaces.${marketplaceKey}.connect`)}
      </Button>
    </div>
  )
}
