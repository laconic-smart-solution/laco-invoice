import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Button } from "@/components/ui/button"
import { OrderDetailHeader } from "@/features/orders/components/order-detail-header"
import { OrderDetailInfo } from "@/features/orders/components/order-detail-info"
import { OrderLineItems } from "@/features/orders/components/order-line-items"
import { getMockOrderById } from "@/features/orders/data/mock-orders"
import { useLocaleStore } from "@/shared/stores/locale-store"

export function OrderDetailPage() {
  const { t } = useTranslation("orders")
  const { orderId = "" } = useParams()
  const locale = useLocaleStore((state) => state.locale)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)

  const order = useMemo(() => getMockOrderById(orderId), [orderId])

  const handleConfirmGenerate = useCallback(() => {
    // TODO: wire invoice generation mutation
    setIsGenerateOpen(false)
  }, [])

  if (!order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
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
      <ConfirmDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        title={t("confirm.generate.title")}
        description={t("confirm.generate.description", {
          orderId: order.orderId,
        })}
        confirmLabel={t("table.actions.generate")}
        onConfirm={handleConfirmGenerate}
      />

      <OrderDetailHeader
        order={order}
        locale={locale}
        onGenerate={() => setIsGenerateOpen(true)}
      />
      <OrderDetailInfo order={order} locale={locale} />
      <OrderLineItems order={order} />
    </div>
  )
}
