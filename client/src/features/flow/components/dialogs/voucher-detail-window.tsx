import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
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

interface VoucherDetailWindowProps {
  voucherId: number
}

export function VoucherDetailWindow({ voucherId }: VoucherDetailWindowProps) {
  const { t } = useTranslation("vouchers")
  const locale = useLocaleStore((state) => state.locale)
  const openGenerateVoucher = useFlowWindowsStore((state) => state.openGenerateVoucher)
  const openExport = useFlowWindowsStore((state) => state.openExport)
  const openOrderSet = useFlowWindowsStore((state) => state.openOrderSet)
  const detailQuery = useVoucherDetailQuery(voucherId)
  const itemsQuery = useErpItemsQuery()
  const accountsQuery = useErpAccountsQuery()
  const vendorsQuery = useErpVendorsQuery()
  const departmentsQuery = useErpDepartmentsQuery()
  const currenciesQuery = useErpCurrenciesQuery()
  const postMutation = usePostVoucherToErpMutation()
  const exportExcelMutation = useExportSingleVoucherExcelMutation()
  const exportCsvMutation = useExportSingleVoucherCsvMutation()
  const exportPdfMutation = useExportSingleVoucherPdfMutation()
  const [postOpen, setPostOpen] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const isExporting =
    exportExcelMutation.isPending ||
    exportCsvMutation.isPending ||
    exportPdfMutation.isPending
  const voucher = detailQuery.data

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>
  }

  if (!voucher) {
    return (
      <p className="text-sm text-muted-foreground">{t("detail.not_found")}</p>
    )
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            {voucher.voucherNumber}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
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
                className="rounded-lg"
              >
                {isExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {isExporting ? t("export.exporting") : t("export.button")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[700] rounded-xl">
              <DropdownMenuItem
                onSelect={() =>
                  openExport(
                    voucher.id,
                    t("export.button") + " · " + voucher.voucherNumber
                  )
                }
              >
                <FileSpreadsheet className="size-4" />
                {t("export.single_excel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  void exportCsvMutation.mutateAsync({
                    id: voucher.id,
                    voucherNumber: voucher.voucherNumber,
                  })
                }
              >
                <FileText className="size-4" />
                {t("export.single_csv")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  void exportPdfMutation.mutateAsync({
                    id: voucher.id,
                    voucherNumber: voucher.voucherNumber,
                  })
                }
              >
                <FileText className="size-4" />
                {t("export.single_pdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canEditVoucher(voucher.status) ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() =>
                openGenerateVoucher(
                  voucher.orderInputRunId ?? 0,
                  t("edit"),
                  voucher.id
                )
              }
              disabled={!voucher.orderInputRunId}
            >
              {t("table.edit")}
            </Button>
          ) : null}
          {canPostVoucherToErp(voucher.status) ? (
            <Button
              type="button"
              className="rounded-lg"
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
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t("form.category"), t(`category.${voucher.voucherCategory}`)],
          [t("form.date"), voucher.voucherDate],
          [t("form.tax_month"), toMonthValue(voucher.taxMonth) || "—"],
          [t("form.wht_month"), toMonthValue(voucher.whtMonth) || "—"],
          [
            t("form.no_tax_invoice"),
            voucher.noTaxInvoice ? t("form.yes") : t("form.no"),
          ],
          [t("table.store"), voucher.storeName ?? "—"],
          [t("table.erp_no"), voucher.erpVoucherNo ?? "—"],
          [
            t("form.item"),
            erpLookupLabel(itemsQuery.data, voucher.externalErpItemId),
          ],
          [
            t("form.account"),
            erpLookupLabel(
              accountsQuery.data,
              voucher.externalErpAccountCodeId
            ),
          ],
          [
            t("form.vendor"),
            erpLookupLabel(vendorsQuery.data, voucher.externalErpVendorId),
          ],
          [t("table.invoice"), voucher.invoiceNumber ?? "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-xs font-medium">{value}</dd>
          </div>
        ))}
        {voucher.orderInputRunId ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("form.order_input")}
            </dt>
            <dd className="mt-1 text-xs">
              <button
                type="button"
                className="font-medium text-primary underline-offset-2 hover:underline"
                onClick={() =>
                  openOrderSet(
                    voucher.orderInputRunId as number,
                    voucher.orderInputRunTitle ?? `#${voucher.orderInputRunId}`
                  )
                }
              >
                {voucher.orderInputRunTitle ?? `#${voucher.orderInputRunId}`}
              </button>
            </dd>
          </div>
        ) : null}
      </dl>

      {voucher.voucherDescription ? (
        <p className="text-sm text-muted-foreground">
          {voucher.voucherDescription}
        </p>
      ) : null}

      {voucher.rejectRemark ? (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("form.reject_remark")}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm">
            {voucher.rejectRemark}
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[62rem] text-left text-xs">
          <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">{t("form.account")}</th>
              <th className="px-3 py-2 text-right">{t("table.debit")}</th>
              <th className="px-3 py-2 text-right">{t("table.credit")}</th>
              <th className="px-3 py-2">{t("form.invoice_no")}</th>
              <th className="px-3 py-2">{t("form.invoice_date")}</th>
              <th className="px-3 py-2">{t("form.department")}</th>
              <th className="px-3 py-2 text-right">{t("form.exchange_rate")}</th>
              <th className="px-3 py-2">{t("form.currency")}</th>
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
                  <td className="px-3 py-2 font-sans">
                    {erpLookupLabel(
                      accountsQuery.data,
                      entry.externalErpAccountCodeId
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(entry.debit, locale, currencyCode)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(entry.credit, locale, currencyCode)}
                  </td>
                  <td className="px-3 py-2 font-sans">
                    {entry.invoiceNo ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-sans">
                    {entry.invoiceDate ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-sans">
                    {erpLookupLabel(
                      departmentsQuery.data,
                      entry.externalErpDepartmentId
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{entry.exchangeRate}</td>
                  <td className="px-3 py-2 font-sans">{currencyCode}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t border-border bg-muted/40 font-semibold">
            <tr>
              <td className="px-3 py-2 font-sans">{t("detail.totals")}</td>
              <td className="px-3 py-2 text-right font-mono">
                {formatCurrency(voucher.debitTotal, locale, voucher.currency)}
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {formatCurrency(voucher.creditTotal, locale, voucher.currency)}
              </td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        </table>
      </div>

      <ConfirmDialog
        open={postOpen}
        onOpenChange={(nextOpen) => {
          setPostOpen(nextOpen)
          if (!nextOpen) setPostError(null)
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
