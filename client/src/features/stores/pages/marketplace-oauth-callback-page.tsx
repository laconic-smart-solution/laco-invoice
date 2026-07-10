import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import type { MarketplaceConfig } from "@/features/stores/config/marketplaces"
import {
  getMarketplaceByRouteSegment,
  getMarketplaceFromCallbackPath,
} from "@/features/stores/config/marketplaces"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { parseOAuthState } from "@/features/stores/util/oauth-state"
import {
  getMarketplaceErrorMessage,
  useMarketplaceConnectMutation,
} from "@/shared/queries/marketplace-connection.query"

export function MarketplaceOAuthCallbackPage() {
  const { marketplace: marketplaceParam = "" } = useParams()
  const { pathname } = useLocation()
  const marketplaceConfig =
    getMarketplaceByRouteSegment(marketplaceParam) ?? getMarketplaceFromCallbackPath(pathname)

  if (!marketplaceConfig) {
    return <UnsupportedMarketplaceCallback />
  }

  return <MarketplaceOAuthCallbackContent marketplace={marketplaceConfig} />
}

function UnsupportedMarketplaceCallback() {
  const { t } = useTranslation("stores")
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-heading text-2xl font-semibold">{t("callback.title")}</h1>
      <AuthFormError message={t("callback.unsupported_marketplace")} />
    </div>
  )
}

interface MarketplaceOAuthCallbackContentProps {
  marketplace: MarketplaceConfig
}

function MarketplaceOAuthCallbackContent({ marketplace }: MarketplaceOAuthCallbackContentProps) {
  const { t } = useTranslation("stores")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const marketplaceKey = marketplace.code.toLowerCase()

  const connectMutation = useMarketplaceConnectMutation(marketplace.code)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const hasStarted = useRef(false)

  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const shopId = searchParams.get("shop_id")

  const validationError = useMemo(() => {
    if (!code) {
      return t(`marketplaces.${marketplaceKey}.callback.missing_code`)
    }
    if (!state) {
      return t(`marketplaces.${marketplaceKey}.callback.missing_state`)
    }
    try {
      parseOAuthState(state)
    } catch {
      return t(`marketplaces.${marketplaceKey}.callback.missing_state`)
    }
    return null
  }, [code, marketplaceKey, state, t])

  useEffect(() => {
    if (validationError || hasStarted.current || !code || !state) {
      return
    }

    hasStarted.current = true
    const oauthState = parseOAuthState(state)

    connectMutation
      .mutateAsync({
        storeId: oauthState.storeId,
        payload: {
          code,
          shopId: shopId ?? undefined,
        },
      })
      .then(() => {
        setSuccessMessage(t(`marketplaces.${marketplaceKey}.callback.success`))
        window.setTimeout(() => {
          navigate(ROUTES.dashboard.storeDetail(oauthState.storeId), { replace: true })
        }, 1200)
      })
      .catch((err: unknown) => {
        setRequestError(
          getMarketplaceErrorMessage(
            err,
            t(`marketplaces.${marketplaceKey}.callback.failed`)
          )
        )
      })
  }, [code, connectMutation, marketplaceKey, navigate, shopId, state, t, validationError])

  const displayError = validationError ?? requestError

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-heading text-2xl font-semibold">
        {t(`marketplaces.${marketplaceKey}.callback.title`)}
      </h1>
      {displayError ? (
        <AuthFormError message={displayError} />
      ) : successMessage ? (
        <p role="status" className="text-sm text-success">
          {successMessage}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t(`marketplaces.${marketplaceKey}.callback.processing`)}
        </p>
      )}
    </div>
  )
}
