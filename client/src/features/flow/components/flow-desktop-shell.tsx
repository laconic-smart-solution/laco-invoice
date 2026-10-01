import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Command,
  LayoutGrid,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/constants/routes"
import { FlowCommandBar } from "@/features/flow/components/flow-command-bar"
import { FlowInspector } from "@/features/flow/components/flow-inspector"
import { FlowInspectorRail } from "@/features/flow/components/flow-inspector-rail"
import { FlowOrdersWorkspace } from "@/features/flow/components/flow-orders-workspace"
import { FlowPipeline } from "@/features/flow/components/flow-pipeline"
import { FlowQueueRail } from "@/features/flow/components/flow-queue-rail"
import { FlowStageWorkspace } from "@/features/flow/components/flow-stage-workspace"
import { FlowWorkQueue } from "@/features/flow/components/flow-work-queue"
import { FlowWindow } from "@/features/flow/components/flow-window"
import { NewInputWindow } from "@/features/flow/components/dialogs/new-input-window"
import { ExportWindow } from "@/features/flow/components/dialogs/export-window"
import { GenerateVoucherWindow } from "@/features/flow/components/dialogs/generate-voucher-window"
import { OrderSetDetailWindow } from "@/features/flow/components/dialogs/order-set-detail-window"
import { QuickStartGuideWindow } from "@/features/flow/components/dialogs/quick-start-guide-window"
import { VoucherDetailWindow } from "@/features/flow/components/dialogs/voucher-detail-window"
import { type FlowQueueFilter, type FlowStageId, type FlowStatId } from "@/features/flow/data/flow-constants"
import { FlowStatStrip } from "@/features/flow/components/flow-stat-strip"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
import { useFlowWorkspace } from "@/features/flow/hooks/use-flow-workspace"
import {
  canGenerateFlowVoucher,
  needsFlowReview,
} from "@/features/flow/util/flow-eligibility"
import { isEditableKeyboardTarget } from "@/features/flow/util/flow-shortcut"
import { cn } from "@/lib/utils"
import "@/features/flow/styles/flow-workspace.css"

interface WindowBodyProps {
  type: string
  entityId?: number
  voucherId?: number
  onStageChange: (stage: FlowStageId) => void
  onCreated: (inputRunId: number) => void
  onDeleted: (id: number) => void
  onVoucherReady: (voucherId: number) => void
}

function WindowBody({
  type,
  entityId,
  voucherId,
  onStageChange,
  onCreated,
  onDeleted,
  onVoucherReady,
}: WindowBodyProps) {
  const { t } = useTranslation("flow")

  if (type === "order-set" && entityId != null) {
    return <OrderSetDetailWindow orderSetId={entityId} onDeleted={onDeleted} />
  }
  if (type === "generate-voucher" && entityId != null) {
    return (
      <GenerateVoucherWindow
        orderSetId={entityId}
        voucherId={voucherId}
        onGenerated={() => onVoucherReady(entityId)}
      />
    )
  }
  if (type === "voucher-detail" && entityId != null) {
    return <VoucherDetailWindow voucherId={entityId} />
  }
  if (type === "export" && entityId != null) {
    return <ExportWindow voucherId={entityId} />
  }
  if (type === "new-input") {
    return <NewInputWindow onCreated={onCreated} />
  }
  if (type === "quick-start") {
    return <QuickStartGuideWindow onStageChange={onStageChange} />
  }
  return <p className="text-sm text-muted-foreground">{t("unknown_window")}</p>
}

interface FlowDesktopShellProps {
  tabbed?: boolean
}

