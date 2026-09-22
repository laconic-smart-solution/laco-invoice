import { useEffect, useRef, useState } from "react"
import {
  BookText,
  Download,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FlowRunRecords } from "@/features/flow/components/dialogs/flow-run-records"
import { InvoicePdfCard, InvoicePdfMatchSummary } from "@/features/orders/components/invoice-pdf-card"
import { OrderImportDialog } from "@/features/orders/components/order-import-dialog"
import { OrderInputRunStatusBadges } from "@/features/orders/components/order-input-run-status-badges"
import {
  SERVICE_FEE_SAMPLE_FILENAME,
  SERVICE_FEE_SAMPLE_HREF,
  SHIPPING_FEE_SAMPLE_FILENAME,
  SHIPPING_FEE_SAMPLE_HREF,
} from "@/features/orders/constants/order-import-sample"
import { FlowGenerateVoucherButton } from "@/features/flow/components/dialogs/flow-generate-voucher-button"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
import { useVouchersByOrderInputRunQuery } from "@/features/vouchers/queries/voucher.query"
import type { MarketplaceCode } from "@/features/stores/config/marketplaces"
import {
  getOrderInputRunErrorMessage,
  useCancelOrderInputRunPreviewMutation,
  useDeleteOrderInputRunMutation,
  useDownloadOrderInputFileMutation,
  useDownloadOrderInputInvoicePdfMutation,
  useFinishOrderInputRunMutation,
  useOrderInputRunDetailQuery,
  useResetStuckOrderInputRunMutation,
  useRollbackOrderInputOrderDetailMutation,
  useRollbackOrderInputWithdrawMutation,
  useRunOrderInputWithdrawMutation,
  useStartOrderInputRunPreviewMutation,
  useUpdateOrderInputRunTitleMutation,
  useUploadOrderInputInvoicePdfMutation,
  useUploadOrderInputOrderDetailMutation,
  useUploadOrderInputWithdrawMutation,
} from "@/shared/queries/order-input-run.query"
import type { ApiOrderImportPreviewBatchDto } from "@/shared/services/order.service"
import type { ApiOrderInputFileStatus } from "@/shared/services/order-input-run.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatDateTime } from "@/util/format"

interface OrderSetDetailWindowProps {
  orderSetId: number
  onDeleted?: (id: number) => void
}

function canRunFile(status: ApiOrderInputFileStatus) {
  return status === "READY" || status === "FAILED" || status === "PARTIAL"
}

