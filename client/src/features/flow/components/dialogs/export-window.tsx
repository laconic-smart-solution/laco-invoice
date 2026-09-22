import { useState } from "react"
import { Check, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  useExportSingleVoucherCsvMutation,
  useExportSingleVoucherExcelMutation,
  useExportSingleVoucherPdfMutation,
  useVoucherDetailQuery,
} from "@/features/vouchers/queries/voucher.query"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
import { isFlowVoucherExportable } from "@/features/flow/util/flow-eligibility"
import { extractApiErrorMessage } from "@/shared/api/extract-api-error-message"

interface ExportWindowProps {
  voucherId: number
}

type ExportFormat = "excel" | "csv" | "pdf"

export function ExportWindow({ voucherId }: ExportWindowProps) {
  const { t } = useTranslation("vouchers")
  const close = useFlowWindowsStore((state) => state.close)
  const detailQuery = useVoucherDetailQuery(voucherId)
  const exportExcelMutation = useExportSingleVoucherExcelMutation()
  const exportCsvMutation = useExportSingleVoucherCsvMutation()
  const exportPdfMutation = useExportSingleVoucherPdfMutation()
  const [done, setDone] = useState<ExportFormat | null>(null)
  const [error, setError] = useState<string | null>(null)

  const voucher = detailQuery.data
  const canExport = voucher ? isFlowVoucherExportable(voucher) : false
  const isExporting =
    exportExcelMutation.isPending ||
    exportCsvMutation.isPending ||
    exportPdfMutation.isPending

  const runExport = async (format: ExportFormat) => {
    if (!voucher || !canExport) return
    setError(null)
    try {
      if (format === "excel") {
        await exportExcelMutation.mutateAsync({
          id: voucher.id,
          voucherNumber: voucher.voucherNumber,
        })
      } else if (format === "csv") {
        await exportCsvMutation.mutateAsync({
          id: voucher.id,
          voucherNumber: voucher.voucherNumber,
        })
      } else {
        await exportPdfMutation.mutateAsync({
          id: voucher.id,
          voucherNumber: voucher.voucherNumber,
        })
      }
      setDone(format)
    } catch (err) {
      setError(extractApiErrorMessage(err, t("export.failed")))
    }
  }

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("loading")}</p>
  }

  if (!voucher) {
    return (
      <p className="text-sm text-muted-foreground">{t("detail.not_found")}</p>
    )
  }

  return (
    <div className="space-y-4">
      {canExport ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("export.single_excel")} · {voucher.voucherNumber}
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("export.not_ready")}
        </p>
      )}

      <ul className="space-y-2" role="list">
        {(
          [
            {
              id: "excel" as const,
              label: t("export.single_excel"),
              icon: FileSpreadsheet,
            },
            {
              id: "csv" as const,
              label: t("export.single_csv"),
              icon: FileText,
            },
            {
              id: "pdf" as const,
              label: t("export.single_pdf"),
              icon: FileText,
            },
          ] as const
        ).map((item) => {
          const Icon = item.icon
          const isDone = done === item.id
          return (
            <li key={item.id}>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-3 text-left"
                disabled={isExporting || !canExport}
                onClick={() => void runExport(item.id)}
              >
                <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {isExporting && !isDone ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : null}
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-success">
                    <Check className="size-3.5" aria-hidden />
                    {t("export.button")}
                  </span>
                ) : null}
              </Button>
            </li>
          )
        })}
      </ul>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          onClick={() => close(`export-${voucherId}`)}
        >
          {t("form.cancel")}
        </Button>
      </div>
    </div>
  )
}
