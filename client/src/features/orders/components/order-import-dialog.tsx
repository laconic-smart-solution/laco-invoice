import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { Download, FileSpreadsheet, Info, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { OrderImportExcelRowsDialog } from "@/features/orders/components/order-import-excel-rows-dialog"
import { useInfiniteScrollSentinel } from "@/shared/hooks/use-infinite-scroll-sentinel"
import {
  ORDER_IMPORT_SAMPLE_FILENAME,
  ORDER_IMPORT_SAMPLE_HREF,
} from "@/features/orders/constants/order-import-sample"
import {
  SUPPORTED_MARKETPLACES,
  type MarketplaceCode,
} from "@/features/stores/config/marketplaces"
import type { Store } from "@/features/stores/types/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  ApiOrderImportPreviewBatchDto,
  ApiOrderImportPreviewOrderDto,
  ApiOrderImportResolveAction,
  ApiOrderImportResultDto,
} from "@/shared/services/order.service"
import {
  getOrderErrorMessage,
  useCommitOrderImportMutation,
  useDecideOrderImportMutation,
  usePreviewOrderImportMutation,
} from "@/shared/queries/order.query"

interface OrderImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stores: Store[]
  defaultStoreId?: string
  /** When set, dialog opens directly on the preview step (no upload). */
  initialPreview?: ApiOrderImportPreviewBatchDto | null
  fixedStoreId?: string
  fixedMarketplaceCode?: MarketplaceCode
  hideUploadStep?: boolean
  onCommitted?: (result: ApiOrderImportResultDto) => void | Promise<void>
  onDismissWithoutCommit?: () => void
}

type ImportStep = "upload" | "preview" | "result"

const PREVIEW_PAGE_SIZE = 40

