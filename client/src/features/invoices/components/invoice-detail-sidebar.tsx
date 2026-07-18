import { Store } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import type { Locale } from "@/app/i18n"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { Button } from "@/components/ui/button"
import type { InvoiceDetail } from "@/features/invoices/types/invoice"
import {
  getInvoiceErrorMessage,
  useVoidInvoiceMutation,
} from "@/shared/queries/invoice.query"
import { formatDateTime } from "@/util/format"

interface InvoiceDetailSidebarProps {
  invoice: InvoiceDetail
  locale: Locale
}

export function InvoiceDetailSidebar({ invoice, locale }: InvoiceDetailSidebarProps) {
  const { t } = useTranslation("invoices")
  const [isVoidOpen, setIsVoidOpen] = useState(false)
  const voidMutation = useVoidInvoiceMutation()
  const numericId = Number.parseInt(invoice.id, 10)

  const voidError =
    voidMutation.isError && voidMutation.error
      ? getInvoiceErrorMessage(voidMutation.error, t("errors.void_failed"))
      : null

  return (
    <aside className="space-y-4" aria-label={t("detail.sidebar.label")}>
      <AuthFormError message={voidError} />

      <section className="border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sidebar.summary")}
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground uppercase">
              {t("detail.document.invoice_number")}
            </dt>
            <dd className="font-medium">{invoice.invoiceNo}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase">
              {t("detail.document.issued_at")}
            </dt>
            <dd>
              {invoice.issuedAt
                ? formatDateTime(invoice.issuedAt, locale)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase">
              {t("table.columns.status")}
            </dt>
            <dd className="font-medium uppercase">
              {t(`status.${invoice.status}`)}
            </dd>
          </div>
        </dl>
        {invoice.status === "ISSUED" ? (
          <Button
            variant="outline"
            className="mt-4 w-full"
            type="button"
            onClick={() => setIsVoidOpen(true)}
          >
            {t("detail.actions.void")}
          </Button>
        ) : null}
      </section>

      <section className="border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sidebar.marketplace")}
        </h2>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center bg-foreground text-background">
            <Store className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium">{invoice.storeName}</p>
            <p className="text-xs text-muted-foreground">{invoice.marketplaceCode}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("detail.sidebar.order_ref", {
            orderId: invoice.externalOrderId,
          })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("detail.sidebar.skus", { count: invoice.lineItems.length })}
        </p>
        {invoice.orderId ? (
          <Button variant="link" className="mt-3 h-auto p-0 text-info" asChild>
            <Link to={ROUTES.dashboard.orderDetail(invoice.orderId)}>
              {t("table.actions.view_order")}
            </Link>
          </Button>
        ) : null}
      </section>

      <ConfirmDialog
        open={isVoidOpen}
        onOpenChange={setIsVoidOpen}
        title={t("confirm.void.title")}
        description={t("confirm.void.description", {
          invoiceNo: invoice.invoiceNo,
        })}
        confirmLabel={t("detail.actions.void")}
        isLoading={voidMutation.isPending}
        onConfirm={async () => {
          if (!Number.isFinite(numericId)) {
            setIsVoidOpen(false)
            return
          }
          await voidMutation.mutateAsync(numericId)
          setIsVoidOpen(false)
        }}
      />
    </aside>
  )
}
