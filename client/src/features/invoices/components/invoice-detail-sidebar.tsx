import { Check, Clock, ExternalLink, Plus, Store } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import type { Locale } from "@/app/i18n"
import { Button } from "@/components/ui/button"
import type { InvoiceDetail } from "@/features/invoices/types/invoice"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/util/format"

interface InvoiceDetailSidebarProps {
  invoice: InvoiceDetail
  locale: Locale
}

export function InvoiceDetailSidebar({ invoice, locale }: InvoiceDetailSidebarProps) {
  const { t } = useTranslation("invoices")

  return (
    <aside className="space-y-4">
      <section className="border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sidebar.timeline")}
        </h2>
        <ol className="mt-4 space-y-4">
          {invoice.timeline.map((event, index) => {
            const isCompleted = event.status === "completed"
            const isLast = index === invoice.timeline.length - 1

            return (
              <li key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      isCompleted
                        ? "border-success bg-success/10 text-success"
                        : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : (
                      <Clock className="size-3.5" aria-hidden />
                    )}
                  </span>
                  {!isLast ? (
                    <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                  ) : null}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="text-sm font-medium">
                    {t(`detail.timeline.${event.type}.title`)}
                  </p>
                  {event.timestamp ? (
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(event.timestamp, locale)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t(`detail.timeline.${event.type}.pending`)}
                    </p>
                  )}
                  {event.meta ? (
                    <p className="text-xs text-muted-foreground">{event.meta}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      {invoice.erpVoucher ? (
        <section className="border border-border bg-accent/30 p-5 shadow-sm">
          <h2 className="font-heading text-sm font-semibold">
            {t("detail.sidebar.external_systems")}
          </h2>
          <div className="mt-3 space-y-1">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {t("detail.sidebar.erp_voucher")}
            </p>
            <p className="text-sm font-medium">{invoice.erpVoucher.id}</p>
            <Button variant="link" className="h-auto p-0 text-info">
              <ExternalLink data-icon="inline-start" />
              {t("detail.sidebar.view_in_erp")}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="relative border border-border bg-card p-5 shadow-sm">
        <span
          className={cn(
            "absolute top-4 right-4 size-2 rounded-full",
            invoice.status === "overdue" ? "bg-destructive" : "bg-success"
          )}
          aria-hidden
        />
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sidebar.marketplace")}
        </h2>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center bg-foreground text-background">
            <Store className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium">{invoice.marketplaceName}</p>
            <p className="text-xs text-muted-foreground">
              {t("detail.sidebar.order_ref", {
                orderId: invoice.marketplaceMeta.orderRef,
              })}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="border border-border bg-muted/50 px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
            {t("detail.sidebar.skus", { count: invoice.marketplaceMeta.skuCount })}
          </span>
          <span className="border border-border bg-muted/50 px-2 py-1 text-[10px] font-semibold tracking-wide uppercase">
            {t("detail.sidebar.country", {
              code: invoice.marketplaceMeta.countryCode,
            })}
          </span>
        </div>
        <Button variant="link" className="mt-3 h-auto p-0 text-info" asChild>
          <Link to={ROUTES.dashboard.orderDetail(invoice.orderId)}>
            {t("table.actions.view_order")}
          </Link>
        </Button>
      </section>

      <Button variant="outline" className="w-full border-dashed">
        <Plus data-icon="inline-start" />
        {t("detail.sidebar.add_note")}
      </Button>
    </aside>
  )
}
