import { Download, FileText, Loader2, UploadCloud } from "lucide-react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

import { StatusBadge, type StatusBadgeVariant } from "@/components/common/status-badge"
import { getOrderInputInvoiceErrorMessage } from "@/features/orders/components/order-input-run-status-badges"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/util/format"
import type { Locale } from "@/app/i18n"
import type {
  ApiInvoicePdfMatchStatus,
  ApiOrderInputFileStatus,
  ApiOrderInputRunDto,
} from "@/shared/services/order-input-run.service"

interface InvoicePdfCardProps {
  run: ApiOrderInputRunDto
  disabled: boolean
  uploading: boolean
  downloading: boolean
  onUpload: (file: File) => void
  onDownload: () => void
}

interface InvoicePdfMatchSummaryProps {
  run: ApiOrderInputRunDto
  locale: Locale
}

const FILE_STATUS_BADGE: Record<ApiOrderInputFileStatus, StatusBadgeVariant> = {
  MISSING: "draft",
  READY: "pending",
  RUNNING: "pending",
  SUCCEEDED: "synced",
  PARTIAL: "warning",
  FAILED: "failed",
}

const MATCH_BADGE: Record<ApiInvoicePdfMatchStatus, StatusBadgeVariant> = {
  MISSING: "draft",
  MATCHED: "paid",
  MISMATCH: "failed",
  UNPARSED: "warning",
}

function formatDate(value: string | null): string {
  return value ?? "—"
}

function formatAmount(value: number | null, locale: Locale): string {
  if (value == null) {
    return "—"
  }
  return formatCurrency(value, locale, "THB")
}

export function InvoicePdfCard({
  run,
  disabled,
  uploading,
  downloading,
  onUpload,
  onDownload,
}: InvoicePdfCardProps) {
  const { t } = useTranslation("orders")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pdfStatus = run.invoicePdfStatus ?? "MISSING"
  const matchStatus = run.invoiceMatchStatus ?? "MISSING"
  const hasFile = Boolean(run.invoicePdfFilename)

  return (
    <div className="flex h-full flex-col gap-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-semibold">
            {t("inputs.detail.invoice_pdf_title")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("inputs.detail.invoice_pdf_description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <StatusBadge
            status={FILE_STATUS_BADGE[pdfStatus]}
            label={t(`inputs.file_status.${pdfStatus.toLowerCase()}`)}
          />
          <StatusBadge
            status={MATCH_BADGE[matchStatus]}
            label={t(`inputs.invoice_match.${matchStatus.toLowerCase()}`)}
            tooltip={getOrderInputInvoiceErrorMessage(run, t)}
          />
        </div>
      </div>

      <p className="truncate text-sm">
        {run.invoicePdfFilename ? (
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-4 text-muted-foreground" />
            {run.invoicePdfFilename}
          </span>
        ) : (
          <span className="text-muted-foreground">{t("inputs.detail.no_file")}</span>
        )}
      </p>

      {run.invoicePdfError ? (
        <p className="text-xs text-destructive break-words">{run.invoicePdfError}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onUpload(file)
          }
          event.target.value = ""
        }}
        disabled={disabled || uploading}
      />

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-none gap-1.5"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <UploadCloud className="size-3.5" />
          )}
          {uploading ? t("inputs.detail.uploading") : t("inputs.detail.upload")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-none gap-1.5"
          onClick={onDownload}
          disabled={!hasFile || downloading}
        >
          {downloading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {downloading
            ? t("inputs.detail.downloading_file")
            : t("inputs.detail.download_file")}
        </Button>
      </div>
    </div>
  )
}

export function InvoicePdfMatchSummary({ run, locale }: InvoicePdfMatchSummaryProps) {
  const { t } = useTranslation("orders")
  const matchStatus = run.invoiceMatchStatus ?? "MISSING"
  if (!run.invoicePdfFilename) {
    return null
  }

  return (
    <dl className="grid gap-3 rounded-md border border-border bg-card p-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt className="text-muted-foreground">
          {t("inputs.detail.invoice_receipt_number")}
        </dt>
        <dd className="font-mono font-medium">{run.invoiceReceiptNumber ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">
          {t("inputs.detail.invoice_receipt_date")}
        </dt>
        <dd className="font-medium">{formatDate(run.invoiceReceiptDate)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">{t("inputs.detail.invoice_period")}</dt>
        <dd className="font-medium">
          {run.invoicePeriodStart || run.invoicePeriodEnd
            ? `${formatDate(run.invoicePeriodStart)} → ${formatDate(run.invoicePeriodEnd)}`
            : "—"}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">{t("inputs.detail.invoice_buyer")}</dt>
        <dd className="font-medium">
          {run.invoiceBuyerName ?? "—"}
          {run.invoiceBuyerTaxId ? (
            <span className="block font-mono text-[11px] text-muted-foreground">
              {run.invoiceBuyerTaxId}
            </span>
          ) : null}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">{t("inputs.detail.invoice_pdf_amount")}</dt>
        <dd className="font-semibold">{formatAmount(run.invoiceTotalAmount, locale)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">
          {t("inputs.detail.excel_matched_amount")}
        </dt>
        <dd className="font-semibold">{formatAmount(run.excelMatchedAmount, locale)}</dd>
      </div>
      {matchStatus === "MISMATCH" ? (
        <div>
          <dt className="text-muted-foreground">
            {t("inputs.detail.invoice_match_difference")}
          </dt>
          <dd className="font-semibold text-destructive">
            {formatAmount(run.invoiceMatchDifference, locale)}
          </dd>
        </div>
      ) : null}
    </dl>
  )
}
