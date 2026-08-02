import { Download, Printer, Store } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Locale } from "@/app/i18n"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { InvoiceDetail, InvoiceStatus } from "@/features/invoices/types/invoice"
import {
  useDownloadInvoicePdfMutation,
  usePrintInvoicePdfMutation,
} from "@/shared/queries/invoice.query"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDateTime } from "@/util/format"

const STATUS_BADGE: Record<InvoiceStatus, StatusBadgeVariant> = {
  ISSUED: "paid",
  VOID: "draft",
}

interface InvoiceDocumentProps {
  invoice: InvoiceDetail
  locale: Locale
  /** Narrow panel layout: wraps long text, no horizontal scroll. */
  variant?: "page" | "sheet"
}

export function InvoiceDocument({
  invoice,
  locale,
  variant = "page",
}: InvoiceDocumentProps) {
  const { t } = useTranslation("invoices")
  const downloadMutation = useDownloadInvoicePdfMutation()
  const printMutation = usePrintInvoicePdfMutation()
  const numericId = Number.parseInt(invoice.id, 10)
  const isPdfActionPending =
    downloadMutation.isPending || printMutation.isPending
  const isSheet = variant === "sheet"

  const handlePrint = () => {
    if (!Number.isFinite(numericId)) {
      return
    }
    printMutation.mutate(numericId)
  }

  const handleDownload = () => {
    if (!Number.isFinite(numericId)) {
      return
    }
    downloadMutation.mutate({
      id: numericId,
      filename: `${invoice.invoiceNo}.pdf`,
    })
  }

  return (
    <article
      className={cn(
        "min-w-0 border border-border bg-card shadow-sm",
        isSheet && "border-0 shadow-none"
      )}
      aria-labelledby="invoice-document-title"
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b border-border",
          isSheet ? "px-0 py-3" : "px-6 py-4"
        )}
      >
        <StatusBadge
          status={STATUS_BADGE[invoice.status]}
          label={t(`status.${invoice.status}`).toUpperCase()}
          showDot
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handlePrint}
            disabled={isPdfActionPending}
            aria-busy={printMutation.isPending}
          >
            <Printer data-icon="inline-start" />
            {t("detail.actions.print")}
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={handleDownload}
            disabled={isPdfActionPending}
            aria-busy={downloadMutation.isPending}
          >
            <Download data-icon="inline-start" />
            {t("detail.actions.download")}
          </Button>
        </div>
      </div>

      <div className={cn("space-y-6", isSheet ? "p-0 pt-4" : "space-y-8 p-6 md:p-8")}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1
              id="invoice-document-title"
              className="font-heading text-lg font-semibold tracking-tight sm:text-xl"
            >
              {t("detail.document.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("detail.document.title_th")}
            </p>
            <p className="mt-3 break-words font-heading text-base font-semibold">
              {invoice.storeName}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("detail.document.vat_rate", { percent: invoice.vatPercentage })}
            </p>
          </div>

          <div className="shrink-0 space-y-2 text-sm sm:text-right">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {t("detail.document.invoice_number")}
              </p>
              <p className="font-heading font-semibold">{invoice.invoiceNo}</p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {t("detail.document.issued_at")}
              </p>
              <p>
                {invoice.issuedAt
                  ? formatDateTime(invoice.issuedAt, locale)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {t("detail.document.order_ref")}
              </p>
              <p className="break-all">{invoice.externalOrderId}</p>
            </div>
          </div>
        </header>

        <section
          className="grid gap-4 border border-border bg-muted/30 p-4 sm:grid-cols-2"
          aria-label={t("detail.document.parties")}
        >
          <div className="min-w-0">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("detail.document.bill_to")}
            </h2>
            <p className="mt-1 break-words font-heading text-sm font-semibold">
              {invoice.customerName}
            </p>
            <p className="break-words text-sm text-muted-foreground">
              {invoice.customerPhone}
            </p>
            <p className="break-words text-sm text-muted-foreground">
              {invoice.customerEmail}
            </p>
            <p className="break-words text-sm text-muted-foreground">
              {invoice.customerAddress}
            </p>
          </div>
          <div className="min-w-0 sm:text-right">
            <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("detail.document.marketplace_source")}
            </h2>
            <div className="mt-1 flex items-center gap-2 sm:justify-end">
              <span className="flex size-6 shrink-0 items-center justify-center bg-foreground text-background">
                <Store className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0 break-words font-medium">
                {invoice.storeName} — {invoice.marketplaceCode}
              </span>
            </div>
          </div>
        </section>

        {isSheet ? (
          <SheetLineItems invoice={invoice} locale={locale} />
        ) : (
          <PageLineItemsTable invoice={invoice} locale={locale} />
        )}

        <dl className="ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("detail.document.subtotal")}
            </dt>
            <dd>
              {formatCurrency(invoice.subtotal, locale, invoice.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("detail.document.shipping")}
            </dt>
            <dd>
              {formatCurrency(invoice.shippingFee, locale, invoice.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("detail.document.vat_line", {
                percent: invoice.vatPercentage,
              })}
            </dt>
            <dd>
              {formatCurrency(invoice.vatAmount, locale, invoice.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="font-heading font-semibold">
              {t("detail.document.grand_total")}
            </dt>
            <dd className="font-heading text-lg font-semibold text-primary">
              {formatCurrency(invoice.grandTotal, locale, invoice.currency)}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          {t("detail.document.footer_vat_note", {
            percent: invoice.vatPercentage,
          })}
        </p>
      </div>
    </article>
  )
}

function PageLineItemsTable({
  invoice,
  locale,
}: {
  invoice: InvoiceDetail
  locale: Locale
}) {
  const { t } = useTranslation("invoices")

  return (
    <Table>
      <TableCaption className="sr-only">
        {t("detail.document.line_items_caption")}
      </TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-10 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("detail.document.columns.description")}
          </TableHead>
          <TableHead className="h-10 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("detail.document.columns.sku")}
          </TableHead>
          <TableHead className="h-10 bg-muted/40 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("detail.document.columns.qty")}
          </TableHead>
          <TableHead className="h-10 bg-muted/40 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("detail.document.columns.unit_price")}
          </TableHead>
          <TableHead className="h-10 bg-muted/40 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("detail.document.columns.total")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoice.lineItems.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="px-4 py-6 text-sm text-muted-foreground"
            >
              {t("detail.document.no_line_items")}
            </TableCell>
          </TableRow>
        ) : (
          invoice.lineItems.map((item) => (
            <TableRow key={item.id} className="border-b border-border/80">
              <TableCell className="max-w-md px-4 py-4 align-top text-sm font-medium whitespace-normal break-words">
                {item.productName}
              </TableCell>
              <TableCell className="px-4 py-4 text-sm text-muted-foreground whitespace-normal break-all">
                {item.sku}
              </TableCell>
              <TableCell className="px-4 py-4 text-right text-sm">
                {item.quantity}
              </TableCell>
              <TableCell className="px-4 py-4 text-right text-sm">
                {formatCurrency(item.unitPrice, locale, invoice.currency)}
              </TableCell>
              <TableCell className="px-4 py-4 text-right text-sm font-medium">
                {formatCurrency(item.lineTotal, locale, invoice.currency)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

function SheetLineItems({
  invoice,
  locale,
}: {
  invoice: InvoiceDetail
  locale: Locale
}) {
  const { t } = useTranslation("invoices")

  if (invoice.lineItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("detail.document.no_line_items")}
      </p>
    )
  }

  return (
    <section
      className="min-w-0 space-y-2"
      aria-label={t("detail.document.line_items_caption")}
    >
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {t("detail.document.columns.description")}
      </h2>
      <ul className="divide-y divide-border border border-border">
        {invoice.lineItems.map((item) => (
          <li key={item.id} className="min-w-0 space-y-2 p-3">
            <p className="text-sm font-medium break-words whitespace-normal">
              {item.productName}
            </p>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="min-w-0 break-all">
                {t("detail.document.columns.sku")}: {item.sku || "—"}
              </span>
              <span className="shrink-0">
                {t("detail.document.columns.qty")} {item.quantity} ·{" "}
                {formatCurrency(item.unitPrice, locale, invoice.currency)}
              </span>
            </div>
            <p className="text-right text-sm font-semibold">
              {formatCurrency(item.lineTotal, locale, invoice.currency)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
