import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, X, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion"
import { useOrderBulkGenerateSubscription } from "@/shared/hooks/use-order-bulk-generate-subscription"
import {
  useBulkGenerateRunQuery,
  useDownloadBulkGenerateZipMutation,
} from "@/shared/queries/order.query"
import { useOrderBulkGenerateStore } from "@/shared/stores/order-bulk-generate-store"

export function OrderBulkGeneratePanel() {
  const { t } = useTranslation("orders")
  const prefersReducedMotion = useReducedMotion()

  const runId = useOrderBulkGenerateStore((state) => state.runId)
  const status = useOrderBulkGenerateStore((state) => state.status)
  const totalCount = useOrderBulkGenerateStore((state) => state.totalCount)
  const processedCount = useOrderBulkGenerateStore((state) => state.processedCount)
  const successCount = useOrderBulkGenerateStore((state) => state.successCount)
  const errorMessage = useOrderBulkGenerateStore((state) => state.errorMessage)
  const isMinimized = useOrderBulkGenerateStore((state) => state.isMinimized)
  const downloadTriggered = useOrderBulkGenerateStore(
    (state) => state.downloadTriggered
  )
  const downloadFailed = useOrderBulkGenerateStore((state) => state.downloadFailed)
  const applyProgress = useOrderBulkGenerateStore((state) => state.applyProgress)
  const setMinimized = useOrderBulkGenerateStore((state) => state.setMinimized)
  const markDownloadTriggered = useOrderBulkGenerateStore(
    (state) => state.markDownloadTriggered
  )
  const setDownloadFailed = useOrderBulkGenerateStore(
    (state) => state.setDownloadFailed
  )
  const dismiss = useOrderBulkGenerateStore((state) => state.dismiss)

  const isVisible = runId != null
  const isRunning = status === "RUNNING" || (runId != null && status == null)
  const isTerminal = status === "COMPLETED" || status === "FAILED"

  const { usePollingFallback } = useOrderBulkGenerateSubscription(runId, {
    enabled: isVisible && isRunning,
  })

  const { data: bulkRun } = useBulkGenerateRunQuery(
    runId,
    isVisible && (isRunning || status == null),
    { pollingEnabled: usePollingFallback }
  )

  const downloadMutation = useDownloadBulkGenerateZipMutation()
  const downloadStartedRef = useRef(false)

  useEffect(() => {
    downloadStartedRef.current = false
  }, [runId])

  useEffect(() => {
    if (bulkRun) {
      applyProgress(bulkRun)
    }
  }, [applyProgress, bulkRun])

  useEffect(() => {
    if (
      status !== "COMPLETED" ||
      runId == null ||
      downloadTriggered ||
      downloadStartedRef.current
    ) {
      return
    }

    downloadStartedRef.current = true
    markDownloadTriggered()
    void downloadMutation.mutateAsync(runId).catch(() => {
      setDownloadFailed(true)
    })
  }, [
    downloadMutation,
    downloadTriggered,
    markDownloadTriggered,
    runId,
    setDownloadFailed,
    status,
  ])

  const progressPercent =
    totalCount > 0 ? Math.min(100, Math.round((processedCount / totalCount) * 100)) : 0

  const handleRetryDownload = () => {
    if (runId == null) {
      return
    }
    markDownloadTriggered()
    void downloadMutation.mutateAsync(runId).catch(() => {
      setDownloadFailed(true)
    })
  }

  const title = (() => {
    if (status === "FAILED") {
      return t("bulk_generate.panel.failed_title")
    }
    if (status === "COMPLETED") {
      if (downloadFailed) {
        return t("bulk_generate.panel.download_failed_title")
      }
      if (downloadMutation.isPending || !downloadTriggered) {
        return t("bulk_generate.panel.downloading_title")
      }
      return t("bulk_generate.panel.completed_title")
    }
    return t("bulk_generate.panel.generating_title")
  })()

  const subtitle = (() => {
    if (status === "FAILED") {
      return errorMessage ?? t("errors.bulk_generate_failed")
    }
    if (status === "COMPLETED") {
      if (downloadFailed) {
        return t("errors.bulk_generate_download_failed")
      }
      return t("bulk_generate.panel.completed_detail", { count: successCount })
    }
    return t("bulk_generate.panel.progress_detail", {
      processed: processedCount,
      total: totalCount,
    })
  })()

  const StatusIcon = (() => {
    if (status === "FAILED" || downloadFailed) {
      return XCircle
    }
    if (status === "COMPLETED" && downloadTriggered && !downloadMutation.isPending) {
      return CheckCircle2
    }
    return Loader2
  })()

  const statusIconClass =
    status === "FAILED" || downloadFailed
      ? "text-destructive"
      : status === "COMPLETED" && downloadTriggered && !downloadMutation.isPending
        ? "text-success"
        : "text-primary animate-spin"

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          key="order-bulk-generate-panel"
          role="status"
          aria-live="polite"
          initial={
            prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-auto fixed right-4 bottom-4 z-50 w-[min(100vw-2rem,22rem)] border border-border bg-background shadow-md"
        >
          <div className="flex items-start gap-2 px-3 py-2.5">
            <StatusIcon
              className={`mt-0.5 size-4 shrink-0 ${statusIconClass}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{title}</p>
              {!isMinimized ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {!isTerminal ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={
                    isMinimized
                      ? t("bulk_generate.panel.expand")
                      : t("bulk_generate.panel.minimize")
                  }
                  onClick={() => setMinimized(!isMinimized)}
                >
                  {isMinimized ? <ChevronUp /> : <ChevronDown />}
                </Button>
              ) : null}
              {isTerminal ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("bulk_generate.panel.dismiss")}
                  onClick={dismiss}
                >
                  <X />
                </Button>
              ) : null}
            </div>
          </div>

          {!isMinimized && isRunning ? (
            <div className="space-y-1.5 px-3 pb-3">
              <Progress value={progressPercent} className="h-1" />
              <p className="text-xs text-muted-foreground">
                {t("bulk_generate.panel.percent", { percent: progressPercent })}
              </p>
            </div>
          ) : null}

          {!isMinimized && downloadFailed && status === "COMPLETED" ? (
            <div className="px-3 pb-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleRetryDownload}
                disabled={downloadMutation.isPending}
              >
                {t("bulk_generate.panel.retry_download")}
              </Button>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
