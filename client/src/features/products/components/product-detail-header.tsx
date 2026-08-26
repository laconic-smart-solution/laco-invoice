import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import type { Locale } from "@/app/i18n"
import { ROUTES } from "@/app/constants/routes"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { MarketplaceProductDetail } from "@/features/products/types/product"
import { normalizeProductErpStatus } from "@/features/products/util/erp-status"
import { formatCurrency } from "@/util/format"

interface ProductDetailHeaderProps {
  product: MarketplaceProductDetail
  locale: Locale
}

export function ProductDetailHeader({ product, locale }: ProductDetailHeaderProps) {
  const { t } = useTranslation("products")
  const erpStatus = normalizeProductErpStatus(product.erp?.status)
  const badgeStatus: StatusBadgeVariant =
    erpStatus === "synced" ? "synced" : "unmapped"

  const priceAmount = Number.parseFloat(product.price)
  const formattedPrice = Number.isFinite(priceAmount)
    ? formatCurrency(priceAmount, locale, product.currency || "USD")
    : "—"

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Button variant="link" className="h-auto p-0 text-muted-foreground" asChild>
          <Link to={ROUTES.dashboard.products}>{t("detail.back_to_products")}</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {product.name || "—"}
          </h1>
          <StatusBadge
            status={badgeStatus}
            label={t(`erp_status.${erpStatus}`).toUpperCase()}
            showDot
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{product.storeName || "—"}</span>
          <span>·</span>
          <span>{product.marketplaceName || "—"}</span>
          {product.sku ? (
            <>
              <span>·</span>
              <span className="font-mono">{product.sku}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="space-y-1 text-right">
        <p className="text-2xl font-semibold text-foreground">{formattedPrice}</p>
        <p className="text-xs text-muted-foreground">
          {product.currency || t("detail.fields.no_currency")}
        </p>
      </div>
    </div>
  )
}
