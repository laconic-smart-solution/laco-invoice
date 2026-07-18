import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { Button } from "@/components/ui/button"
import { InvoiceDetailSidebar } from "@/features/invoices/components/invoice-detail-sidebar"
import { InvoiceDocument } from "@/features/invoices/components/invoice-document"
import {
  getInvoiceErrorMessage,
  useInvoiceDetailQuery,
} from "@/shared/queries/invoice.query"
import { useLocaleStore } from "@/shared/stores/locale-store"

export function InvoiceDetailPage() {
  const { t } = useTranslation("invoices")
  const { invoiceId = "" } = useParams()
  const locale = useLocaleStore((state) => state.locale)
  const numericId = Number.parseInt(invoiceId, 10)

  const {
    data: invoice,
    isLoading,
    isError,
    error,
  } = useInvoiceDetailQuery(Number.isFinite(numericId) ? numericId : null)

  const loadError =
    isError && error
      ? getInvoiceErrorMessage(error, t("errors.load_failed"))
      : null

  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground"
        aria-busy="true"
      >
        {t("detail.loading")}
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <AuthFormError message={loadError} />
        <h1 className="font-heading text-xl font-semibold">
          {t("detail.not_found_title")}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("detail.not_found_description")}
        </p>
        <Button asChild>
          <Link to={ROUTES.dashboard.invoices}>{t("detail.back_to_invoices")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <AuthFormError message={loadError} />
      <InvoiceDocument invoice={invoice} locale={locale} />
      <InvoiceDetailSidebar invoice={invoice} locale={locale} />
    </div>
  )
}
