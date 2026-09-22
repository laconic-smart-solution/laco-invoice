import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Receipt,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { type FlowStageId } from "@/features/flow/data/flow-constants"
import { FlowGenerateVoucherButton } from "@/features/flow/components/dialogs/flow-generate-voucher-button"
import {
  canGenerateFlowVoucher,
  hasFlowSourceFiles,
  isFlowVoucherExportable,
  needsFlowReview,
} from "@/features/flow/util/flow-eligibility"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
import type { Voucher } from "@/features/vouchers/types/voucher"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"
import { formatDateTime } from "@/util/format"
import { useLocaleStore } from "@/shared/stores/locale-store"

interface FlowInspectorProps {
  stage: FlowStageId
  orderSet: ApiOrderInputRunDto | null
  vouchers: Voucher[]
  onStageChange: (stage: FlowStageId) => void
}

export function FlowInspector({
  stage,
  orderSet,
  vouchers,
  onStageChange,
}: FlowInspectorProps) {
  const { t } = useTranslation("flow")
  const locale = useLocaleStore((state) => state.locale)
  const openExport = useFlowWindowsStore((state) => state.openExport)
  const canGenerateVoucher = orderSet ? canGenerateFlowVoucher(orderSet) : false
  const hasFiles = orderSet ? hasFlowSourceFiles(orderSet) : false
  const hasMatch =
    orderSet?.invoiceMatchStatus === "MATCHED" ||
    orderSet?.invoiceMatchStatus === "MISMATCH"
  const isMatched = orderSet?.invoiceMatchStatus === "MATCHED"
  const hasExportable = vouchers.some(isFlowVoucherExportable)
  const progress = hasExportable
    ? 100
    : vouchers.length
      ? 75
      : isMatched
        ? 50
        : hasMatch
          ? 35
          : hasFiles
            ? 25
            : 10

  return (
    <aside className="flow-inspector" aria-label={t("inspector.label")}>
      <section className="flow-inspector__section">
        <div className="flex items-center justify-between gap-2">
          <h2>{t("inspector.progress")}</h2>
          <strong className="text-xs tabular-nums text-primary">{progress}%</strong>
        </div>
        <div
          className="flow-progress"
          role="progressbar"
          aria-label={t("inspector.completion")}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <ol className="flow-checklist">
          <li className={hasFiles ? "flow-checklist__done" : ""}>
            {hasFiles ? <CheckCircle2 aria-hidden /> : <Clock3 aria-hidden />}
            {t("inspector.files_received")}
          </li>
          <li className={hasMatch ? "flow-checklist__done" : ""}>
            {hasMatch ? <CheckCircle2 aria-hidden /> : <Clock3 aria-hidden />}
            {t("inspector.reconciled")}
          </li>
          <li className={vouchers.length ? "flow-checklist__done" : ""}>
            {vouchers.length ? <CheckCircle2 aria-hidden /> : <Clock3 aria-hidden />}
            {t("inspector.voucher_generated")}
          </li>
          <li className={hasExportable ? "flow-checklist__done" : ""}>
            {hasExportable ? <CheckCircle2 aria-hidden /> : <Clock3 aria-hidden />}
            {t("inspector.export_downloaded")}
          </li>
        </ol>
      </section>

      <section className="flow-inspector__section">
        <h2>{t("inspector.next")}</h2>
        {!orderSet ? (
          <p className="text-xs text-muted-foreground">{t("workspace.empty_run")}</p>
        ) : needsFlowReview(orderSet) ? (
          <div className="flow-inspector-action flow-inspector-action--warning">
            <AlertTriangle className="size-4" aria-hidden />
            <div>
              <strong>{t("inspector.resolve_mismatch")}</strong>
              <p>{t("inspector.resolve_hint")}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 rounded-lg"
                onClick={() => onStageChange("match")}
              >
                {t("workspace.review_match_cta")}
              </Button>
            </div>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="flow-inspector-action">
            <Receipt className="size-4 text-primary" aria-hidden />
            <div>
              <strong>
                {canGenerateVoucher
                  ? t("inspector.generate_title")
                  : t("inspector.complete_first")}
              </strong>
              <p>
                {canGenerateVoucher
                  ? t("inspector.generate_hint")
                  : t("inspector.complete_hint")}
              </p>
              <FlowGenerateVoucherButton
                run={orderSet}
                size="sm"
                className="mt-3 rounded-lg"
              >
                {t("workspace.generate")}
              </FlowGenerateVoucherButton>
            </div>
          </div>
        ) : (
          <div className="flow-inspector-action">
            <FileCheck2 className="size-4 text-primary" aria-hidden />
            <div>
              <strong>{t("inspector.export_title")}</strong>
              <p>
                {t("inspector.export_hint", {
                  number: vouchers[0].voucherNumber,
                })}
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-3 rounded-lg"
                onClick={() =>
                  openExport(
                    vouchers[0].id,
                    t("window.export", { number: vouchers[0].voucherNumber })
                  )
                }
              >
                {t("inspector.choose_format")}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="flow-inspector__section">
        <h2>{t("inspector.activity")}</h2>
        <ol className="flow-activity">
          <li>
            <span />
            <div>
              <strong>{t("inspector.updated", {
                value: orderSet
                  ? formatDateTime(orderSet.updatedAt, locale)
                  : "—",
              })}</strong>
            </div>
          </li>
        </ol>
      </section>

      <p className="sr-only">Current stage: {stage}</p>
    </aside>
  )
}
