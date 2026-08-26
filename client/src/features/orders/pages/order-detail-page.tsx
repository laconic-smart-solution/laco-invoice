import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { Button } from "@/components/ui/button"
import { OrderDetailHeader } from "@/features/orders/components/order-detail-header"
import { OrderDetailInfo } from "@/features/orders/components/order-detail-info"
import { OrderLineItems } from "@/features/orders/components/order-line-items"
import { mapOrderDetailDtoToOrderDetail } from "@/features/orders/util/map-order"
import {
  getOrderErrorMessage,
  useOrderDetailQuery,
  useTriggerOrderSyncMutation,
} from "@/shared/queries/order.query"
import { useLocaleStore } from "@/shared/stores/locale-store"

export function OrderDetailPage() {
  const { t } = useTranslation("orders")
  const { orderId = "" } = useParams()
  const locale = useLocaleStore((state) => state.locale)

  const numericOrderId = Number.parseInt(orderId, 10)
  const {
    data: orderDetail,
    isLoading,
    isError,
    error,
  } = useOrderDetailQuery(Number.isFinite(numericOrderId) ? numericOrderId : null)
  const syncMutation = useTriggerOrderSyncMutation()

  const order = useMemo(
    () => (orderDetail ? mapOrderDetailDtoToOrderDetail(orderDetail) : null),
    [orderDetail]
  )

  const loadError =
    isError && error
      ? getOrderErrorMessage(error, t("errors.load_failed"))
      : null

  const syncError =
    syncMutation.isError && syncMutation.error
      ? getOrderErrorMessage(syncMutation.error, t("errors.sync_failed"))
      : null

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
        {t("detail.loading")}
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <AuthFormError message={loadError} />
        <h1 className="font-heading text-xl font-semibold">{t("detail.not_found_title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("detail.not_found_description")}
        </p>
        <Button asChild>
          <Link to={ROUTES.dashboard.orders}>{t("detail.back_to_orders")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <AuthFormError message={syncError} />

      <OrderDetailHeader
        order={order}
        locale={locale}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
      />
      <OrderDetailInfo order={order} locale={locale} />
      <OrderLineItems order={order} />
    </div>
  )
}