export function OrderSetDetailWindow({
  orderSetId,
  onDeleted,
}: OrderSetDetailWindowProps) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)
  const openVoucherDetail = useFlowWindowsStore((state) => state.openVoucherDetail)
  const close = useFlowWindowsStore((state) => state.close)
  const detailQuery = useOrderInputRunDetailQuery(orderSetId)
  const run = detailQuery.data
  const vouchersQuery = useVouchersByOrderInputRunQuery(orderSetId)
  const existingVouchers = vouchersQuery.data ?? []

  const orderDetailInputRef = useRef<HTMLInputElement>(null)
  const withdrawInputRef = useRef<HTMLInputElement>(null)
  const uploadOrderDetail = useUploadOrderInputOrderDetailMutation()
  const uploadWithdraw = useUploadOrderInputWithdrawMutation()
  const uploadInvoicePdf = useUploadOrderInputInvoicePdfMutation()
  const downloadInputFileMutation = useDownloadOrderInputFileMutation()
  const downloadInvoicePdfMutation = useDownloadOrderInputInvoicePdfMutation()
  const startPreviewMutation = useStartOrderInputRunPreviewMutation()
  const cancelPreviewMutation = useCancelOrderInputRunPreviewMutation()
  const finishRunMutation = useFinishOrderInputRunMutation()
  const runWithdrawMutation = useRunOrderInputWithdrawMutation()
  const rollbackOrderDetailMutation = useRollbackOrderInputOrderDetailMutation()
  const rollbackWithdrawMutation = useRollbackOrderInputWithdrawMutation()
  const deleteSetMutation = useDeleteOrderInputRunMutation()
  const resetStuckMutation = useResetStuckOrderInputRunMutation()
  const updateTitleMutation = useUpdateOrderInputRunTitleMutation()
  const didAutoResetStuck = useRef(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBatch, setPreviewBatch] = useState<ApiOrderImportPreviewBatchDto | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const isLocallyRunning =
    startPreviewMutation.isPending ||
    finishRunMutation.isPending ||
    runWithdrawMutation.isPending ||
    previewOpen

  useEffect(() => {
    didAutoResetStuck.current = false
  }, [orderSetId])

  useEffect(() => {
    if (!run || didAutoResetStuck.current || isLocallyRunning) {
      return
    }
    if (
      run.status === "RUNNING" ||
      run.orderDetailStatus === "RUNNING" ||
      run.withdrawStatus === "RUNNING"
    ) {
      didAutoResetStuck.current = true
      resetStuckMutation.mutate(run.id)
    }
    // Auto-reset once when a stuck RUNNING status is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    run?.id,
    run?.status,
    run?.orderDetailStatus,
    run?.withdrawStatus,
    isLocallyRunning,
  ])

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("inputs.detail.loading")}</p>
  }

  if (!run) {
    return (
      <p className="text-sm text-muted-foreground">
        {getOrderInputRunErrorMessage(
          detailQuery.error,
          t("inputs.errors.load_failed")
        )}
      </p>
    )
  }

  const isShippingFee = run.inputFileType === "SHIPPING_FEE"
  const isStuckRunning =
    !isLocallyRunning &&
    !resetStuckMutation.isPending &&
    (run.status === "RUNNING" ||
      run.orderDetailStatus === "RUNNING" ||
      run.withdrawStatus === "RUNNING")
  const isRunPending =
    startPreviewMutation.isPending ||
    finishRunMutation.isPending ||
    runWithdrawMutation.isPending
  const isBusy =
    uploadOrderDetail.isPending ||
    uploadWithdraw.isPending ||
    uploadInvoicePdf.isPending ||
    isLocallyRunning ||
    resetStuckMutation.isPending ||
    isStuckRunning
  const excelFilename = isShippingFee
    ? run.orderDetailFilename
    : run.withdrawFilename
  const excelStatus = isShippingFee
    ? run.orderDetailStatus
    : run.withdrawStatus
  const canRun =
    canRunFile(excelStatus) && excelFilename != null && !isBusy

  const handleDownloadInvoice = () => {
    downloadInvoicePdfMutation.mutate({
      id: run.id,
      fallbackFilename: run.invoicePdfFilename ?? "invoice.pdf",
    })
  }

  const handleDownloadExcel = () => {
    downloadInputFileMutation.mutate({
      id: run.id,
      fallbackFilename: excelFilename ?? "input.xlsx",
    })
  }

  const handleRun = async () => {
    setLocalError(null)
    if (isShippingFee) {
      if (!canRun) {
        setLocalError(t("inputs.errors.order_detail_required"))
        return
      }
      try {
        const preview = await startPreviewMutation.mutateAsync(run.id)
        setPreviewBatch(preview)
        setPreviewOpen(true)
      } catch (error) {
        setLocalError(
          getOrderInputRunErrorMessage(error, t("inputs.errors.load_failed"))
        )
      }
      return
    }
    if (!canRun) {
      setLocalError(t("inputs.errors.withdraw_required"))
      return
    }
    try {
      await runWithdrawMutation.mutateAsync(run.id)
    } catch (error) {
      setLocalError(
        getOrderInputRunErrorMessage(error, t("inputs.errors.load_failed"))
      )
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0 space-y-2">
          {isEditingTitle ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                const nextTitle = editTitleValue.trim()
                if (!nextTitle) return
                updateTitleMutation.mutate(
                  { id: run.id, title: nextTitle },
                  { onSuccess: () => setIsEditingTitle(false) }
                )
              }}
            >
              <Input
                value={editTitleValue}
                onChange={(event) => setEditTitleValue(event.target.value)}
                className="h-8 min-w-64 rounded-lg"
              />
              <Button type="submit" size="sm" className="h-8 rounded-lg">
                {t("inputs.save", "Save")}
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg font-semibold">{run.title}</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg"
                onClick={() => {
                  setEditTitleValue(run.title)
                  setIsEditingTitle(true)
                }}
                aria-label={t("inputs.edit_title", "Edit title")}
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {run.storeName} · {run.marketplaceCode} ·{" "}
              {t(
                `inputs.input_file_type.${isShippingFee ? "shipping_fee" : "service_fee"}`
              )}
            </span>
            <OrderInputRunStatusBadges run={run} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {existingVouchers.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={() =>
                openVoucherDetail(
                  existingVouchers[0].id,
                  existingVouchers[0].voucherNumber
                )
              }
            >
              <BookText className="size-4" />
              {existingVouchers[0].voucherNumber}
            </Button>
          ) : (
            <FlowGenerateVoucherButton
              run={run}
              variant="outline"
              className="rounded-lg"
            >
              <BookText className="size-4" />
              {t("inputs.generate_voucher", "Generate voucher")}
            </FlowGenerateVoucherButton>
          )}
          <Button
            type="button"
            variant="outline"
            className="rounded-lg border-destructive/30 text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            {t("inputs.detail.delete_set")}
          </Button>
          <Button
            type="button"
            className="rounded-lg"
            disabled={!canRun}
            onClick={() => void handleRun()}
          >
            {isRunPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            {isRunPending ? t("inputs.running") : t("inputs.run_file")}
          </Button>
        </div>
      </header>

      <AuthFormError message={localError} />

      {isStuckRunning ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          <p>{t("inputs.detail.stuck_running")}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resetStuckMutation.isPending}
            onClick={() => resetStuckMutation.mutate(run.id)}
          >
            {t("inputs.detail.reset_stuck")}
          </Button>
        </div>
      ) : null}

      <div className="grid items-stretch gap-4 @[52rem]:grid-cols-2">
        <InvoicePdfCard
          run={run}
          disabled={isBusy}
          uploading={uploadInvoicePdf.isPending}
          downloading={downloadInvoicePdfMutation.isPending}
          onUpload={(file) => uploadInvoicePdf.mutate({ id: run.id, file })}
          onDownload={handleDownloadInvoice}
        />
        <article className="rounded-md border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">
            {isShippingFee
              ? t("inputs.detail.order_detail_title")
              : t("inputs.detail.withdraw_title")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {excelFilename ?? t("inputs.detail.no_file")}
          </p>
          <input
            ref={isShippingFee ? orderDetailInputRef : withdrawInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              if (isShippingFee) {
                uploadOrderDetail.mutate({ id: run.id, file })
              } else {
                uploadWithdraw.mutate({ id: run.id, file })
              }
              event.target.value = ""
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() =>
                (isShippingFee
                  ? orderDetailInputRef
                  : withdrawInputRef
                ).current?.click()
              }
            >
              <FileSpreadsheet className="size-3.5" />
              {t("inputs.detail.upload")}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canRun}
              onClick={() => void handleRun()}
            >
              <Play className="size-3.5" />
              {t("inputs.run_file")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!excelFilename || downloadInputFileMutation.isPending}
              onClick={handleDownloadExcel}
            >
              <Download className="size-3.5" />
              {t("inputs.detail.download_file")}
            </Button>
            {run.status !== "COMPLETED" ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <a
                  href={
                    isShippingFee
                      ? SHIPPING_FEE_SAMPLE_HREF
                      : SERVICE_FEE_SAMPLE_HREF
                  }
                  download={
                    isShippingFee
                      ? SHIPPING_FEE_SAMPLE_FILENAME
                      : SERVICE_FEE_SAMPLE_FILENAME
                  }
                >
                  {t("inputs.detail.download_sample")}
                </a>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive"
              disabled={isBusy}
              onClick={() =>
                isShippingFee
                  ? rollbackOrderDetailMutation.mutate(run.id)
                  : rollbackWithdrawMutation.mutate(run.id)
              }
            >
              <RotateCcw className="size-3.5" />
              {t("inputs.detail.rollback_btn")}
            </Button>
          </div>
        </article>
      </div>

      <InvoicePdfMatchSummary run={run} locale={locale} />

      <FlowRunRecords run={run} />

      <p className="border-t border-border pt-3 text-[10px] text-muted-foreground">
        {t("inputs.detail.updated_at", {
          value: formatDateTime(run.updatedAt, locale),
        })}
      </p>

      <OrderImportDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        stores={
          run.storeId != null
            ? [
                {
                  id: run.storeId,
                  ownerId: null,
                  name: run.storeName ?? String(run.storeId),
                  logoUrl: null,
                  active: true,
                  createdAt: run.createdAt,
                },
              ]
            : []
        }
        initialPreview={previewBatch}
        fixedStoreId={run.storeId != null ? String(run.storeId) : undefined}
        fixedMarketplaceCode={
          (run.marketplaceCode as MarketplaceCode | null) ?? "TIKTOK"
        }
        hideUploadStep
        onCommitted={async (importResult) => {
          await finishRunMutation.mutateAsync({
            id: run.id,
            importResult,
          })
          setPreviewBatch(null)
          setPreviewOpen(false)
        }}
        onDismissWithoutCommit={() => {
          cancelPreviewMutation.mutate(run.id)
          setPreviewBatch(null)
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("inputs.detail.delete_set_title")}
        description={t("inputs.detail.delete_set_description")}
        confirmLabel={t("inputs.detail.delete_set_confirm_btn")}
        variant="destructive"
        isLoading={deleteSetMutation.isPending}
        onConfirm={async () => {
          await deleteSetMutation.mutateAsync(run.id)
          onDeleted?.(run.id)
          close(`order-set-${run.id}`)
        }}
      />
    </div>
  )
}
