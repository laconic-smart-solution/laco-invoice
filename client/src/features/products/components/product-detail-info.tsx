import { BadgeDollarSign, Boxes, Hash, Link2, Package, Tag } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Locale } from "@/app/i18n"
import type { MarketplaceProductDetail } from "@/features/products/types/product"
import { normalizeProductErpStatus } from "@/features/products/util/erp-status"
import { formatCurrency, formatDateTime } from "@/util/format"

interface DetailFieldProps {
  icon: typeof Package
  label: string
  value: string
  mono?: boolean
}

function DetailField({ icon: Icon, label, value, mono = false }: DetailFieldProps) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium break-words ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

interface ProductDetailInfoProps {
  product: MarketplaceProductDetail
  locale: Locale
}

export function ProductDetailInfo({ product, locale }: ProductDetailInfoProps) {
  const { t } = useTranslation("products")
  const erpStatus = normalizeProductErpStatus(product.erp?.status)

  const priceAmount = Number.parseFloat(product.price)
  const formattedPrice = Number.isFinite(priceAmount)
    ? formatCurrency(priceAmount, locale, product.currency || "USD")
    : "—"

  const marketplaceStatus = product.status?.trim()
    ? product.status
    : t("detail.empty.no_marketplace_status")

  const mappedAt =
    product.erp?.mappedAt != null
      ? formatDateTime(product.erp.mappedAt, locale)
      : "—"

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-4 border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sections.product_info")}
        </h2>
        <div className="space-y-4">
          <DetailField
            icon={Hash}
            label={t("detail.fields.external_product_id")}
            value={product.externalProductId?.trim() || "—"}
            mono
          />
          <DetailField
            icon={Tag}
            label={t("detail.fields.sku")}
            value={product.sku?.trim() || "—"}
            mono
          />
          <DetailField
            icon={Package}
            label={t("detail.fields.marketplace_status")}
            value={marketplaceStatus}
          />
          <DetailField
            icon={BadgeDollarSign}
            label={t("detail.fields.price")}
            value={formattedPrice}
          />
          <DetailField
            icon={Boxes}
            label={t("detail.fields.currency")}
            value={product.currency?.trim() || "—"}
          />
        </div>
      </section>

      <section className="space-y-4 border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sections.erp_mapping")}
        </h2>
        <div className="space-y-4">
          <DetailField
            icon={Link2}
            label={t("detail.fields.erp_status")}
            value={t(`erp_status.${erpStatus}`)}
          />
          <DetailField
            icon={Tag}
            label={t("detail.fields.erp_sku")}
            value={product.erp?.erpSku?.trim() || "—"}
            mono
          />
          <DetailField
            icon={Package}
            label={t("detail.fields.erp_name")}
            value={product.erp?.erpName?.trim() || "—"}
          />
          <DetailField
            icon={Hash}
            label={t("detail.fields.erp_item_id")}
            value={
              product.erp?.erpItemId != null ? String(product.erp.erpItemId) : "—"
            }
            mono
          />
          <DetailField
            icon={Boxes}
            label={t("detail.fields.mapped_at")}
            value={mappedAt}
          />
        </div>
      </section>
    </div>
  )
}
