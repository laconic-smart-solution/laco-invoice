import { useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GenerateVoucherDialog } from "@/features/vouchers/components/generate-voucher-dialog"
import {
  voucherStatusTooltip,
  VoucherStatusBadge,
} from "@/features/vouchers/components/voucher-status-badge"
import {
  erpLookupCode,
  erpLookupLabel,
  useErpAccountsQuery,
  useErpCurrenciesQuery,
  useErpDepartmentsQuery,
  useErpItemsQuery,
  useErpVendorsQuery,
} from "@/features/vouchers/queries/erp-lookup.query"
import {
  useExportSingleVoucherCsvMutation,
  useExportSingleVoucherExcelMutation,
  useExportSingleVoucherPdfMutation,
  usePostVoucherToErpMutation,
  useVoucherDetailQuery,
} from "@/features/vouchers/queries/voucher.query"
import { toMonthValue } from "@/features/vouchers/schemas/generate-voucher-schema"
import {
  canEditVoucher,
  canPostVoucherToErp,
} from "@/features/vouchers/types/voucher"
import { extractApiErrorMessage } from "@/shared/api/extract-api-error-message"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency } from "@/util/format"

export function VoucherDetailPage() {
  const { t } = useTranslation("vouchers")
  const { id } = useParams()
  const locale = useLocaleStore((state) => state.locale)
  const voucherId = Number(id)
  const detailQuery = useVoucherDetailQuery(
    Number.isFinite(voucherId) && voucherId > 0 ? voucherId : null
  )
  const itemsQuery = useErpItemsQuery()
  const accountsQuery = useErpAccountsQuery()
  const vendorsQuery = useErpVendorsQuery()
  const departmentsQuery = useErpDepartmentsQuery()
  const currenciesQuery = useErpCurrenciesQuery()
  const postMutation = usePostVoucherToErpMutation()
  const exportExcelMutation = useExportSingleVoucherExcelMutation()
  const exportCsvMutation = useExportSingleVoucherCsvMutation()
  const exportPdfMutation = useExportSingleVoucherPdfMutation()

  const [editOpen, setEditOpen] = useState(false)
  const [postOpen, setPostOpen] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const isExporting =
    exportExcelMutation.isPending ||
    exportCsvMutation.isPending ||
    exportPdfMutation.isPending
  const voucher = detailQuery.data

  const handleExportExcel = async () => {
    if (!voucher) return
    try {
      await exportExcelMutation.mutateAsync({
        id: voucher.id,
        voucherNumber: voucher.voucherNumber,
      })
    } catch (error) {
      console.error("Export voucher Excel error", error)
    }
  }

  const handleExportCsv = async () => {
    if (!voucher) return
    try {
      await exportCsvMutation.mutateAsync({
        id: voucher.id,
        voucherNumber: voucher.voucherNumber,
      })
    } catch (error) {
      console.error("Export voucher CSV error", error)
    }
  }

  const handleExportPdf = async () => {
    if (!voucher) return
    try {
      await exportPdfMutation.mutateAsync({
        id: voucher.id,
        voucherNumber: voucher.voucherNumber,
      })
    } catch (error) {
      console.error("Export voucher PDF error", error)
    }
  }

  if (detailQuery.isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">{t("loading")}</div>
    )
  }

  if (!voucher) {
    return (
      <div className="p-6 text-sm text-muted-foreground">{t("detail.not_found")}</div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {voucher.voucherNumber}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {voucher.voucherBrief ?? t("subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isExporting}
                className="gap-1.5 rounded-none text-xs font-semibold shadow-xs"
              >
                {isExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {isExporting ? t("export.exporting") : t("export.button")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
              <DropdownMenuItem
                onClick={handleExportExcel}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileSpreadsheet className="size-4 text-emerald-600" />
                {t("export.single_excel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportCsv}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileText className="size-4 text-sky-600" />
                {t("export.single_csv")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPdf}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileText className="size-4 text-rose-600" />
                {t("export.single_pdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canEditVoucher(voucher.status) ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={() => setEditOpen(true)}
            >
              {t("table.edit")}
            </Button>
          ) : null}
          {canPostVoucherToErp(voucher.status) ? (
            <Button
              type="button"
              className="rounded-none bg-primary text-primary-foreground"
              onClick={() => {
                setPostError(null)
                setPostOpen(true)
              }}
            >
              {t("table.post_to_erp")}
            </Button>
          ) : null}
          <VoucherStatusBadge
            status={voucher.status}
            label={t(`status.${voucher.status.toLowerCase()}`)}
            description={voucherStatusTooltip(
              voucher,
              t(`status_description.${voucher.status.toLowerCase()}`)
            )}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailField label={t("form.category")} value={t(`category.${voucher.voucherCategory}`)} />
        <DetailField label={t("form.date")} value={voucher.voucherDate} />
        <DetailField
          label={t("form.tax_month")}
          value={toMonthValue(voucher.taxMonth) || "—"}
        />
        <DetailField
          label={t("form.wht_month")}
          value={toMonthValue(voucher.whtMonth) || "—"}
        />
        <DetailField
          label={t("form.no_tax_invoice")}
          value={voucher.noTaxInvoice ? t("form.yes") : t("form.no")}
        />
        <DetailField label={t("table.store")} value={voucher.storeName ?? "—"} />
        <DetailField label={t("table.erp_no")} value={voucher.erpVoucherNo ?? "—"} />
        <DetailField
          label={t("form.item")}
          value={erpLookupLabel(itemsQuery.data, voucher.externalErpItemId)}
        />
        <DetailField
          label={t("form.account")}
          value={erpLookupLabel(accountsQuery.data, voucher.externalErpAccountCodeId)}
        />
        <DetailField
          label={t("form.vendor")}
          value={erpLookupLabel(vendorsQuery.data, voucher.externalErpVendorId)}
        />
        <DetailField label={t("table.invoice")} value={voucher.invoiceNumber ?? "—"} />
      </div>

      {voucher.voucherDescription ? (
        <p className="text-sm text-muted-foreground">{voucher.voucherDescription}</p>
      ) : null}

      {voucher.rejectRemark ? (
        <div className="border border-border bg-card p-4">
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t("form.reject_remark")}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground whitespace-pre-wrap">
            {voucher.rejectRemark}
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-none border border-border bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted font-medium text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("form.account")}</th>
              <th className="px-4 py-3 text-right">{t("table.debit")}</th>
              <th className="px-4 py-3 text-right">{t("table.credit")}</th>
              <th className="px-4 py-3">{t("form.invoice_no")}</th>
              <th className="px-4 py-3">{t("form.invoice_date")}</th>
              <th className="px-4 py-3">{t("form.department")}</th>
              <th className="px-4 py-3 text-right">{t("form.exchange_rate")}</th>
              <th className="px-4 py-3">{t("form.currency")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono">
            {voucher.entries.map((entry) => {
              const currencyCode = erpLookupCode(
                currenciesQuery.data,
                entry.externalErpCurrencyId
              )
              return (
              <tr key={entry.id}>
                <td className="px-4 py-3 font-sans">
                  {erpLookupLabel(accountsQuery.data, entry.externalErpAccountCodeId)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(entry.debit, locale, currencyCode)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(entry.credit, locale, currencyCode)}
                </td>
                <td className="px-4 py-3 font-sans">{entry.invoiceNo ?? "—"}</td>
                <td className="px-4 py-3 font-sans">{entry.invoiceDate ?? "—"}</td>
                <td className="px-4 py-3 font-sans">
                  {erpLookupLabel(departmentsQuery.data, entry.externalErpDepartmentId)}
                </td>
                <td className="px-4 py-3 text-right">{entry.exchangeRate}</td>
                <td className="px-4 py-3 font-sans">{currencyCode}</td>
              </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t border-border bg-muted/40 font-mono font-semibold">
            <tr>
              <td className="px-4 py-3 font-sans">{t("detail.totals")}</td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(voucher.debitTotal, locale, voucher.currency)}
              </td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(voucher.creditTotal, locale, voucher.currency)}
              </td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        </table>
      </div>

      <GenerateVoucherDialog
        open={editOpen}
        voucherId={voucher.id}
        onOpenChange={setEditOpen}
      />
      <ConfirmDialog
        open={postOpen}
        onOpenChange={(open) => {
          setPostOpen(open)
          if (!open) {
            setPostError(null)
          }
        }}
        title={t("post.confirm_title")}
        description={
          postError ??
          t("post.confirm_description", { number: voucher.voucherNumber })
        }
        confirmLabel={t("post.confirm")}
        isLoading={postMutation.isPending}
        onConfirm={async () => {
          try {
            await postMutation.mutateAsync(voucher.id)
          } catch (error) {
            setPostError(
              extractApiErrorMessage(error, t("errors.post_failed"))
            )
            throw error
          }
        }}
      />
    </div>
  )
}

interface DetailFieldProps {
  label: string
  value: string
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

export default VoucherDetailPage
