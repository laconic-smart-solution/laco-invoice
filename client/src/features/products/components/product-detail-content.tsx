import { useTranslation } from "react-i18next"

import type { Locale } from "@/app/i18n"
import type { MarketplaceProductDetail } from "@/features/products/types/product"
import { formatCurrency } from "@/util/format"

interface ProductDetailContentProps {
  product: MarketplaceProductDetail
  locale: Locale
}

export function ProductDetailContent({ product, locale }: ProductDetailContentProps) {
  const { t } = useTranslation("products")
  const images = product.images ?? []
  const variants = product.variants ?? []
  const description = product.description?.trim() ?? ""

  return (
    <div className="space-y-6">
      <section className="space-y-3 border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">{t("detail.images")}</h2>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((imageUrl) => (
              <a
                key={imageUrl}
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden border border-border bg-muted"
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
        ) : (
          <p className="text-sm text-muted-foreground">{t("detail.empty.no_images")}</p>
        )}
      </section>

      <section className="space-y-3 border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">{t("detail.description")}</h2>
        {description ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("detail.empty.no_description")}</p>
        )}
      </section>

      <section className="space-y-3 border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">{t("detail.variants")}</h2>
        {variants.length > 0 ? (
          <div className="overflow-x-auto border border-border">
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
                {variants.map((variant) => {
                  const variantPrice = Number.parseFloat(variant.price)
                  return (
                    <tr key={variant.sku} className="border-t border-border">
                      <td className="px-4 py-2 font-mono">{variant.sku}</td>
                      <td className="px-4 py-2">
                        {Number.isFinite(variantPrice)
                          ? formatCurrency(
                              variantPrice,
                              locale,
                              variant.currency || product.currency
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {variant.status || t("status.unknown")}
                      </td>
                      <td className="px-4 py-2">{variant.quantity || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("detail.empty.no_variants")}</p>
        )}
      </section>
    </div>
  )
}
