import { FileText, RefreshCw, Zap } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import type { Locale } from "@/app/i18n"
import { ROUTES } from "@/app/constants/routes"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type {
  OrderDetail,
  OrderSourceType,
  OrderSyncStatus,
} from "@/features/orders/types/order"
import { formatDate } from "@/util/format"

const SYNC_STATUS_BADGE: Record<OrderSyncStatus, StatusBadgeVariant> = {
  synced: "synced",
  pending: "pending",
  failed: "failed",
}

const SOURCE_TYPE_BADGE: Record<OrderSourceType, StatusBadgeVariant> = {
  API: "synced",
  IMPORT: "draft",
}

interface OrderDetailHeaderProps {
  order: OrderDetail
  locale: Locale
  onGenerate: () => void
  isGenerating?: boolean
  onSync?: () => void
  isSyncing?: boolean
}

export function OrderDetailHeader({
  order,
  locale,
  onGenerate,
  isGenerating = false,
  onSync,
  isSyncing = false,
}: OrderDetailHeaderProps) {
  const { t } = useTranslation("orders")

  const orderDateLabel = (() => {
    if (!order.orderDate) {
      return "—"
    }
    const parsed = new Date(order.orderDate)
    if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() < 1971) {
      return "—"
    }
    return formatDate(order.orderDate, locale)
  })()

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {order.orderId}
          </h1>
          <StatusBadge
            status={SYNC_STATUS_BADGE[order.syncStatus]}
            label={t(`sync_status.${order.syncStatus}`).toUpperCase()}
            showDot
          />
          <StatusBadge
            status={SOURCE_TYPE_BADGE[order.sourceType]}
            label={t(
              `source_type.${order.sourceType === "IMPORT" ? "import" : "api"}`
            ).toUpperCase()}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("detail.placed_on", {
            date: orderDateLabel,
          })}
          {" · "}
          {order.storeName}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="border-primary text-primary"
          onClick={onSync}
          disabled={isSyncing || !onSync}
        >
          <RefreshCw
            data-icon="inline-start"
            className={isSyncing ? "animate-spin" : undefined}
          />
          {t("actions.sync_orders")}
        </Button>
        {order.invoiceId ? (
          <Button variant="outline" asChild>
            <Link to={ROUTES.dashboard.invoiceDetail(order.invoiceId)}>
              <FileText data-icon="inline-start" />
              {t("detail.view_invoice")}
            </Link>
          </Button>
        ) : (
          <Button onClick={onGenerate} disabled={isGenerating}>
            <Zap data-icon="inline-start" />
            {t("table.actions.generate")}
          </Button>
        )}
      </div>
    </div>
  )
}
