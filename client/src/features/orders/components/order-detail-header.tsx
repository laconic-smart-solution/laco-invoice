import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Locale } from "@/app/i18n"
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
  onSync?: () => void
  isSyncing?: boolean
  variant?: "page" | "sheet"
}

export function OrderDetailHeader({
  order,
  locale,
  onSync,
  isSyncing = false,
  variant = "page",
}: OrderDetailHeaderProps) {
  const { t } = useTranslation("orders")
  const isSheet = variant === "sheet"

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
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h1
            className={
              isSheet
                ? "font-heading text-lg font-semibold tracking-tight break-all"
                : "font-heading text-2xl font-semibold tracking-tight"
            }
          >
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
        <p className="text-sm text-muted-foreground break-words">
          {t("detail.placed_on", {
            date: orderDateLabel,
          })}
          {" · "}
          {order.storeName}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size={isSheet ? "sm" : "default"}
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
      </div>
    </div>
  )
}
