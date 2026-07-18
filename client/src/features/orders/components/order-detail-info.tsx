import { Calendar, FileText, Mail, MapPin, Phone, Store, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import type { Locale } from "@/app/i18n"
import { ROUTES } from "@/app/constants/routes"
import type { OrderDetail } from "@/features/orders/types/order"
import { formatDate, formatDateTime } from "@/util/format"

interface DetailFieldProps {
  icon: typeof User
  label: string
  value: string
  href?: string
}

function DetailField({ icon: Icon, label, value, href }: DetailFieldProps) {
  const content = (
    <p className="text-sm font-medium break-words">
      {href ? (
        <Link to={href} className="text-primary underline-offset-2 hover:underline">
          {value}
        </Link>
      ) : (
        value
      )}
    </p>
  )

  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        {content}
      </div>
    </div>
  )
}

interface OrderDetailInfoProps {
  order: OrderDetail
  locale: Locale
}

export function OrderDetailInfo({ order, locale }: OrderDetailInfoProps) {
  const { t } = useTranslation("orders")
  const customerHref =
    order.customerId && order.customer !== "—"
      ? ROUTES.dashboard.customerEdit(order.customerId)
      : undefined

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="space-y-4 border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sections.order_info")}
        </h2>
        <div className="space-y-4">
          <DetailField
            icon={Store}
            label={t("table.columns.store")}
            value={order.storeName}
          />
          <DetailField
            icon={Calendar}
            label={t("table.columns.order_date")}
            value={
              order.orderDate &&
              !Number.isNaN(new Date(order.orderDate).getTime()) &&
              new Date(order.orderDate).getFullYear() >= 1971
                ? formatDate(order.orderDate, locale)
                : "—"
            }
          />
          {order.lastSyncedAt ? (
            <DetailField
              icon={Calendar}
              label={t("detail.last_synced")}
              value={formatDateTime(order.lastSyncedAt, locale)}
            />
          ) : null}
          {order.invoiceId ? (
            <DetailField
              icon={FileText}
              label={t("detail.invoice_id")}
              value={order.invoiceId}
            />
          ) : null}
        </div>
      </section>

      <section className="space-y-4 border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sections.customer_info")}
        </h2>
        <div className="space-y-4">
          <DetailField
            icon={User}
            label={t("table.columns.customer")}
            value={order.customer}
            href={customerHref}
          />
          <DetailField
            icon={Mail}
            label={t("detail.customer_email")}
            value={order.customerEmail}
          />
          <DetailField
            icon={Phone}
            label={t("detail.customer_phone")}
            value={order.customerPhone}
          />
          <DetailField
            icon={User}
            label={t("detail.customer_gender")}
            value={order.customerGender}
          />
          <DetailField
            icon={MapPin}
            label={t("detail.shipping_address")}
            value={order.shippingAddress}
          />
        </div>
      </section>
    </div>
  )
}