export function OrderImportDialog({
  open,
  onOpenChange,
  stores,
  defaultStoreId = "",
  initialPreview = null,
  fixedStoreId,
  fixedMarketplaceCode,
  hideUploadStep = false,
  onCommitted,
  onDismissWithoutCommit,
}: OrderImportDialogProps) {
  const { t } = useTranslation("orders")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sampleHintId = useId()
  const previewMutation = usePreviewOrderImportMutation()
  const decideMutation = useDecideOrderImportMutation()
  const commitMutation = useCommitOrderImportMutation()
  const committedRef = useRef(false)

  const [storeId, setStoreId] = useState(defaultStoreId)
  const [marketplaceCode, setMarketplaceCode] = useState<MarketplaceCode>("TIKTOK")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [step, setStep] = useState<ImportStep>("upload")
  const [preview, setPreview] = useState<ApiOrderImportPreviewBatchDto | null>(null)
  const [result, setResult] = useState<ApiOrderImportResultDto | null>(null)
  const [promptRow, setPromptRow] = useState<ApiOrderImportPreviewOrderDto | null>(null)
  const [multiLineAcked, setMultiLineAcked] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PREVIEW_PAGE_SIZE)
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)
  const [excelRowsPreview, setExcelRowsPreview] =
    useState<ApiOrderImportPreviewOrderDto | null>(null)

  const applyPreview = useCallback((data: ApiOrderImportPreviewBatchDto) => {
    setPreview(data)
    setStep("preview")
    setVisibleCount(PREVIEW_PAGE_SIZE)
    setMultiLineAcked(false)
    const next = data.orders.find(
      (row) => row.matchStatus === "DUPLICATE" && row.resolveAction == null
    )
    setPromptRow(next ?? null)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }
    committedRef.current = false
    const initialStoreId =
      fixedStoreId || defaultStoreId || (stores[0] ? String(stores[0].id) : "")
    setStoreId(initialStoreId)
    setMarketplaceCode(fixedMarketplaceCode ?? "TIKTOK")
    setSelectedFile(null)
    setValidationError(null)
    setResult(null)
    setExcelRowsPreview(null)
    previewMutation.reset()
    decideMutation.reset()
    commitMutation.reset()

    if (initialPreview) {
      applyPreview(initialPreview)
    } else {
      setStep("upload")
      setPreview(null)
      setPromptRow(null)
      setMultiLineAcked(false)
      setVisibleCount(PREVIEW_PAGE_SIZE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form only when dialog opens
  }, [open, initialPreview, fixedStoreId, fixedMarketplaceCode, defaultStoreId, stores])

  const handleOpenChange = (next: boolean) => {
    if (!next && open && !committedRef.current && hideUploadStep) {
      onDismissWithoutCommit?.()
    }
    onOpenChange(next)
  }

  const parsedStoreId = Number(storeId)
  const isBusy =
    previewMutation.isPending || decideMutation.isPending || commitMutation.isPending

  const mutationError = useMemo(() => {
    const err =
      (previewMutation.isError && previewMutation.error) ||
      (decideMutation.isError && decideMutation.error) ||
      (commitMutation.isError && commitMutation.error) ||
      null
    return err
      ? getOrderErrorMessage(err, t("errors.import_failed"))
      : null
  }, [
    previewMutation.isError,
    previewMutation.error,
    decideMutation.isError,
    decideMutation.error,
    commitMutation.isError,
    commitMutation.error,
    t,
  ])

  const unresolvedDuplicates = useMemo(
    () =>
      preview?.orders.filter(
        (row) => row.matchStatus === "DUPLICATE" && row.resolveAction == null
      ) ?? [],
    [preview]
  )

  const multiLineOrders = useMemo(
    () => preview?.orders.filter((row) => (row.excelItemCount ?? 0) > 1) ?? [],
    [preview]
  )

  const needsMultiLineAck = multiLineOrders.length > 0 && !multiLineAcked
  const needsDuplicateDecision = unresolvedDuplicates.length > 0

  const canCommit =
    preview != null &&
    preview.orders.length > 0 &&
    !needsDuplicateDecision &&
    !needsMultiLineAck &&
    !isBusy

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setValidationError(null)
  }

  const previewOrders = preview?.orders ?? []
  const visibleOrders = previewOrders.slice(0, visibleCount)
  const hasMorePreviewRows = visibleCount < previewOrders.length

  const loadMorePreviewRows = useCallback(() => {
    setVisibleCount((current) =>
      Math.min(current + PREVIEW_PAGE_SIZE, previewOrders.length)
    )
  }, [previewOrders.length])

  const previewSentinelRef = useInfiniteScrollSentinel({
    enabled: step === "preview" && promptRow == null && hasMorePreviewRows,
    onIntersect: loadMorePreviewRows,
    root: scrollRoot,
  })

  const handlePreview = () => {
    if (!Number.isFinite(parsedStoreId) || parsedStoreId <= 0) {
      setValidationError(t("import.no_store"))
      return
    }
    if (!selectedFile) {
      setValidationError(t("import.no_file"))
      return
    }

    setValidationError(null)
    previewMutation.mutate(
      {
        storeId: parsedStoreId,
        marketplaceCode,
        file: selectedFile,
      },
      {
        onSuccess: applyPreview,
      }
    )
  }

  const decideRows = (
    updates: { previewOrderId: number; resolveAction: ApiOrderImportResolveAction }[],
    bulkDuplicatesAction?: ApiOrderImportResolveAction
  ) => {
    if (!preview) {
      return
    }
    decideMutation.mutate(
      {
        storeId: parsedStoreId,
        batchId: preview.batchId,
        updates,
        bulkDuplicatesAction,
      },
      {
        onSuccess: (data) => {
          setPreview(data)
          const next = data.orders.find(
            (row) => row.matchStatus === "DUPLICATE" && row.resolveAction == null
          )
          setPromptRow(next ?? null)
        },
      }
    )
  }

  const handleRowAction = (
    row: ApiOrderImportPreviewOrderDto,
    action: ApiOrderImportResolveAction
  ) => {
    decideRows([{ previewOrderId: row.id, resolveAction: action }])
  }

  const handleBulk = (action: ApiOrderImportResolveAction) => {
    decideRows([], action)
  }

  const handleCommit = () => {
    if (!preview) {
      return
    }
    if (needsMultiLineAck) {
      setValidationError(t("import.multiline_ack_required"))
      return
    }
    if (needsDuplicateDecision) {
      setValidationError(t("import.unresolved_duplicates"))
      setPromptRow(unresolvedDuplicates[0] ?? null)
      return
    }
    if (!canCommit) {
      return
    }
    setValidationError(null)
    commitMutation.mutate(
      { storeId: parsedStoreId, batchId: preview.batchId },
      {
        onSuccess: (data) => {
          committedRef.current = true
          setResult(data)
          setStep("result")
          setPromptRow(null)
          void Promise.resolve(onCommitted?.(data)).catch(() => {
            // Parent handles finish-run errors via its own mutation state.
          })
        },
      }
    )
  }

  const handleClose = () => {
    handleOpenChange(false)
  }

  const handleBackToUpload = () => {
    if (hideUploadStep) {
      handleClose()
      return
    }
    setStep("upload")
    setPreview(null)
    setPromptRow(null)
    setMultiLineAcked(false)
    setValidationError(null)
  }

  const statusLabel = result
    ? {
        COMPLETED: t("import.status_completed"),
        PARTIAL: t("import.status_partial"),
        FAILED: t("import.status_failed"),
      }[result.status]
    : null

  const actionLabel = (action: ApiOrderImportResolveAction | null) => {
    if (!action) {
      return t("import.action_choose")
    }
    return t(`import.action_${action.toLowerCase()}`)
  }

  const showMergeDecisionPanel = step === "preview" && promptRow != null

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={step === "preview" ? "sm:max-w-4xl" : "sm:max-w-lg"}
      >
        <DialogHeader>
          <DialogTitle>
            {showMergeDecisionPanel
              ? t("import.merge_prompt_title")
              : t("import.title")}
          </DialogTitle>
          <DialogDescription>
            {showMergeDecisionPanel
              ? t("import.merge_prompt_description", {
                  orderId: promptRow.externalOrderId,
                })
              : step === "preview"
                ? t("import.preview_description")
                : t("import.description")}
          </DialogDescription>
        </DialogHeader>

        {step === "result" && result ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{t("import.result_title")}</p>
              {statusLabel ? (
                <p className="text-muted-foreground">{statusLabel}</p>
              ) : null}
              <ul className="space-y-1 text-muted-foreground">
                <li>{t("import.result_orders", { count: result.orderCount })}</li>
                <li>{t("import.result_items", { count: result.itemCount })}</li>
                <li>{t("import.result_rows", { count: result.rowCount })}</li>
              </ul>
            </div>

            {result.errors.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  {t("import.errors_title")}
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-destructive">
                  {result.errors.map((error) => (
                    <li key={error} className="rounded-md bg-destructive/10 px-2 py-1">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <DialogFooter>
              <Button onClick={handleClose}>{t("import.close")}</Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === "preview" && preview && showMergeDecisionPanel ? (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">
                {t("import.merge_prompt_order_label", {
                  orderId: promptRow.externalOrderId,
                })}
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>
                  {t("import.merge_prompt_excel_items", {
                    count: promptRow.excelItemCount ?? 0,
                  })}
                </li>
                <li>
                  {t("import.merge_prompt_existing_items", {
                    count: promptRow.existingItemCount ?? 0,
                  })}
                </li>
                <li>
                  {t("import.merge_prompt_remaining", {
                    count: unresolvedDuplicates.length,
                  })}
                </li>
              </ul>
            </div>

            <AuthFormError message={mutationError} />

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                disabled={isBusy}
                onClick={() => handleRowAction(promptRow, "MERGE")}
              >
                {decideMutation.isPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : null}
                {t("import.action_merge")}
              </Button>
              <Button
                variant="outline"
                disabled={isBusy}
                onClick={() => handleRowAction(promptRow, "SKIP")}
              >
                {t("import.action_skip")}
              </Button>
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={() => handleRowAction(promptRow, "REPLACE")}
              >
                {t("import.action_replace")}
              </Button>
              <Button
                variant="ghost"
                disabled={isBusy}
                onClick={() => handleBulk("MERGE")}
              >
                {t("import.bulk_merge")}
              </Button>
              <Button
                variant="ghost"
                disabled={isBusy}
                onClick={() => handleBulk("SKIP")}
              >
                {t("import.bulk_skip")}
              </Button>
            </DialogFooter>
          </div>
        ) : null}

        {step === "preview" && preview && !showMergeDecisionPanel ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {t("import.preview_summary", {
                  total: preview.totalOrders,
                  newCount: preview.newCount,
                  duplicateCount: preview.duplicateCount,
                })}
              </span>
            </div>

            {needsMultiLineAck ? (
              <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium text-foreground">
                  {t("import.multiline_title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("import.multiline_description", {
                    orderCount: multiLineOrders.length,
                    rowCount: preview.rowCount,
                    totalOrders: preview.totalOrders,
                  })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setMultiLineAcked(true)
                      setValidationError(null)
                    }}
                  >
                    {t("import.multiline_confirm")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleBackToUpload}
                  >
                    {t("import.back")}
                  </Button>
                </div>
              </div>
            ) : null}

            {preview.duplicateCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => handleBulk("MERGE")}
                >
                  {t("import.bulk_merge")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => handleBulk("SKIP")}
                >
                  {t("import.bulk_skip")}
                </Button>
              </div>
            ) : null}

            <div
              ref={setScrollRoot}
              className="max-h-80 overflow-auto rounded-md border border-border"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("import.col_order_id")}</TableHead>
                    <TableHead>{t("import.col_match")}</TableHead>
                    <TableHead>{t("import.col_excel_items")}</TableHead>
                    <TableHead>{t("import.col_existing_items")}</TableHead>
                    <TableHead>{t("import.col_action")}</TableHead>
                    <TableHead>{t("import.col_warning")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleOrders.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">
                        {row.externalOrderId}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={
                              row.matchStatus === "NEW" ? "secondary" : "outline"
                            }
                          >
                            {t(`import.match_${row.matchStatus.toLowerCase()}`)}
                          </Badge>
                          {(row.excelItemCount ?? 0) > 1 ? (
                            <Badge variant="outline">
                              {t("import.match_multiline")}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span>{row.excelItemCount ?? 0}</span>
                          {(row.excelItemCount ?? 0) > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="size-6 text-muted-foreground hover:text-foreground"
                              aria-label={t("import.excel_rows_open_aria", {
                                orderId: row.externalOrderId,
                              })}
                              onClick={(event) => {
                                event.stopPropagation()
                                setExcelRowsPreview(row)
                              }}
                            >
                              <Info className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{row.existingItemCount ?? 0}</TableCell>
                      <TableCell>
                        {row.matchStatus === "NEW" ? (
                          <span className="text-sm text-muted-foreground">
                            {actionLabel(row.resolveAction ?? "CREATE")}
                          </span>
                        ) : (
                          <Select
                            value={row.resolveAction ?? undefined}
                            onValueChange={(value) =>
                              handleRowAction(
                                row,
                                value as ApiOrderImportResolveAction
                              )
                            }
                            disabled={isBusy}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue placeholder={t("import.action_choose")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MERGE">
                                {t("import.action_merge")}
                              </SelectItem>
                              <SelectItem value="SKIP">
                                {t("import.action_skip")}
                              </SelectItem>
                              <SelectItem
                                value="REPLACE"
                              >
                                {t("import.action_replace")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {(row.excelItemCount ?? 0) > 1 ? (
                          <span className="text-xs text-muted-foreground">
                            {t("import.warning_multiline")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div ref={previewSentinelRef} className="h-8 w-full" aria-hidden />
              {previewOrders.length > 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  {hasMorePreviewRows
                    ? t("import.table_showing", {
                        shown: visibleOrders.length,
                        total: previewOrders.length,
                      })
                    : t("import.table_end", {
                        total: previewOrders.length,
                      })}
                </p>
              ) : null}
            </div>

            <AuthFormError message={validationError} />
            <AuthFormError message={mutationError} />

            <DialogFooter className="gap-2 sm:justify-between">
              {hideUploadStep ? (
                <span />
              ) : (
                <Button
                  variant="outline"
                  onClick={handleBackToUpload}
                  disabled={isBusy}
                >
                  {t("import.back")}
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isBusy}>
                  {t("import.close")}
                </Button>
                <Button onClick={handleCommit} disabled={!canCommit}>
                  {commitMutation.isPending ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <FileSpreadsheet data-icon="inline-start" />
                  )}
                  {commitMutation.isPending
                    ? t("import.importing")
                    : t("import.commit")}
                </Button>
              </div>
            </DialogFooter>
          </div>
        ) : null}

        {step === "upload" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("import.store_label")}
              </Label>
              <Select
                value={storeId}
                onValueChange={setStoreId}
                disabled={isBusy || stores.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("import.store_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={String(store.id)}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("import.marketplace_label")}
              </Label>
              <Select
                value={marketplaceCode}
                onValueChange={(code) => setMarketplaceCode(code as MarketplaceCode)}
                disabled={isBusy}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("import.marketplace_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_MARKETPLACES.map((marketplace) => (
                    <SelectItem key={marketplace.code} value={marketplace.code}>
                      {marketplace.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <aside
              className="rounded-md border border-border bg-muted/40 p-3"
              aria-labelledby={`${sampleHintId}-title`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p
                    id={`${sampleHintId}-title`}
                    className="text-sm font-medium text-foreground"
                  >
                    {t("import.sample_title")}
                  </p>
                  <p id={sampleHintId} className="text-xs text-muted-foreground">
                    {t("import.download_sample_hint")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 self-start"
                  asChild
                >
                  <a
                    href={ORDER_IMPORT_SAMPLE_HREF}
                    download={ORDER_IMPORT_SAMPLE_FILENAME}
                    aria-label={t("import.download_sample_aria")}
                    aria-describedby={sampleHintId}
                  >
                    <Download data-icon="inline-start" aria-hidden />
                    {t("import.download_sample")}
                  </a>
                </Button>
              </div>
            </aside>

            <div className="space-y-1.5">
              <Label
                className="text-xs text-muted-foreground"
                htmlFor="order-import-file"
              >
                {t("import.file_label")}
              </Label>
              <input
                ref={fileInputRef}
                id="order-import-file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
                disabled={isBusy}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                aria-describedby="order-import-file-hint"
              >
                <FileSpreadsheet data-icon="inline-start" aria-hidden />
                <span className="truncate">
                  {selectedFile?.name ?? t("import.file_placeholder")}
                </span>
              </Button>
              <p id="order-import-file-hint" className="text-xs text-muted-foreground">
                {t("import.file_hint")}
              </p>
            </div>

            <AuthFormError message={validationError} />
            <AuthFormError message={mutationError} />

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isBusy}>
                {t("import.close")}
              </Button>
              <Button
                onClick={handlePreview}
                disabled={isBusy || stores.length === 0}
              >
                {previewMutation.isPending ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <FileSpreadsheet data-icon="inline-start" />
                )}
                {previewMutation.isPending
                  ? t("import.previewing")
                  : t("import.preview")}
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    {preview ? (
      <OrderImportExcelRowsDialog
        open={excelRowsPreview != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setExcelRowsPreview(null)
          }
        }}
        storeId={parsedStoreId}
        batchId={preview.batchId}
        previewOrderId={excelRowsPreview?.id ?? null}
        externalOrderId={excelRowsPreview?.externalOrderId ?? null}
      />
    ) : null}
    </>
  )
}
