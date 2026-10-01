import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Download, FileCheck2, Loader2 } from "lucide-react"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Button } from "@/components/ui/button"
import { GenerateVoucherDialog } from "@/features/vouchers/components/generate-voucher-dialog"
import {
  useExportSingleVoucherCsvMutation,
  useExportSingleVoucherExcelMutation,
  useExportSingleVoucherPdfMutation,
} from "@/features/vouchers/queries/voucher.query"
import type { Voucher } from "@/features/vouchers/types/voucher"
import { ManualInvoiceEditor } from "@/features/flow/components/manual-invoice-editor"
import type { ManualInvoiceStage } from "@/features/flow/hooks/use-manual-invoice-workspace"
import { useUpdateInvoiceStatusMutation } from "@/features/invoices/queries/invoice.query"
import type { InvoiceDetail } from "@/features/invoices/types/invoice"

interface ManualInvoiceStageWorkspaceProps {
  stage: ManualInvoiceStage
  invoice: InvoiceDetail | null
  vouchers: Voucher[]
  onStageChange: (stage: ManualInvoiceStage) => void
  onSaved: (invoiceId: number) => void
  onRefresh: () => void
}

export function ManualInvoiceStageWorkspace({
  stage,
  invoice,
  vouchers,
  onStageChange,
  onSaved,
  onRefresh,
}: ManualInvoiceStageWorkspaceProps) {
  const { t } = useTranslation("flow")
  const headingRef = useRef<HTMLHeadingElement>(null)
  const issueMutation = useUpdateInvoiceStatusMutation()
  const [issueConfirmOpen, setIssueConfirmOpen] = useState(false)
  const excelMutation = useExportSingleVoucherExcelMutation()
  const csvMutation = useExportSingleVoucherCsvMutation()
  const pdfMutation = useExportSingleVoucherPdfMutation()
  const voucher = vouchers[0] ?? null

  useEffect(() => {
    headingRef.current?.focus()
  }, [stage])

  const isExporting =
    excelMutation.isPending || csvMutation.isPending || pdfMutation.isPending

  return (
    <main className="flow-stage-workspace">
      <header className="flow-stage-workspace__header">
        <div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold focus-visible:outline-none"
          >
            {t(`manual.pipeline.${stage}`)}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`manual.pipeline.${stage}_description`)}
          </p>
        </div>
      </header>
      <div className="flow-stage-content">
        {stage === "draft" ? (
          <ManualInvoiceEditor invoice={invoice} onSaved={onSaved} />
        ) : null}

        {stage === "review" && invoice ? (
          <div className="space-y-5">
            <section className="rounded-lg border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{invoice.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                  {t(`manual.statuses.${invoice.status.toLowerCase()}`)}
                </span>
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">
                    {t("manual.fields.store")}
                  </dt>
                  <dd>{invoice.storeName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("manual.fields.marketplace")}
                  </dt>
                  <dd>{invoice.marketplaceCode}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("manual.fields.date_range")}
                  </dt>
                  <dd>
                    {invoice.startDate} – {invoice.endDate}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("manual.fields.buyer_name")}
                  </dt>
                  <dd>{invoice.buyerName || t("manual.not_provided")}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("manual.totals.subtotal_label")}
                  </dt>
                  <dd>{invoice.subtotal.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">
                    {t("manual.totals.total_label")}
                  </dt>
                  <dd className="font-semibold">
                    {invoice.currency} {invoice.grandTotal.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </section>
            {invoice.items.length ? (
              <section className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <caption className="sr-only">{t("manual.sections.lines")}</caption>
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="p-3">{t("manual.fields.product")}</th>
                      <th className="p-3">{t("manual.fields.sku")}</th>
                      <th className="p-3">{t("manual.fields.quantity")}</th>
                      <th className="p-3">{t("manual.fields.unit_price")}</th>
                      <th className="p-3">{t("manual.fields.discount")}</th>
                      <th className="p-3">{t("manual.totals.line_total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-3">{item.productName}</td>
                        <td className="p-3">{item.sellerSku || "—"}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">{item.unitPrice.toFixed(2)}</td>
                        <td className="p-3">{item.discount.toFixed(2)}</td>
                        <td className="p-3 font-medium">
                          {item.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onStageChange("draft")}
              >
                {t("manual.actions.edit")}
              </Button>
              <Button
                type="button"
                disabled={
                  invoice.status !== "DRAFT" || issueMutation.isPending
                }
                onClick={() => setIssueConfirmOpen(true)}
              >
                {issueMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <FileCheck2 className="size-4" />
                )}
                {invoice.status === "DRAFT"
                  ? t("manual.actions.issue")
                  : t("manual.actions.issued")}
              </Button>
            </div>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {issueMutation.isPending ? t("manual.status.issuing") : ""}
            </p>
          </div>
        ) : null}

        {stage === "voucher" && invoice ? (
          invoice.status === "DRAFT" ? (
            <div className="flow-empty-state">
              <h3>{t("manual.blockers.issue")}</h3>
              <p>{t("manual.pipeline.review_description")}</p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => onStageChange("review")}
              >
                {t("manual.actions.issue")}
              </Button>
            </div>
          ) : (
            <GenerateVoucherDialog
              open
              embedded
              onOpenChange={() => undefined}
              defaultInvoiceId={invoice.id}
              onGenerated={() => {
                onRefresh()
                onStageChange("export")
              }}
            />
          )
        ) : null}

        {stage === "export" ? (
          voucher ? (
            <section className="space-y-4 rounded-lg border border-border p-5">
              <div>
                <h3 className="font-semibold">{voucher.voucherNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("manual.export.ready")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isExporting}
                  onClick={() =>
                    excelMutation.mutate({
                      id: voucher.id,
                      voucherNumber: voucher.voucherNumber,
                    })
                  }
                >
                  <Download className="size-4" />
                  {t("manual.export.excel")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isExporting}
                  onClick={() =>
                    csvMutation.mutate({
                      id: voucher.id,
                      voucherNumber: voucher.voucherNumber,
                    })
                  }
                >
                  <Download className="size-4" />
                  {t("manual.export.csv")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isExporting}
                  onClick={() =>
                    pdfMutation.mutate({
                      id: voucher.id,
                      voucherNumber: voucher.voucherNumber,
                    })
                  }
                >
                  <Download className="size-4" />
                  {t("manual.export.pdf")}
                </Button>
              </div>
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {isExporting ? t("manual.status.exporting") : ""}
              </p>
            </section>
          ) : (
            <div className="flow-empty-state">
              <Download className="size-8" />
              <h3>{t("manual.export.empty")}</h3>
              <p>{t("manual.export.empty_hint")}</p>
              <Button
                type="button"
                className="mt-4"
                onClick={() => onStageChange("voucher")}
              >
                {t("manual.actions.open_voucher")}
              </Button>
            </div>
          )
        ) : null}

        {stage !== "draft" && !invoice ? (
          <div className="flow-empty-state">
            <h3>{t("manual.empty.title")}</h3>
            <p>{t("manual.empty.description")}</p>
          </div>
        ) : null}
      </div>
      <ConfirmDialog
        open={issueConfirmOpen}
        onOpenChange={setIssueConfirmOpen}
        title={t("manual.issue_confirm.title")}
        description={t("manual.issue_confirm.description")}
        confirmLabel={t("manual.actions.issue")}
        isLoading={issueMutation.isPending}
        onConfirm={async () => {
          if (!invoice) return
          await issueMutation.mutateAsync({
            id: invoice.id,
            status: "ISSUED",
          })
          onRefresh()
          onStageChange("voucher")
        }}
      />
    </main>
  )
}
