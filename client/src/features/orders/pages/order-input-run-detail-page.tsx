import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  Check,
  Info,
  Loader2,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { StatusBadge } from "@/components/common/status-badge"
import type { StatusBadgeVariant } from "@/components/common/status-badge"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { OrderImportDialog } from "@/features/orders/components/order-import-dialog"
import { OrdersFilters } from "@/features/orders/components/orders-filters"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  SERVICE_FEE_SAMPLE_FILENAME,
  SERVICE_FEE_SAMPLE_HREF,
  SHIPPING_FEE_SAMPLE_FILENAME,
  SHIPPING_FEE_SAMPLE_HREF,
} from "@/features/orders/constants/order-import-sample"
import {
  DEFAULT_WITHDRAW_ROWS_FILTERS,
  WithdrawRowsFilters,
  type WithdrawRowsFiltersState,
} from "@/features/orders/components/withdraw-rows-filters"
import {
  DEFAULT_ORDER_FILTERS,
  type OrderFiltersState,
} from "@/features/orders/types/order-filters"
import { mapOrderDtoToOrder } from "@/features/orders/util/map-order"
import type { MarketplaceCode } from "@/features/stores/config/marketplaces"
import type { ApiOrderStatus } from "@/shared/services/order.service"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { getPaginationMeta } from "@/shared/hooks/use-pagination"
import {
  getOrderInputRunErrorMessage,
  useCancelOrderInputRunPreviewMutation,
  useFinishOrderInputRunMutation,
  useOrderInputRunDetailQuery,
  useUpdateOrderInputRunTitleMutation,
  useOrderInputRunWithdrawRowsQuery,
  useResetStuckOrderInputRunMutation,
  useRunOrderInputWithdrawMutation,
  useRollbackOrderInputOrderDetailMutation,
  useRollbackOrderInputWithdrawMutation,
  useDeleteOrderInputRunMutation,
  useDownloadOrderInputFileMutation,
  useStartOrderInputRunPreviewMutation,
  useUploadOrderInputOrderDetailMutation,
  useUploadOrderInputWithdrawMutation,
} from "@/shared/queries/order-input-run.query"
import {
  getOrderErrorMessage,
  useOrdersPageQuery,
} from "@/shared/queries/order.query"
import type { ApiOrderImportPreviewBatchDto } from "@/shared/services/order.service"
import type {
  ApiOrderInputFileStatus,
  ApiOrderInputFileType,
  ApiOrderInputRunStatus,
} from "@/shared/services/order-input-run.service"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatDateTime, formatNumber } from "@/util/format"
import { getColumnFilterValue } from "@/util/table-column-filters"
import { sortingToPageSort } from "@/util/table-sort"

const RUN_STATUS_BADGE: Record<ApiOrderInputRunStatus, StatusBadgeVariant> = {
  DRAFT: "pending",
  RUNNING: "pending",
  COMPLETED: "synced",
  PARTIAL: "pending",
  FAILED: "failed",
}

const FILE_STATUS_BADGE: Record<ApiOrderInputFileStatus, StatusBadgeVariant> = {
  MISSING: "pending",
  READY: "synced",
  RUNNING: "pending",
  SUCCEEDED: "synced",
  FAILED: "failed",
  PARTIAL: "pending",
}

const ORDER_SORT_FIELD_MAP: Record<string, string> = {
  orderId: "externalOrderId",
  orderDate: "orderDate",
  storeName: "store.name",
  customer: "customer.name",
  totalAmount: "totalAmount",
}

function canRunFile(status: ApiOrderInputFileStatus) {
  return (
    status === "READY" ||
    status === "FAILED" ||
    status === "PARTIAL"
  )
}

function canDownloadInputFile(
  filename: string | null,
  status: ApiOrderInputFileStatus
): boolean {
  return status !== "MISSING" && filename != null
}

