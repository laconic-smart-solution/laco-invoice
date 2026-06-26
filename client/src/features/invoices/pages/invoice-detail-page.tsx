import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import { InvoiceDetailSidebar } from "@/features/invoices/components/invoice-detail-sidebar"
import { InvoiceDocument } from "@/features/invoices/components/invoice-document"
import { getMockInvoiceById } from "@/features/invoices/data/mock-invoices"
import { useLocaleStore } from "@/shared/stores/locale-store"

export function InvoiceDetailPage() {
  const { t } = useTranslation("invoices")
  const { invoiceId = "" } = useParams()
  const locale = useLocaleStore((state) => state.locale)

  const invoice = useMemo(() => getMockInvoiceById(invoiceId), [invoiceId])

  if (!invoice) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
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
      <InvoiceDocument invoice={invoice} locale={locale} />
      <InvoiceDetailSidebar invoice={invoice} locale={locale} />
    </div>
  )
}
