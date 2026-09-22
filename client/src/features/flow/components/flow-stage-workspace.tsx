import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  Receipt,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type FlowStageId } from "@/features/flow/data/flow-constants"
import { FlowGenerateBlockedDialog, FlowGenerateVoucherButton, useFlowGenerateGate } from "@/features/flow/components/dialogs/flow-generate-voucher-button"
import {
  excelFilenameForRun,
  needsFlowReview,
} from "@/features/flow/util/flow-eligibility"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
import { cn } from "@/lib/utils"
import type { Voucher } from "@/features/vouchers/types/voucher"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"
import { formatCurrency } from "@/util/format"
import { useLocaleStore } from "@/shared/stores/locale-store"

interface FlowStageWorkspaceProps {
  stage: FlowStageId
  orderSet: ApiOrderInputRunDto | null
  vouchers: Voucher[]
  allVouchers: Voucher[]
  onStageChange: (stage: FlowStageId) => void
}

function matchStatus(orderSet: ApiOrderInputRunDto, t: (key: string) => string) {
  const hasError = needsFlowReview(orderSet)
  return (
    <StatusBadge
      status={
        hasError
          ? "error"
          : orderSet.invoiceMatchStatus === "MATCHED"
            ? "synced"
            : "pending"
      }
      label={
        hasError
          ? t("queue.needs_review")
          : (orderSet.invoiceMatchStatus ?? "MISSING")
      }
    />
  )
}