export function OrderInputRunDetailPage() {
  const { t } = useTranslation("orders")
  const navigate = useNavigate()
  const { inputRunId } = useParams<{ inputRunId: string }>()
  const id = Number(inputRunId)
  const locale = useLocaleStore((state) => state.locale)

  const orderDetailInputRef = useRef<HTMLInputElement>(null)
  const withdrawInputRef = useRef<HTMLInputElement>(null)

  const detailQuery = useOrderInputRunDetailQuery(
    Number.isFinite(id) && id > 0 ? id : null
  )
  const uploadOrderDetail = useUploadOrderInputOrderDetailMutation()
  const uploadWithdraw = useUploadOrderInputWithdrawMutation()
  const downloadInputFileMutation = useDownloadOrderInputFileMutation()
  const startPreviewMutation = useStartOrderInputRunPreviewMutation()
  const cancelPreviewMutation = useCancelOrderInputRunPreviewMutation()
  const finishRunMutation = useFinishOrderInputRunMutation()
  const runWithdrawMutation = useRunOrderInputWithdrawMutation()
  const rollbackOrderDetailMutation = useRollbackOrderInputOrderDetailMutation()
  const rollbackWithdrawMutation = useRollbackOrderInputWithdrawMutation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const deleteSetMutation = useDeleteOrderInputRunMutation()
  const [rollbackTarget, setRollbackTarget] = useState<"orderDetail" | "withdraw" | null>(null)
  const resetStuckMutation = useResetStuckOrderInputRunMutation()
  const didAutoResetStuck = useRef(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState("")
  const [editTitleError, setEditTitleError] = useState("")
  const updateTitleMutation = useUpdateOrderInputRunTitleMutation()

  const handleSaveTitle = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = editTitleValue.trim()
    if (!trimmed) {
      setEditTitleError("Title cannot be empty.")
      return
    }
    updateTitleMutation.mutate(
      { id, title: trimmed },
      {
        onSuccess: () => {
          setIsEditingTitle(false)
          setEditTitleError("")
        },
        onError: (err) => {
          setEditTitleError(err.message || "Failed to update title.")
        },
      }
    )
  }

  const [localError, setLocalError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBatch, setPreviewBatch] =
    useState<ApiOrderImportPreviewBatchDto | null>(null)

  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersLimit, setOrdersLimit] = useState(20)
  const [withdrawPage, setWithdrawPage] = useState(1)
  const [withdrawLimit, setWithdrawLimit] = useState(20)
  const [orderFilters, setOrderFilters] =
    useState<OrderFiltersState>(DEFAULT_ORDER_FILTERS)
  const [withdrawFilters, setWithdrawFilters] =
    useState<WithdrawRowsFiltersState>(DEFAULT_WITHDRAW_ROWS_FILTERS)
  const [withdrawSorting, setWithdrawSorting] = useState<SortingState>([
    { id: "excelRowIndex", desc: false },
  ])

  const [orderSorting, setOrderSorting] = useState<SortingState>([])
  const [orderColumnFilters, setOrderColumnFilters] =
    useState<ColumnFiltersState>([])
  const debouncedOrderColumnFilters = useDebounce(orderColumnFilters)
  const debouncedOrderSearch = useDebounce(orderFilters.search)
  const debouncedWithdrawSearch = useDebounce(withdrawFilters.search)

  const run = detailQuery.data
  const inputFileType: ApiOrderInputFileType = run?.inputFileType ?? "SHIPPING_FEE"
  const isShippingFeeInput = inputFileType === "SHIPPING_FEE"

  const isLocallyRunning =
    startPreviewMutation.isPending ||
    finishRunMutation.isPending ||
    runWithdrawMutation.isPending ||
    rollbackOrderDetailMutation.isPending ||
    rollbackWithdrawMutation.isPending ||
    previewOpen
  const isStuckRunning =
    run != null &&
    !isLocallyRunning &&
    !resetStuckMutation.isPending &&
    (run.status === "RUNNING" ||
      run.orderDetailStatus === "RUNNING" ||
      run.withdrawStatus === "RUNNING")

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-reset once when stuck status is loaded
  }, [
    run?.id,
    run?.status,
    run?.orderDetailStatus,
    run?.withdrawStatus,
    isLocallyRunning,
  ])

  const displayStatus: ApiOrderInputRunStatus = isLocallyRunning
    ? "RUNNING"
    : (run?.status ?? "DRAFT")
  const displayOrderDetailStatus: ApiOrderInputFileStatus =
    startPreviewMutation.isPending || previewOpen
      ? "RUNNING"
      : (run?.orderDetailStatus ?? "MISSING")
  const displayWithdrawStatus: ApiOrderInputFileStatus = runWithdrawMutation.isPending
    ? "RUNNING"
    : (run?.withdrawStatus ?? "MISSING")

  const importFileId = run?.orderDetailImportFileId ?? null
  const showWithdrawRows =
    run != null &&
    isShippingFeeInput === false &&
    !runWithdrawMutation.isPending &&
    (run.withdrawStatus === "SUCCEEDED" ||
      run.withdrawStatus === "PARTIAL" ||
      run.withdrawStatus === "FAILED")

  const orderPageSort = useMemo(
    () => sortingToPageSort(orderSorting, ORDER_SORT_FIELD_MAP),
    [orderSorting]
  )
  const columnOrderId = useMemo(
    () => getColumnFilterValue(debouncedOrderColumnFilters, "orderId"),
    [debouncedOrderColumnFilters]
  )

  const ordersPageRequest = useMemo(() => {
    const filter: {
      sourceType: "IMPORT"
      sourceId?: number
      externalOrderId?: string
      orderStatus?: ApiOrderStatus
    } = { sourceType: "IMPORT" }

    if (importFileId != null) {
      filter.sourceId = importFileId
    }

    const orderSearch = columnOrderId || debouncedOrderSearch.trim()
    if (orderSearch) {
      filter.externalOrderId = orderSearch
    }
    if (orderFilters.orderStatus !== "all") {
      filter.orderStatus = orderFilters.orderStatus as ApiOrderStatus
    }

    return {
      pageNumber: ordersPage,
      pageSize: ordersLimit,
      ...orderPageSort,
      filter,
    }
  }, [
    columnOrderId,
    debouncedOrderSearch,
    importFileId,
    orderFilters.orderStatus,
    orderPageSort,
    ordersLimit,
    ordersPage,
  ])

  const ordersQuery = useOrdersPageQuery(
    ordersPageRequest,
    isShippingFeeInput && importFileId != null
  )

  const withdrawRowsFilter = useMemo(() => {
    const sort = withdrawSorting[0]
    const filter: {
      externalOrderId?: string
      matchStatus?: string
      applyStatus?: string
      sortBy?: string
      sortOrder?: "ASC" | "DESC"
    } = {
      sortBy: sort?.id ?? "excelRowIndex",
      sortOrder: sort?.desc ? "DESC" : "ASC",
    }
    const search = debouncedWithdrawSearch.trim()
    if (search) {
      filter.externalOrderId = search
    }
    if (withdrawFilters.matchStatus !== "all") {
      filter.matchStatus = withdrawFilters.matchStatus
    }
    if (withdrawFilters.applyStatus !== "all") {
      filter.applyStatus = withdrawFilters.applyStatus
    }
    return filter
  }, [
    debouncedWithdrawSearch,
    withdrawFilters.applyStatus,
    withdrawFilters.matchStatus,
    withdrawSorting,
  ])

  const withdrawRowsQuery = useOrderInputRunWithdrawRowsQuery(
    showWithdrawRows ? id : null,
    withdrawPage,
    withdrawLimit,
    withdrawRowsFilter,
    showWithdrawRows
  )

  const isBusy =
    uploadOrderDetail.isPending ||
    uploadWithdraw.isPending ||
    startPreviewMutation.isPending ||
    finishRunMutation.isPending ||
    cancelPreviewMutation.isPending ||
    runWithdrawMutation.isPending ||
    resetStuckMutation.isPending ||
    previewOpen ||
    isStuckRunning ||
    run?.status === "RUNNING"

  const mutationError = useMemo(() => {
    const err =
      (uploadOrderDetail.isError && uploadOrderDetail.error) ||
      (uploadWithdraw.isError && uploadWithdraw.error) ||
      (startPreviewMutation.isError && startPreviewMutation.error) ||
      (finishRunMutation.isError && finishRunMutation.error) ||
      (runWithdrawMutation.isError && runWithdrawMutation.error) ||
      (rollbackOrderDetailMutation.isError && rollbackOrderDetailMutation.error) ||
      (rollbackWithdrawMutation.isError && rollbackWithdrawMutation.error) ||
      (detailQuery.isError && detailQuery.error) ||
      null
    return err
      ? getOrderInputRunErrorMessage(err, t("inputs.errors.load_failed"))
      : null
  }, [
    uploadOrderDetail.isError,
    uploadOrderDetail.error,
    uploadWithdraw.isError,
    uploadWithdraw.error,
    startPreviewMutation.isError,
    startPreviewMutation.error,
    finishRunMutation.isError,
    finishRunMutation.error,
    runWithdrawMutation.isError,
    runWithdrawMutation.error,
    rollbackOrderDetailMutation.isError,
    rollbackOrderDetailMutation.error,
    rollbackWithdrawMutation.isError,
    rollbackWithdrawMutation.error,
    detailQuery.isError,
    detailQuery.error,
    t,
  ])

  const orders = useMemo(
    () => (ordersQuery.data?.data ?? []).map(mapOrderDtoToOrder),
    [ordersQuery.data?.data]
  )
  const ordersTotal = ordersQuery.data?.meta?.totalElements ?? 0
  const ordersMeta = getPaginationMeta(ordersPage, ordersLimit, ordersTotal)
  const ordersError =
    ordersQuery.isError && ordersQuery.error
      ? getOrderErrorMessage(ordersQuery.error, t("errors.load_failed"))
      : null

  const withdrawRows = withdrawRowsQuery.data?.data ?? []
  const withdrawTotal = withdrawRowsQuery.data?.meta?.totalElements ?? 0
  const withdrawMeta = getPaginationMeta(
    withdrawPage,
    withdrawLimit,
    withdrawTotal
  )

  const isRunCompleted = run?.status === "COMPLETED"

  const canRunOrderDetail =
    run != null &&
    !isBusy &&
    canRunFile(run.orderDetailStatus) &&
    run.orderDetailFilename != null
  const canRunWithdraw =
    run != null &&
    !isBusy &&
    canRunFile(run.withdrawStatus) &&
    run.withdrawFilename != null
  const canRunActiveFile = isShippingFeeInput ? canRunOrderDetail : canRunWithdraw
  const canRollbackOrderDetail =
    run != null &&
    !isBusy &&
    (run.orderDetailStatus !== "MISSING" || run.orderDetailFilename != null)
  const canRollbackWithdraw =
    run != null &&
    !isBusy &&
    (run.withdrawStatus !== "MISSING" || run.withdrawFilename != null)

  const startOrderDetailPreview = () => {
    if (!run) {
      return
    }
    setLocalError(null)
    if (!canRunOrderDetail) {
      setLocalError(t("inputs.errors.order_detail_required"))
      return
    }
    startPreviewMutation.mutate(run.id, {
      onSuccess: (preview) => {
        setPreviewBatch(preview)
        setPreviewOpen(true)
      },
    })
  }

  const handleRunWithdraw = () => {
    if (!run) {
      return
    }
    setLocalError(null)
    if (!canRunWithdraw) {
      setLocalError(t("inputs.errors.withdraw_required"))
      return
    }
    runWithdrawMutation.mutate(run.id)
  }

  const handleDownloadInputFile = (fallbackFilename: string) => {
    if (!run) {
      return
    }
    setLocalError(null)
    downloadInputFileMutation.mutate(
      { id: run.id, fallbackFilename },
      {
        onError: (err) => {
          setLocalError(
            getOrderInputRunErrorMessage(err, t("inputs.detail.download_failed"))
          )
        },
      }
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("inputs.detail.loading")}
      </div>
    )
  }

  if (!run) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <AuthFormError message={mutationError ?? t("inputs.errors.not_found")} />
        <Button variant="outline" asChild>
          <Link to={ROUTES.dashboard.orderInputs}>{t("inputs.back")}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="px-0" asChild>
            <Link to={ROUTES.dashboard.orderInputs}>{t("inputs.back")}</Link>
          </Button>
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-1.5 pt-1">
              <Input
                value={editTitleValue}
                onChange={(e) => {
                  setEditTitleValue(e.target.value)
                  setEditTitleError("")
                }}
                placeholder="Order set title..."
                className={`h-8 w-64 font-semibold text-sm rounded-none ${
                  editTitleError
                    ? "border-destructive text-destructive focus-visible:ring-destructive"
                    : "text-foreground"
                }`}
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                disabled={updateTitleMutation.isPending}
                className="h-8 px-2.5 text-xs rounded-none bg-primary text-primary-foreground"
                title="Save title"
              >
                {updateTitleMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs rounded-none"
                onClick={() => {
                  setIsEditingTitle(false)
                  setEditTitleError("")
                }}
                title="Cancel"
              >
                <X className="size-3.5" />
              </Button>
              {editTitleError && (
                <span className="text-xs font-medium text-destructive">
                  {editTitleError}
                </span>
              )}
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                {run.title}
              </h1>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTitle(true)
                  setEditTitleValue(run.title)
                  setEditTitleError("")
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                title="Edit Name"
              >
                <Pencil className="size-3.5" />
                <span className="underline decoration-dotted">Edit</span>
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{run.storeName ?? "—"}</span>
            <span>·</span>
            <span>{run.marketplaceCode ?? "—"}</span>
            <span>·</span>
            <span>
              {t(`inputs.input_file_type.${inputFileType === "SHIPPING_FEE" ? "shipping_fee" : "service_fee"}`)}
            </span>
            <StatusBadge
              status={RUN_STATUS_BADGE[displayStatus]}
              label={t(`inputs.status.${displayStatus.toLowerCase()}`)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isBusy || deleteSetMutation.isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            {deleteSetMutation.isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Trash2 data-icon="inline-start" />
            )}
            {t("inputs.detail.delete_set")}
          </Button>
          <Button
            onClick={() => {
              if (!canRunActiveFile) {
                setLocalError(
                  isShippingFeeInput
                    ? t("inputs.errors.order_detail_required")
                    : t("inputs.errors.withdraw_required")
                )
                return
              }
              if (isShippingFeeInput) {
                startOrderDetailPreview()
              } else {
                handleRunWithdraw()
              }
            }}
            disabled={!canRunActiveFile || isBusy}
          >
            {startPreviewMutation.isPending ||
            finishRunMutation.isPending ||
            runWithdrawMutation.isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Play data-icon="inline-start" />
            )}
            {startPreviewMutation.isPending ||
            finishRunMutation.isPending ||
            runWithdrawMutation.isPending
              ? t("inputs.running")
              : t("inputs.run_file")}
          </Button>
        </div>
      </div>

      <AuthFormError message={localError} />
      <AuthFormError message={mutationError} />

      {isStuckRunning || resetStuckMutation.isPending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          <p className="text-warning-foreground">
            {t("inputs.detail.stuck_running")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resetStuckMutation.isPending}
            onClick={() => resetStuckMutation.mutate(run.id)}
          >
            {resetStuckMutation.isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : null}
            {t("inputs.detail.reset_stuck")}
          </Button>
        </div>
      ) : null}

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
      <div className="grid gap-4 md:grid-cols-1">
        {isShippingFeeInput ? (
          <FileUploadCard
            title={t("inputs.detail.order_detail_title")}
            description={t("inputs.detail.order_detail_description")}
            filename={run.orderDetailFilename}
            status={displayOrderDetailStatus}
            error={
              startPreviewMutation.isPending || previewOpen
                ? null
                : run.orderDetailError
            }
            inputRef={orderDetailInputRef}
            disabled={isBusy}
            sampleHref={SHIPPING_FEE_SAMPLE_HREF}
            sampleFilename={SHIPPING_FEE_SAMPLE_FILENAME}
            onPick={() => orderDetailInputRef.current?.click()}
            onFile={(file) => uploadOrderDetail.mutate({ id: run.id, file })}
            uploading={uploadOrderDetail.isPending}
            canRun={canRunOrderDetail}
            running={startPreviewMutation.isPending || previewOpen}
            onRun={() => startOrderDetailPreview()}
            canRollback={canRollbackOrderDetail}
            rollingBack={rollbackOrderDetailMutation.isPending}
            onRollback={() => setRollbackTarget("orderDetail")}
            completed={isRunCompleted}
            canDownload={canDownloadInputFile(
              run.orderDetailFilename,
              displayOrderDetailStatus
            )}
            downloading={downloadInputFileMutation.isPending}
            onDownload={() =>
              handleDownloadInputFile(run.orderDetailFilename ?? "order-detail.xlsx")
            }
            t={t}
          />
        ) : (
          <FileUploadCard
            title={t("inputs.detail.withdraw_title")}
            description={t("inputs.detail.withdraw_description")}
            filename={run.withdrawFilename}
            status={displayWithdrawStatus}
            error={runWithdrawMutation.isPending ? null : run.withdrawError}
            inputRef={withdrawInputRef}
            disabled={isBusy}
            sampleHref={SERVICE_FEE_SAMPLE_HREF}
            sampleFilename={SERVICE_FEE_SAMPLE_FILENAME}
            onPick={() => withdrawInputRef.current?.click()}
            onFile={(file) => uploadWithdraw.mutate({ id: run.id, file })}
            uploading={uploadWithdraw.isPending}
            canRun={canRunWithdraw}
            running={runWithdrawMutation.isPending}
            onRun={handleRunWithdraw}
            canRollback={canRollbackWithdraw}
            rollingBack={rollbackWithdrawMutation.isPending}
            onRollback={() => setRollbackTarget("withdraw")}
            completed={isRunCompleted}
            canDownload={canDownloadInputFile(
              run.withdrawFilename,
              displayWithdrawStatus
            )}
            downloading={downloadInputFileMutation.isPending}
            onDownload={() =>
              handleDownloadInputFile(run.withdrawFilename ?? "service-fee.xlsx")
            }
            t={t}
          />
        )}
      </div>

      <div className="space-y-4">
        {isShippingFeeInput ? (
          <div role="tabpanel" className="space-y-3">
            {importFileId == null ? (
              <p className="rounded-md border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {t("inputs.detail.orders_empty")}
              </p>
            ) : (
              <>
                <OrdersFilters
                  stores={[]}
                  value={orderFilters}
                  onChange={(next) => {
                    setOrderFilters(next)
                    setOrdersPage(1)
                  }}
                  hideStoreFilter
                  hideSourceFilter
                />
                <AuthFormError message={ordersError} />
                <OrdersTable
                  orders={orders}
                  isLoading={ordersQuery.isLoading}
                  page={ordersPage}
                  totalPages={ordersMeta.totalPages}
                  totalCount={ordersTotal}
                  start={ordersMeta.start}
                  end={ordersMeta.end}
                  limit={ordersLimit}
                  canGoPrev={ordersMeta.canGoPrev}
                  canGoNext={ordersMeta.canGoNext}
                  onPageChange={setOrdersPage}
                  onLimitChange={(nextLimit) => {
                    setOrdersLimit(nextLimit)
                    setOrdersPage(1)
                  }}
                  sorting={orderSorting}
                  onSortingChange={(next) => {
                    setOrderSorting(next)
                    setOrdersPage(1)
                  }}
                  columnFilters={orderColumnFilters}
                  onColumnFiltersChange={(next) => {
                    setOrderColumnFilters(next)
                    setOrdersPage(1)
                  }}
                />
                {!ordersQuery.isLoading && ordersTotal === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("inputs.detail.orders_none")}
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <div role="tabpanel" className="space-y-3">
            {(run.withdrawMatchedCount != null ||
              run.withdrawRowCount != null) && (
              <p className="text-sm text-muted-foreground">
                {t("inputs.detail.withdraw_summary", {
                  rows: formatNumber(run.withdrawRowCount ?? 0, locale),
                  matched: formatNumber(run.withdrawMatchedCount ?? 0, locale),
                  unmatched: formatNumber(
                    run.withdrawUnmatchedCount ?? 0,
                    locale
                  ),
                })}
              </p>
            )}

            {!showWithdrawRows ? (
              <p className="rounded-md border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                {t("inputs.detail.withdraw_not_ready")}
              </p>
            ) : (
              <>
                <WithdrawRowsFilters
                  value={withdrawFilters}
                  onChange={(next) => {
                    setWithdrawFilters(next)
                    setWithdrawPage(1)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t("inputs.detail.match_apply_hint")}
                </p>
                <div className="overflow-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <WithdrawSortHeader
                            label={t("inputs.detail.col_no")}
                            columnId="excelRowIndex"
                            sorting={withdrawSorting}
                            onSortingChange={(next) => {
                              setWithdrawSorting(next)
                              setWithdrawPage(1)
                            }}
                          />
                        </TableHead>
                        <TableHead>
                          <WithdrawSortHeader
                            label={t("inputs.detail.col_order_id")}
                            columnId="externalOrderId"
                            sorting={withdrawSorting}
                            onSortingChange={(next) => {
                              setWithdrawSorting(next)
                              setWithdrawPage(1)
                            }}
                          />
                        </TableHead>
                        <TableHead>
                          <WithdrawSortHeader
                            label={t("inputs.detail.col_amount")}
                            columnId="withdrawAmount"
                            sorting={withdrawSorting}
                            onSortingChange={(next) => {
                              setWithdrawSorting(next)
                              setWithdrawPage(1)
                            }}
                          />
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <WithdrawSortHeader
                              label={t("inputs.detail.col_fees")}
                              columnId="totalFees"
                              sorting={withdrawSorting}
                              onSortingChange={(next) => {
                                setWithdrawSorting(next)
                                setWithdrawPage(1)
                              }}
                            />
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                                    aria-label="Information about Total Fees"
                                  >
                                    <Info className="size-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center" className="max-w-xs p-3 text-xs leading-relaxed bg-popover text-popover-foreground border border-border shadow-xl rounded-md">
                                  <div className="space-y-1.5 text-left font-sans">
                                    <p className="font-semibold text-foreground border-b border-border/50 pb-1">
                                      Total Platform Deductions & Fees
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Total marketplace deductions extracted from the Service fee / Payout report:
                                    </p>
                                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-muted-foreground">
                                      <li>TikTok Shop Commission & Transaction fees</li>
                                      <li>Affiliate commissions & Ads deductions</li>
                                      <li>Platform program fees & shipping subsidies</li>
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableHead>
                        <TableHead>
                          <WithdrawSortHeader
                            label={t("inputs.detail.col_adjustments")}
                            columnId="totalAdjustments"
                            sorting={withdrawSorting}
                            onSortingChange={(next) => {
                              setWithdrawSorting(next)
                              setWithdrawPage(1)
                            }}
                          />
                        </TableHead>
                        <TableHead>
                          <WithdrawSortHeader
                            label={t("inputs.detail.col_match")}
                            columnId="matchStatus"
                            sorting={withdrawSorting}
                            onSortingChange={(next) => {
                              setWithdrawSorting(next)
                              setWithdrawPage(1)
                            }}
                          />
                        </TableHead>
                        <TableHead>
                          <WithdrawSortHeader
                            label={t("inputs.detail.col_apply")}
                            columnId="applyStatus"
                            sorting={withdrawSorting}
                            onSortingChange={(next) => {
                              setWithdrawSorting(next)
                              setWithdrawPage(1)
                            }}
                          />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-8 text-center text-muted-foreground"
                          >
                            {withdrawRowsQuery.isLoading
                              ? t("inputs.detail.loading")
                              : t("inputs.detail.withdraw_rows_empty")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        withdrawRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.excelRowIndex ?? "—"}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {row.orderId ? (
                                <Link
                                  to={ROUTES.dashboard.orderDetail(
                                    String(row.orderId)
                                  )}
                                  className="text-primary underline-offset-4 hover:underline"
                                >
                                  {row.externalOrderId}
                                </Link>
                              ) : (
                                (row.externalOrderId ?? "—")
                              )}
                            </TableCell>
                            <TableCell>
                              {row.withdrawAmount != null
                                ? formatCurrency(
                                    row.withdrawAmount,
                                    locale,
                                    row.currency ?? "THB"
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {row.totalFees != null
                                ? formatCurrency(
                                    row.totalFees,
                                    locale,
                                    row.currency ?? "THB"
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {row.adjustmentAmount != null
                                ? formatCurrency(
                                    row.adjustmentAmount,
                                    locale,
                                    row.currency ?? "THB"
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {t(
                                `inputs.match.${row.matchStatus.toLowerCase()}`
                              )}
                            </TableCell>
                            <TableCell>
                              {t(
                                `inputs.apply.${row.applyStatus.toLowerCase()}`
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {withdrawTotal > 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {t("inputs.table.showing", {
                        start: withdrawMeta.start,
                        end: withdrawMeta.end,
                        total: withdrawTotal,
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!withdrawMeta.canGoPrev}
                        onClick={() => setWithdrawPage(withdrawPage - 1)}
                      >
                        {t("inputs.detail.prev")}
                      </Button>
                      <span>
                        {withdrawPage}/{Math.max(withdrawMeta.totalPages, 1)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!withdrawMeta.canGoNext}
                        onClick={() => setWithdrawPage(withdrawPage + 1)}
                      >
                        {t("inputs.detail.next")}
                      </Button>
                      <SelectPageSize
                        limit={withdrawLimit}
                        setLimit={setWithdrawLimit}
                        setPage={setWithdrawPage}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={rollbackTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setRollbackTarget(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rollbackTarget === "orderDetail"
                ? t("inputs.detail.rollback_order_detail_title")
                : t("inputs.detail.rollback_withdraw_title")}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground pt-2">
              {rollbackTarget === "orderDetail"
                ? t("inputs.detail.rollback_order_detail_description")
                : t("inputs.detail.rollback_withdraw_description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                rollbackOrderDetailMutation.isPending ||
                rollbackWithdrawMutation.isPending
              }
              onClick={() => setRollbackTarget(null)}
            >
              {t("inputs.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={
                rollbackOrderDetailMutation.isPending ||
                rollbackWithdrawMutation.isPending
              }
              onClick={async () => {
                if (!run) return
                if (rollbackTarget === "orderDetail") {
                  await rollbackOrderDetailMutation.mutateAsync(run.id)
                } else if (rollbackTarget === "withdraw") {
                  await rollbackWithdrawMutation.mutateAsync(run.id)
                }
                setRollbackTarget(null)
              }}
            >
              {rollbackOrderDetailMutation.isPending ||
              rollbackWithdrawMutation.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <RotateCcw data-icon="inline-start" />
              )}
              {t("inputs.detail.rollback_confirm_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deleteSetMutation.isPending) {
            setDeleteDialogOpen(false)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inputs.detail.delete_set_title")}</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground pt-2">
              {t("inputs.detail.delete_set_description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleteSetMutation.isPending}
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteSetMutation.isPending}
              onClick={async () => {
                try {
                  await deleteSetMutation.mutateAsync(run.id)
                  navigate(ROUTES.dashboard.orderInputs)
                } catch (err: unknown) {
                  setLocalError(
                    getOrderInputRunErrorMessage(
                      err,
                      t("inputs.errors.load_failed")
                    )
                  )
                  setDeleteDialogOpen(false)
                }
              }}
            >
              {deleteSetMutation.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Trash2 data-icon="inline-start" />
              )}
              {t("inputs.detail.delete_set_confirm_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground">
        {t("inputs.detail.updated_at", {
          value: formatDateTime(run.updatedAt, locale),
        })}
      </p>
    </div>
  )
}

interface WithdrawSortHeaderProps {
  label: string
  columnId: string
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}

function WithdrawSortHeader({
  label,
  columnId,
  sorting,
  onSortingChange,
}: WithdrawSortHeaderProps) {
  const current = sorting[0]
  const isActive = current?.id === columnId
  const isDesc = isActive && current.desc

  return (
    <button
      type="button"
      className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase hover:bg-muted hover:text-foreground"
      onClick={() => {
        if (!isActive) {
          onSortingChange([{ id: columnId, desc: false }])
          return
        }
        if (!isDesc) {
          onSortingChange([{ id: columnId, desc: true }])
          return
        }
        onSortingChange([{ id: "excelRowIndex", desc: false }])
      }}
    >
      <span>{label}</span>
      {isActive ? (
        isDesc ? (
          <ArrowDown className="size-3.5" />
        ) : (
          <ArrowUp className="size-3.5" />
        )
      ) : (
        <ChevronsUpDown className="size-3.5" />
      )}
    </button>
  )
}

interface FileUploadCardProps {
  title: string
  description: string
  filename: string | null
  status: ApiOrderInputFileStatus
  error: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  disabled: boolean
  uploading: boolean
  canRun: boolean
  running: boolean
  sampleHref?: string
  sampleFilename?: string
  onPick: () => void
  onFile: (file: File) => void
  onRun: () => void
  canRollback?: boolean
  rollingBack?: boolean
  onRollback?: () => void
  /** When true, hide uploaded filename and sample download (completed run). */
  completed?: boolean
  canDownload?: boolean
  downloading?: boolean
  onDownload?: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

function FileUploadCard({
  title,
  description,
  filename,
  status,
  error,
  inputRef,
  disabled,
  uploading,
  canRun,
  running,
  sampleHref,
  sampleFilename,
  onPick,
  onFile,
  onRun,
  canRollback,
  rollingBack,
  onRollback,
  completed = false,
  canDownload = false,
  downloading = false,
  onDownload,
  t,
}: FileUploadCardProps) {
  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <StatusBadge
          status={FILE_STATUS_BADGE[status]}
          label={t(`inputs.file_status.${status.toLowerCase()}`)}
        />
      </div>
      {!completed ? (
        <p className="truncate text-sm">
          {filename ? (
            <span className="inline-flex items-center gap-1.5">
              <FileSpreadsheet className="size-4 text-muted-foreground" />
              {filename}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {t("inputs.detail.no_file")}
            </span>
          )}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive break-words">{error}</p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onFile(file)
          }
          event.target.value = ""
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onPick}
        >
          {uploading ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <FileSpreadsheet data-icon="inline-start" />
          )}
          {uploading ? t("inputs.detail.uploading") : t("inputs.detail.upload")}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canRun || disabled}
          onClick={onRun}
        >
          {running ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Play data-icon="inline-start" />
          )}
          {running ? t("inputs.running") : t("inputs.run_file")}
        </Button>
        {canDownload && onDownload ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || downloading}
            onClick={onDownload}
          >
            {downloading ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Download data-icon="inline-start" aria-hidden />
            )}
            {downloading
              ? t("inputs.detail.downloading_file")
              : t("inputs.detail.download_file")}
          </Button>
        ) : null}
        {sampleHref && !completed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={sampleHref}
              download={sampleFilename}
              aria-label={t("inputs.detail.download_sample")}
            >
              <Download data-icon="inline-start" aria-hidden />
              {t("inputs.detail.download_sample")}
            </a>
          </Button>
        ) : null}
        {canRollback ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || rollingBack}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            onClick={onRollback}
          >
            {rollingBack ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <RotateCcw data-icon="inline-start" />
            )}
            {t("inputs.detail.rollback_btn")}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function SelectPageSize({
  limit,
  setLimit,
  setPage,
}: {
  limit: number
  setLimit: (n: number) => void
  setPage: (n: number) => void
}) {
  return (
    <select
      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
      value={limit}
      onChange={(event) => {
        setLimit(Number(event.target.value))
        setPage(1)
      }}
    >
      {[10, 20, 50].map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  )
}

