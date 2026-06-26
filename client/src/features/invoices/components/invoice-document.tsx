import { Download, Printer, Store } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Locale } from "@/app/i18n"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { InvoiceDetail, InvoiceStatus } from "@/features/invoices/types/invoice"
import { formatCurrency, formatDateTime } from "@/util/format"

const STATUS_BADGE: Record<InvoiceStatus, StatusBadgeVariant> = {
  paid: "paid",
  pending: "pending",
  overdue: "overdue",
  draft: "draft",
}

interface InvoiceDocumentProps {
  invoice: InvoiceDetail
  locale: Locale
}

export function InvoiceDocument({ invoice, locale }: InvoiceDocumentProps) {
  const { t } = useTranslation("invoices")

  return (
    <article className="border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <StatusBadge
          status={STATUS_BADGE[invoice.status]}
          label={t(`status.${invoice.status}`).toUpperCase()}
          showDot
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer data-icon="inline-start" />
            {t("detail.actions.print")}
          </Button>
          {invoice.pdfUrl ? (
            <Button size="sm">
              <Download data-icon="inline-start" />
              {t("detail.actions.download")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-8 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center bg-primary text-primary-foreground">
              <span className="font-heading text-xl font-bold">L</span>
            </div>
            <div className="space-y-1">
              <p className="font-heading text-base font-semibold">{invoice.issuer.name}</p>
              <p className="text-xs text-muted-foreground">
                {t("detail.document.vat", { number: invoice.issuer.vatNumber })}
              </p>
              <p className="text-xs text-muted-foreground">{invoice.issuer.address}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm md:text-right">
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
              <p>{formatDateTime(invoice.createdAt, locale)}</p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {t("detail.document.due_date")}
              </p>
              <p>{formatDateTime(invoice.dueAt, locale)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-none border border-border bg-accent/40 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("detail.document.bill_to")}
            </p>
            <p className="mt-1 font-heading text-sm font-semibold">{invoice.billTo.name}</p>
            <p className="text-sm text-muted-foreground">
              {t("detail.document.attn", { name: invoice.billTo.attention })}
            </p>
            <p className="text-sm text-muted-foreground">{invoice.billTo.address}</p>
          </div>
          <div className="text-sm md:text-right">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("detail.document.marketplace_source")}
            </p>
            <div className="mt-1 flex items-center gap-2 md:justify-end">
              <span className="flex size-6 items-center justify-center bg-foreground text-background">
                <Store className="size-3.5" aria-hidden />
              </span>
              <span className="font-medium">{invoice.marketplaceName}</span>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("detail.document.columns.description")}
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
            {invoice.lineItems.map((item) => {
              const lineTotal = item.quantity * item.unitPrice

              return (
                <TableRow key={item.id} className="border-b border-border/80">
                  <TableCell className="px-4 py-4 align-top">
                    <p className="text-sm font-medium">{item.description}</p>
                    {item.subDescription ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.subDescription}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right text-sm">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right text-sm">
                    {formatCurrency(item.unitPrice, locale, invoice.currency)}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right text-sm font-medium">
                    {formatCurrency(lineTotal, locale, invoice.currency)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3 text-xs text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">{t("detail.document.bank_details")}</p>
              <p className="mt-1">
                {t("detail.document.iban", { value: invoice.bankDetails.iban })}
              </p>
              <p>{t("detail.document.swift", { value: invoice.bankDetails.swift })}</p>
            </div>
            <p>{t("detail.document.footer_note", { days: invoice.paymentTermsDays })}</p>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("detail.document.subtotal")}</dt>
              <dd>{formatCurrency(invoice.subtotal, locale, invoice.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {t("detail.document.vat_line", { percent: invoice.vatPercentage })}
              </dt>
              <dd>{formatCurrency(invoice.vatAmount, locale, invoice.currency)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2">
              <dt className="font-heading font-semibold">{t("detail.document.grand_total")}</dt>
              <dd className="font-heading text-lg font-semibold text-primary">
                {formatCurrency(invoice.grandTotal, locale, invoice.currency)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  )
}
