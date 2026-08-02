import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { EMPTY_TABLE_SELECTION } from "@/components/common/data-table/types"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { InvoiceExportPreviewDialog } from "@/features/invoices/components/invoice-export-preview-dialog"
import { InvoicesFilters } from "@/features/invoices/components/invoices-filters"
import { InvoicesHeader } from "@/features/invoices/components/invoices-header"
import { InvoicesStatCards } from "@/features/invoices/components/invoices-stat-cards"
import { InvoicesTable } from "@/features/invoices/components/invoices-table"
import type { InvoiceListItem, InvoiceStatus } from "@/features/invoices/types/invoice"
import { useExportSelection } from "@/shared/hooks/use-export-selection"
import {
  getPaginationMeta,
  usePagination,
} from "@/shared/hooks/use-pagination"
import { useRegisterListShortcuts } from "@/shared/hooks/use-register-list-shortcuts"
import {
  getInvoiceErrorMessage,
  useBulkDownloadInvoicesMutation,
  useInvoiceStatsQuery,
  useInvoicesPageQuery,
} from "@/shared/queries/invoice.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import type { InvoiceExportRequest } from "@/shared/services/invoice.service"

const STORES_LIST_REQUEST = {
  pageNumber: 1,
  pageSize: 500,
  sortBy: "name",
  sortOrder: "ASC" as const,
}

const EMPTY_INVOICES: InvoiceListItem[] = []

export function InvoicesPage() {
  const { t } = useTranslation("invoices")
  const { page, limit, setPage, setLimit } = usePagination()
  const [storeId, setStoreId] = useState("")
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all")
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false)
  const [exportScope, setExportScope] = useState<
    Omit<InvoiceExportRequest, "pageNumber" | "pageSize" | "columns">
  >({ exportAll: false })

  const { data: storesResponse, isLoading: storesLoading } =
    useStoresPageQuery(STORES_LIST_REQUEST)
  const stores = Array.isArray(storesResponse?.data) ? storesResponse.data : []

  const exportFilter = useMemo(() => {
    const filter: InvoiceExportRequest["filter"] = {}

    if (status !== "all") {
      filter.status = status
    }

    if (storeId) {
      const parsedStoreId = Number(storeId)
      if (Number.isFinite(parsedStoreId) && parsedStoreId > 0) {
        filter.storeId = parsedStoreId
      }
    }

    return Object.keys(filter).length > 0 ? filter : undefined
  }, [status, storeId])

  const pageRequest = useMemo(() => {
    return {
      pageNumber: page,
      pageSize: limit,
      sortBy: "issuedAt",
      sortOrder: "DESC" as const,
      ...(exportFilter ? { filter: exportFilter } : {}),
    }
  }, [exportFilter, limit, page])

  const { data, isLoading, isError, error } = useInvoicesPageQuery(pageRequest)

  const statsStoreId = useMemo(() => {
    if (!storeId) {
      return undefined
    }
    const parsed = Number(storeId)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [storeId])

  const { data: stats } = useInvoiceStatsQuery(statsStoreId)

  const invoices = data?.data ?? EMPTY_INVOICES
  const totalCount = data?.meta?.totalElements ?? 0
  const { totalPages, start, end, canGoPrev, canGoNext } = getPaginationMeta(
    page,
    limit,
    totalCount
  )

  const {
    setSelection,
    confirmAction,
    closeConfirm,
    requestAction,
    actionError,
    setActionError,
  } = useExportSelection({ totalCount })

  const bulkMutation = useBulkDownloadInvoicesMutation()

  const loadError =
    isError && error
      ? getInvoiceErrorMessage(error, t("errors.load_failed"))
      : null

  const openExportPreview = useCallback(
    (scope: Omit<InvoiceExportRequest, "pageNumber" | "pageSize" | "columns">) => {
      setExportScope(scope)
      setExportPreviewOpen(true)
    },
    []
  )

  const runBulkDownload = useCallback(
    async (request: InvoiceExportRequest) => {
      try {
        await bulkMutation.mutateAsync(request)
      } catch (err) {
        setActionError(
          getInvoiceErrorMessage(err, t("errors.bulk_download_failed"))
        )
        throw err
      }
    },
    [bulkMutation, setActionError, t]
  )

  const handleExportCsv = useCallback(() => {
    const result = requestAction("export")
    if (result.kind === "need_selection") {
      setActionError(t("errors.select_to_export"))
      return
    }
    if (result.kind === "confirm_all") {
      openExportPreview({
        exportAll: true,
        filter: exportFilter,
      })
      closeConfirm()
      return
    }
    if (result.kind === "selected") {
      openExportPreview({
        ids: result.ids.map((id) => Number(id)).filter(Number.isFinite),
      })
    }
  }, [
    closeConfirm,
    exportFilter,
    openExportPreview,
    requestAction,
    setActionError,
    t,
  ])

  const handleClearSelection = useCallback(() => {
    setSelection(EMPTY_TABLE_SELECTION)
  }, [setSelection])

  useRegisterListShortcuts({
    onExport: handleExportCsv,
    onClearSelection: handleClearSelection,
  })

  const handleBulkDownload = () => {
    const result = requestAction("bulk")
    if (result.kind === "need_selection") {
      setActionError(t("errors.select_to_bulk_download"))
      return
    }
    if (result.kind === "selected") {
      void runBulkDownload({
        ids: result.ids.map((id) => Number(id)).filter(Number.isFinite),
      })
    }
  }

  const handleConfirmBulkAll = async () => {
    await runBulkDownload({
      exportAll: true,
      filter: exportFilter,
    })
  }

  return (
    <div className="space-y-6 p-6">
      <InvoicesHeader
        onExportCsv={handleExportCsv}
        onBulkDownload={handleBulkDownload}
        isBulkDownloading={bulkMutation.isPending}
      />
      <InvoiceExportPreviewDialog
        open={exportPreviewOpen}
        onOpenChange={setExportPreviewOpen}
        scope={exportScope}
      />
      <ConfirmDialog
        open={confirmAction === "bulk"}
        onOpenChange={(open) => {
          if (!open && !bulkMutation.isPending) {
            closeConfirm()
          }
        }}
        title={t("confirm.bulk_download_all.title")}
        description={t("confirm.bulk_download_all.description", {
          count: totalCount,
        })}
        confirmLabel={t("confirm.bulk_download_all.confirm")}
        cancelLabel={t("confirm.export_all.cancel")}
        onConfirm={handleConfirmBulkAll}
        isLoading={bulkMutation.isPending}
      />
      <InvoicesFilters
        stores={stores}
        storeId={storeId}
        onStoreChange={(next) => {
          setStoreId(next)
          setPage(1)
        }}
        status={status}
        onStatusChange={(next) => {
          setStatus(next)
          setPage(1)
        }}
        disabled={storesLoading}
      />
      <InvoicesStatCards
        stats={
          stats ?? {
            issuedCount: 0,
            voidedCount: 0,
            issuedGrandTotal: 0,
          }
        }
      />
      <AuthFormError message={loadError ?? actionError} />
      <InvoicesTable
        invoices={invoices}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        limit={limit}
        totalPages={totalPages}
        start={start}
        end={end}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSelectionChange={setSelection}
      />
    </div>
  )
}
