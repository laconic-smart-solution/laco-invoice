import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { useMarketplaceProductDetailQuery } from "@/shared/queries/marketplace-product.query"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency } from "@/util/format"

export function ProductDetailPage() {
  const { t } = useTranslation("products")
  const { productId = "" } = useParams()
  const locale = useLocaleStore((state) => state.locale)
  const parsedProductId = Number.parseInt(productId, 10)

  const {
    data: product,
    isLoading,
    error,
  } = useMarketplaceProductDetailQuery(Number.isFinite(parsedProductId) ? parsedProductId : 0)

  if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold">{t("detail.not_found_title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("detail.not_found_description")}
        </p>
        <Button asChild>
          <Link to={ROUTES.dashboard.products}>{t("detail.back_to_products")}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">{t("detail.loading")}</div>
    )
  }

  if (error != null || !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-heading text-xl font-semibold">{t("detail.not_found_title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("detail.not_found_description")}
        </p>
        <Button asChild>
          <Link to={ROUTES.dashboard.products}>{t("detail.back_to_products")}</Link>
        </Button>
      </div>
    )
  }

  const priceAmount = Number.parseFloat(product.price)
  const formattedPrice = Number.isFinite(priceAmount)
    ? formatCurrency(priceAmount, locale, product.currency || "USD")
    : "—"

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="link" className="h-auto p-0 text-muted-foreground" asChild>
            <Link to={ROUTES.dashboard.products}>{t("detail.back_to_products")}</Link>
          </Button>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{product.storeName}</span>
            <span>·</span>
            <span>{product.marketplaceName}</span>
            {product.sku ? (
              <>
                <span>·</span>
                <span className="font-mono">{product.sku}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="space-y-2 text-right">
          <p className="text-2xl font-semibold text-foreground">{formattedPrice}</p>
          <StatusBadge
            status="synced"
            label={(product.status || t("status.unknown")).toUpperCase()}
            showDot
          />
        </div>
      </div>

      {product.images.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{t("detail.images")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {product.images.map((imageUrl) => (
              <a
                key={imageUrl}
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-md border border-border bg-muted"
              >
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="aspect-square size-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {product.description ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{t("detail.description")}</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{product.description}</p>
        </section>
      ) : null}

      {product.variants.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{t("detail.variants")}</h2>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("detail.variant_sku")}</th>
                  <th className="px-4 py-2 font-medium">{t("detail.variant_price")}</th>
                  <th className="px-4 py-2 font-medium">{t("detail.variant_status")}</th>
                  <th className="px-4 py-2 font-medium">{t("detail.variant_quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((variant) => {
                  const variantPrice = Number.parseFloat(variant.price)
                  return (
                    <tr key={variant.sku} className="border-t border-border">
                      <td className="px-4 py-2 font-mono">{variant.sku}</td>
                      <td className="px-4 py-2">
                        {Number.isFinite(variantPrice)
                          ? formatCurrency(variantPrice, locale, variant.currency || product.currency)
                          : "—"}
                      </td>
                      <td className="px-4 py-2">{variant.status || t("status.unknown")}</td>
                      <td className="px-4 py-2">{variant.quantity || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