export function FlowDesktopShell({ tabbed = false }: FlowDesktopShellProps) {
  const { t } = useTranslation("flow")
  const [activeStage, setActiveStage] = useState<FlowStageId>("import")
  const [queueFilter, setQueueFilter] = useState<FlowQueueFilter>("all")
  const [activeStatId, setActiveStatId] = useState<FlowStatId | null>("sets")
  const [isCompact, setIsCompact] = useState(false)
  const [showInspector, setShowInspector] = useState(true)
  const [showQueue, setShowQueue] = useState(true)
  const [showStats, setShowStats] = useState(true)
  const workspace = useFlowWorkspace()
  const windows = useFlowWindowsStore((state) => state.windows)
  const activeWindowId = useFlowWindowsStore((state) => state.activeWindowId)
  const focus = useFlowWindowsStore((state) => state.focus)
  const restore = useFlowWindowsStore((state) => state.restore)
  const cycleFocus = useFlowWindowsStore((state) => state.cycleFocus)
  const reset = useFlowWindowsStore((state) => state.reset)
  const closeAll = useFlowWindowsStore((state) => state.closeAll)
  const openNewInput = useFlowWindowsStore((state) => state.openNewInput)
  const openQuickStart = useFlowWindowsStore((state) => state.openQuickStart)
  const openOrderSet = useFlowWindowsStore((state) => state.openOrderSet)
  const openExport = useFlowWindowsStore((state) => state.openExport)
  const visibleWindows = windows.filter((window) => !window.minimized)
  const revealQueueSearch = useCallback(() => {
    setShowQueue(true)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLInputElement>('[data-shortcut-search="orders"]')
          ?.focus()
      })
    })
  }, [])

  const handleStatSelect = (statId: FlowStatId) => {
    setActiveStatId(statId)

    if (statId === "sets") {
      setShowQueue(true)
      setQueueFilter("all")
      setActiveStage("import")
      return
    }

    if (statId === "review") {
      setShowQueue(true)
      setQueueFilter("attention")
      setActiveStage("match")
      const firstReview = workspace.runs.find(needsFlowReview)
      if (firstReview) workspace.setSelectedRunId(firstReview.id)
      return
    }

    if (statId === "ready") {
      setShowQueue(true)
      setQueueFilter("ready")
      setActiveStage("voucher")
      const firstReady = workspace.runs.find(canGenerateFlowVoucher)
      if (firstReady) workspace.setSelectedRunId(firstReady.id)
      return
    }

    if (statId === "vouchers") {
      setQueueFilter("all")
      setActiveStage("voucher")
      return
    }

    if (statId === "export") {
      setQueueFilter("all")
      setActiveStage("export")
      return
    }

    if (statId === "orders") {
      return
    }

    if (statId === "revenue") {
      setActiveStage("match")
    }
  }

  useEffect(() => {
    document.body.classList.add("flow-workspace-active")
    reset()
    return () => {
      document.body.classList.remove("flow-workspace-active")
      reset()
    }
    // Clear stuck HMR windows and reset when leaving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) {
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "`") {
        event.preventDefault()
        cycleFocus()
      }
      if (event.key === "Escape" && visibleWindows.length > 0) {
        closeAll()
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        if (document.getElementById("flow-panel-orders")?.hidden) {
          return
        }
        event.preventDefault()
        revealQueueSearch()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [cycleFocus, closeAll, visibleWindows.length, revealQueueSearch])

  return (
    <div
      className={
        cn(
          "flow-workspace",
          isCompact && "flow-workspace--compact",
          tabbed && "flow-workspace--tabbed"
        )
      }
    >
      <FlowCommandBar
        title={t("title")}
        subtitle={t("subtitle")}
        searchAriaLabel={t("search_aria")}
        primaryActionLabel={t("new_input")}
        onSearch={revealQueueSearch}
        onPrimaryAction={() => {
          setActiveStage("import")
          openNewInput(t("window.new_input"))
        }}
        isCompact={isCompact}
        showQueue={showQueue}
        showInspector={showInspector}
        showStats={showStats}
        onCompactChange={setIsCompact}
        onShowQueueChange={setShowQueue}
        onShowInspectorChange={setShowInspector}
        onShowStatsChange={setShowStats}
        onResetLayout={() => {
          workspace.setSearch("")
          setQueueFilter("all")
          setActiveStatId("sets")
          setActiveStage("import")
          setShowQueue(true)
          setShowInspector(true)
          setShowStats(true)
          reset()
        }}
        onOpenQuickStart={() => openQuickStart(t("window.quick_start"))}
        onReviewWorkflow={() => setActiveStage("match")}
        onMismatchNotification={(run) => {
          workspace.setSelectedRunId(run.id)
          setQueueFilter("attention")
          setActiveStatId("review")
          setActiveStage("match")
          openOrderSet(
            run.id,
            t("window.order_set", {
              id: run.id,
              title: run.title,
            })
          )
        }}
        onExportNotification={(voucher) => {
          if (voucher.orderInputRunId) {
            workspace.setSelectedRunId(voucher.orderInputRunId)
          }
          setQueueFilter("all")
          setActiveStatId("export")
          setActiveStage("export")
          openExport(
            voucher.id,
            t("window.export", {
              number: voucher.voucherNumber,
            })
          )
        }}
      />

      {showStats ? (
        <FlowStatStrip
          counts={workspace.counts}
          activeStatId={activeStatId}
          onSelect={handleStatSelect}
        />
      ) : null}

      <FlowPipeline
        activeStage={activeStage}
        onStageChange={(stage) => {
          setActiveStage(stage)
          setActiveStatId(
            stage === "match"
              ? "review"
              : stage === "voucher"
                ? "vouchers"
                : stage === "export"
                  ? "export"
                  : "sets"
          )
        }}
        counts={workspace.counts}
      />

      <div
        className={cn(
          "flow-workspace__body",
          !showQueue && "flow-workspace__body--no-queue",
          !showInspector && "flow-workspace__body--no-inspector"
        )}
      >
        {showQueue ? (
          <FlowWorkQueue
            runs={workspace.runs}
            selectedId={workspace.selectedRunId}
            search={workspace.search}
            filter={queueFilter}
            isLoading={workspace.isListLoading}
            isFetching={workspace.isListFetching}
            error={workspace.listError}
            onRetry={() => void workspace.refetchRuns()}
            onSearchChange={workspace.setSearch}
            onFilterChange={(nextFilter) => {
              setQueueFilter(nextFilter)
              setActiveStatId(
                nextFilter === "attention"
                  ? "review"
                  : nextFilter === "ready"
                    ? "ready"
                    : "sets"
              )
            }}
            onSelect={(run) =>
              workspace.setSelectedRunId(
                workspace.selectedRunId === run.id ? null : run.id
              )
            }
            onHide={() => setShowQueue(false)}
          />
        ) : (
          <FlowQueueRail
            runs={workspace.runs}
            selectedId={workspace.selectedRunId}
            filter={queueFilter}
            onSelect={(run) =>
              workspace.setSelectedRunId(
                workspace.selectedRunId === run.id ? null : run.id
              )
            }
            onExpand={() => setShowQueue(true)}
          />
        )}
        {activeStatId === "orders" ? (
          <FlowOrdersWorkspace />
        ) : (
          <FlowStageWorkspace
            stage={activeStage}
            orderSet={workspace.selectedRun}
            vouchers={workspace.runVouchers}
            allVouchers={workspace.allVouchers}
            onStageChange={setActiveStage}
          />
        )}
        {showInspector ? (
          <FlowInspector
            stage={activeStage}
            orderSet={workspace.selectedRun}
            vouchers={
              workspace.selectedRun
                ? workspace.runVouchers
                : workspace.allVouchers
            }
            onStageChange={setActiveStage}
            onHide={() => setShowInspector(false)}
          />
        ) : (
          <FlowInspectorRail onExpand={() => setShowInspector(true)} />
        )}
      </div>

      {visibleWindows.length > 0 ? (
        <div
          className="flow-workspace__window-layer"
          aria-label={t("windows")}
        >
          <button
            type="button"
            className="flow-workspace__window-scrim"
            aria-label={t("close_windows")}
            onClick={() => closeAll()}
          />
          {visibleWindows.map((win) => (
            <FlowWindow
              key={win.id}
              id={win.id}
              title={win.title}
              active={win.id === activeWindowId}
              x={win.x}
              y={win.y}
              width={win.width}
              height={win.height}
              zIndex={win.zIndex}
              maximized={win.maximized}
            >
              <WindowBody
                type={win.type}
                entityId={win.entityId}
                voucherId={win.voucherId}
                onStageChange={setActiveStage}
                onCreated={(inputRunId) => {
                  workspace.setSelectedRunId(inputRunId)
                  setActiveStage("import")
                  void workspace.refetchRuns()
                }}
                onDeleted={() => {
                  void workspace.refetchRuns()
                }}
                onVoucherReady={() => {
                  setActiveStage("voucher")
                  void workspace.refetchRuns()
                }}
              />
            </FlowWindow>
          ))}
        </div>
      ) : null}

      <footer className="flow-taskbar" role="contentinfo">
        <Link
          to={ROUTES.dashboard.root}
          className="flow-taskbar__start"
          aria-label={t("dashboard")}
        >
          <LayoutGrid className="size-3.5" aria-hidden />
          {t("dashboard")}
        </Link>

        <span className="flow-taskbar__context">
          <Command className="size-3.5" aria-hidden />
          {t(`pipeline.${activeStage}`)}
        </span>

        <div className="flow-taskbar__windows" role="toolbar" aria-label={t("windows")}>
          {windows.map((win) => {
            const isActive = win.id === activeWindowId && !win.minimized
            return (
              <button
                key={win.id}
                type="button"
                className={
                  isActive
                    ? "flow-taskbar__chip flow-taskbar__chip--active"
                    : "flow-taskbar__chip"
                }
                aria-pressed={isActive}
                aria-label={
                  win.minimized
                    ? t("restore_window", { title: win.title })
                    : t("focus_window", { title: win.title })
                }
                onClick={() => {
                  if (win.minimized) restore(win.id)
                  else focus(win.id)
                }}
              >
                {win.title}
              </button>
            )
          })}
        </div>

        <span className="flow-taskbar__hint">{t("taskbar_cycle")}</span>
      </footer>
    </div>
  )
}
