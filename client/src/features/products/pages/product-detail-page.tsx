import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { ProductDetailContent } from "@/features/products/components/product-detail-content"
import { ProductDetailHeader } from "@/features/products/components/product-detail-header"
import { ProductDetailInfo } from "@/features/products/components/product-detail-info"
import { useMarketplaceProductDetailQuery } from "@/shared/queries/marketplace-product.query"
import { useLocaleStore } from "@/shared/stores/locale-store"

export function ProductDetailPage() {
  const { t } = useTranslation("products")
  const { productId = "" } = useParams()
  const locale = useLocaleStore((state) => state.locale)
  const parsedProductId = Number.parseInt(productId, 10)

  const {
    data: product,
    isLoading,
    error,
  } = useMarketplaceProductDetailQuery(
    Number.isFinite(parsedProductId) ? parsedProductId : 0
  )

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
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
        {t("detail.loading")}
      </div>
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

  return (
    <div className="space-y-6 p-6">
      <ProductDetailHeader product={product} locale={locale} />
      <ProductDetailInfo product={product} locale={locale} />
      <ProductDetailContent product={product} locale={locale} />
    </div>
  )
}