export function FlowStageWorkspace({
  stage,
  orderSet,
  vouchers,
  allVouchers,
  onStageChange,
}: FlowStageWorkspaceProps) {
  const { t } = useTranslation("flow")
  const { t: tOrders } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)
  const openOrderSet = useFlowWindowsStore((state) => state.openOrderSet)
  const openVoucherDetail = useFlowWindowsStore(
    (state) => state.openVoucherDetail
  )
  const openExport = useFlowWindowsStore((state) => state.openExport)
  const { canGenerate: canGenerateVoucher, whyOpen, setWhyOpen, tryGenerate } =
    useFlowGenerateGate(orderSet)

  if (!orderSet) {
    return (
      <main className="flow-stage-workspace">
        <p className="p-6 text-sm text-muted-foreground">
          {t("workspace.empty_run")}
        </p>
      </main>
    )
  }

  const excelAmount = orderSet.excelMatchedAmount ?? 0
  const invoiceAmount = orderSet.invoiceTotalAmount

  return (
    <main className="flow-stage-workspace">
      <header className="flow-stage-workspace__header">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            {t("workspace.current")}
          </p>
          <h1 className="mt-1 truncate font-heading text-xl font-semibold tracking-tight text-foreground">
            #{orderSet.id} · {orderSet.title}
          </h1>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {orderSet.storeName} · {orderSet.marketplaceCode}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {matchStatus(orderSet, t)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-lg"
                aria-label={t("workspace.more_actions", { title: orderSet.title })}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[300] w-52 rounded-xl">
              <DropdownMenuItem
                onSelect={() =>
                  openOrderSet(
                    orderSet.id,
                    t("window.order_set", {
                      id: orderSet.id,
                      title: orderSet.title,
                    })
                  )
                }
              >
                {t("workspace.open_detail")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onStageChange("match")}>
                {t("workspace.review_match")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={tryGenerate}>
                {t("workspace.generate")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={vouchers.length === 0}
                onSelect={() => {
                  const voucher = vouchers[0]
                  if (voucher) {
                    openExport(
                      voucher.id,
                      t("window.export", { number: voucher.voucherNumber })
                    )
                  }
                }}
              >
                {t("workspace.export")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {stage === "import" ? (
        <section className="flow-stage-content" aria-labelledby="import-heading">
          <div className="flow-stage-title">
            <div>
              <h2 id="import-heading">{t("workspace.input_files")}</h2>
              <p>{t("workspace.files_received")}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() =>
                openOrderSet(
                  orderSet.id,
                  t("window.order_set", {
                    id: orderSet.id,
                    title: orderSet.title,
                  })
                )
              }
            >
              {t("workspace.open_detail")}
            </Button>
          </div>
          <div className="flow-file-grid">
            <article className="flow-file-card">
              <span className="flow-file-card__icon">
                <FileSpreadsheet className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {excelFilenameForRun(orderSet) ?? t("inputs.detail.no_file", { ns: "orders" })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("workspace.excel", {
                    orders: orderSet.orderCount ?? 0,
                    items: orderSet.itemCount ?? 0,
                  })}
                </p>
              </div>
              {excelFilenameForRun(orderSet) ? (
                <CheckCircle2 className="size-4 text-success" aria-label="Uploaded" />
              ) : (
                <AlertTriangle className="size-4 text-warning" aria-label="Missing" />
              )}
            </article>
            <article className="flow-file-card">
              <span className="flow-file-card__icon">
                <FileText className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {orderSet.invoicePdfFilename ?? t("workspace.invoice_missing")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {orderSet.invoiceReceiptNumber ?? t("workspace.receipt_unavailable")}
                </p>
              </div>
              {orderSet.invoicePdfFilename ? (
                <CheckCircle2 className="size-4 text-success" aria-label="Uploaded" />
              ) : (
                <AlertTriangle className="size-4 text-warning" aria-label="Missing" />
              )}
            </article>
          </div>
          <div className="flow-summary-grid">
            <article className="flow-metric">
              <span>{t("workspace.excel_total")}</span>
              <strong>{formatCurrency(excelAmount, locale, "THB")}</strong>
            </article>
            <article className="flow-metric">
              <span>{t("workspace.invoice_total")}</span>
              <strong>
                {invoiceAmount == null
                  ? "—"
                  : formatCurrency(invoiceAmount, locale, "THB")}
              </strong>
            </article>
            <article className="flow-metric">
              <span>{t("workspace.input_type")}</span>
              <strong>
                {tOrders(
                  `inputs.input_file_type.${orderSet.inputFileType === "SHIPPING_FEE" ? "shipping_fee" : "service_fee"}`
                )}
              </strong>
            </article>
          </div>
          <div className="flow-next-action">
            <div>
              <p className="text-sm font-semibold">{t("workspace.files_ready")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("workspace.files_ready_hint")}
              </p>
            </div>
            <Button
              type="button"
              className="rounded-lg"
              onClick={() => onStageChange("match")}
            >
              {t("workspace.review_match_cta")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "match" ? (
        <section className="flow-stage-content" aria-labelledby="match-heading">
          <div className="flow-stage-title">
            <div>
              <h2 id="match-heading">{t("workspace.reconciliation")}</h2>
              <p>{t("workspace.reconciliation_hint")}</p>
            </div>
            {matchStatus(orderSet, t)}
          </div>
          <div className="flow-reconciliation">
            <article>
              <span>{t("workspace.excel_amount")}</span>
              <strong>{formatCurrency(excelAmount, locale, "THB")}</strong>
              <small>{excelFilenameForRun(orderSet)}</small>
            </article>
            <ArrowRight className="size-5 text-muted-foreground" aria-hidden />
            <article>
              <span>{t("workspace.invoice_amount")}</span>
              <strong>
                {invoiceAmount == null
                  ? "—"
                  : formatCurrency(invoiceAmount, locale, "THB")}
              </strong>
              <small>
                {orderSet.invoiceReceiptNumber ?? t("workspace.no_receipt")}
              </small>
            </article>
          </div>
          {orderSet.invoiceMatchStatus === "MATCHED" ? (
            <div className="flow-success-panel">
              <CheckCircle2 className="size-5" aria-hidden />
              <div>
                <p className="font-semibold">{t("workspace.amounts_match")}</p>
                <p>{t("workspace.can_continue")}</p>
              </div>
            </div>
          ) : (
            <div className="flow-error-panel">
              <AlertTriangle className="size-5" aria-hidden />
              <div>
                <p className="font-semibold">{t("workspace.difference")}</p>
                <p>
                  {t("workspace.variance", {
                    amount: formatCurrency(
                      Math.abs(excelAmount - (invoiceAmount ?? 0)),
                      locale,
                      "THB"
                    ),
                  })}
                </p>
              </div>
            </div>
          )}
          <div className="flow-stage-actions">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() =>
                openOrderSet(
                  orderSet.id,
                  t("window.order_set", {
                    id: orderSet.id,
                    title: orderSet.title,
                  })
                )
              }
            >
              {t("workspace.inspect_source")}
            </Button>
            <Button
              type="button"
              className={cn(
                "rounded-lg",
                !canGenerateVoucher && "cursor-help opacity-50"
              )}
              aria-disabled={!canGenerateVoucher}
              onClick={() => {
                if (!canGenerateVoucher) {
                  setWhyOpen(true)
                  return
                }
                onStageChange("voucher")
              }}
            >
              {t("workspace.continue_voucher")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "voucher" ? (
        <section className="flow-stage-content" aria-labelledby="voucher-heading">
          <div className="flow-stage-title">
            <div>
              <h2 id="voucher-heading">{t("workspace.voucher_heading")}</h2>
              <p>{t("workspace.voucher_hint")}</p>
            </div>
            <FlowGenerateVoucherButton run={orderSet} className="rounded-lg">
              <Receipt className="size-4" />
              {t("workspace.generate")}
            </FlowGenerateVoucherButton>
          </div>
          {allVouchers.length ? (
            <div className="flow-voucher-list">
              {allVouchers.map((voucher) => (
                <button
                  type="button"
                  key={voucher.id}
                  onClick={() =>
                    openVoucherDetail(voucher.id, voucher.voucherNumber)
                  }
                >
                  <span className="flow-file-card__icon">
                    <Receipt className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <strong>{voucher.voucherNumber}</strong>
                    <small>{voucher.voucherBrief}</small>
                  </span>
                  <span className="text-right">
                    <strong>
                      {formatCurrency(voucher.debitTotal, locale, voucher.currency)}
                    </strong>
                    <small>{voucher.status}</small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flow-empty-state">
              <Receipt className="size-8" aria-hidden />
              <h3>{t("workspace.no_voucher")}</h3>
              <p>{t("workspace.no_voucher_hint")}</p>
            </div>
          )}
        </section>
      ) : null}

      {stage === "export" ? (
        <section className="flow-stage-content" aria-labelledby="export-heading">
          <div className="flow-stage-title">
            <div>
              <h2 id="export-heading">{t("workspace.exports")}</h2>
              <p>{t("workspace.exports_hint")}</p>
            </div>
          </div>
          <div className="flow-export-grid">
            {allVouchers.map((voucher) => (
              <article key={voucher.id}>
                <Receipt className="size-5 text-primary" aria-hidden />
                <div>
                  <h3>{voucher.voucherNumber}</h3>
                  <p>
                    {voucher.status} ·{" "}
                    {formatCurrency(voucher.debitTotal, locale, voucher.currency)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() =>
                    openExport(
                      voucher.id,
                      t("window.export", { number: voucher.voucherNumber })
                    )
                  }
                >
                  {t("workspace.export")}
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <FlowGenerateBlockedDialog
        run={orderSet}
        open={whyOpen}
        onOpenChange={setWhyOpen}
      />
    </main>
  )
}
