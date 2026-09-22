import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Bell,
  BookOpen,
  CheckCheck,
  CircleHelp,
  Command,
  Keyboard,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/constants/routes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FlowInspector } from "@/features/flow/components/flow-inspector"
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
import { useFlowNotifications } from "@/features/flow/hooks/use-flow-notifications"
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

export function FlowDesktopShell() {
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
  const notifications = useFlowNotifications(
    workspace.runs,
    workspace.allVouchers
  )

  const revealQueueSearch = useCallback(() => {
    setShowQueue(true)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLInputElement>("[data-shortcut-search]")
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
        isCompact ? "flow-workspace flow-workspace--compact" : "flow-workspace"
      }
    >
      <header className="flow-commandbar">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to={ROUTES.dashboard.root}
            className="flow-brand"
            aria-label={t("brand_back")}
          >
            <span className="flow-brand__mark">L</span>
            <span className="hidden sm:block">
              <strong>{t("brand_name")}</strong>
              <small>{t("brand_ops")}</small>
            </span>
          </Link>
          <span className="flow-commandbar__divider" aria-hidden />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{t("title")}</h1>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              {t("subtitle")}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="flow-global-search"
          aria-label={t("search_aria")}
          onClick={revealQueueSearch}
        >
          <Search className="size-3.5" aria-hidden />
          <span>{t("search_global")}</span>
          <kbd>Ctrl K</kbd>
        </button>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-lg"
                aria-label={t("help")}
              >
                <CircleHelp className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-[300] w-64 rounded-xl p-1.5"
            >
              <DropdownMenuLabel>
                <span className="block text-xs font-semibold">
                  {t("help_title")}
                </span>
                <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                  {t("help_subtitle")}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg"
                onSelect={() => openQuickStart(t("window.quick_start"))}
              >
                <BookOpen className="size-4" />
                {t("quick_start")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg"
                onSelect={() => openQuickStart(t("window.quick_start"))}
              >
                <Keyboard className="size-4" />
                <span className="flex-1">{t("shortcuts")}</span>
                <kbd className="text-[10px] text-muted-foreground">Ctrl + `</kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg"
                onSelect={() => setActiveStage("match")}
              >
                {t("review_workflow")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative rounded-lg"
                aria-label={
                  notifications.unreadCount > 0
                    ? t("notifications_unread", {
                        count: notifications.unreadCount,
                      })
                    : t("notifications")
                }
              >
                <Bell className="size-4" />
                {notifications.unreadCount > 0 ? (
                  <span className="flow-notification-dot" />
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-[300] w-72 rounded-xl p-1.5"
            >
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>{t("notifications")}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {notifications.unreadCount > 0
                    ? t("notifications_unread_short", {
                        count: notifications.unreadCount,
                      })
                    : t("notifications_live")}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.items.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  {t("notifications_empty")}
                </p>
              ) : (
                notifications.items.map((item) => {
                  const unread = notifications.isUnread(item.id)
                  if (item.kind === "mismatch") {
                    return (
                      <DropdownMenuItem
                        key={item.id}
                        className="items-start rounded-lg py-2.5"
                        onSelect={() => {
                          notifications.markRead(item.id)
                          workspace.setSelectedRunId(item.run.id)
                          setQueueFilter("attention")
                          setActiveStatId("review")
                          setActiveStage("match")
                          openOrderSet(
                            item.run.id,
                            t("window.order_set", {
                              id: item.run.id,
                              title: item.run.title,
                            })
                          )
                        }}
                      >
                        <span
                          className={
                            unread
                              ? "mt-1 size-2 shrink-0 rounded-full bg-destructive"
                              : "mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/40"
                          }
                        />
                        <span>
                          <strong className="block text-xs">
                            {t("mismatch_title")}
                          </strong>
                          <small className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
                            {t("mismatch_body", { id: item.run.id })}
                          </small>
                        </span>
                      </DropdownMenuItem>
                    )
                  }

                  return (
                    <DropdownMenuItem
                      key={item.id}
                      className="items-start rounded-lg py-2.5"
                      onSelect={() => {
                        notifications.markRead(item.id)
                        if (item.voucher.orderInputRunId) {
                          workspace.setSelectedRunId(item.voucher.orderInputRunId)
                        }
                        setQueueFilter("all")
                        setActiveStatId("export")
                        setActiveStage("export")
                        openExport(
                          item.voucher.id,
                          t("window.export", {
                            number: item.voucher.voucherNumber,
                          })
                        )
                      }}
                    >
                      <span
                        className={
                          unread
                            ? "mt-1 size-2 shrink-0 rounded-full bg-success"
                            : "mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/40"
                        }
                      />
                      <span>
                        <strong className="block text-xs">
                          {t("export_ready_title")}
                        </strong>
                        <small className="mt-1 block text-[10px] leading-relaxed text-muted-foreground">
                          {t("export_ready_body", {
                            number: item.voucher.voucherNumber,
                          })}
                        </small>
                      </span>
                    </DropdownMenuItem>
                  )
                })
              )}
              {notifications.hiddenCount > 0 ? (
                <p className="px-2 py-1.5 text-[10px] text-muted-foreground">
                  {t("notifications_more", { count: notifications.hiddenCount })}
                </p>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-center rounded-lg"
                disabled={notifications.unreadCount === 0}
                onSelect={() => notifications.markAllRead()}
              >
                <CheckCheck className="size-4" />
                {t("mark_all_read")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-lg"
                aria-label={t("settings")}
              >
                <Settings className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="z-[300] w-60 rounded-xl p-1.5"
            >
              <DropdownMenuLabel>
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4" />
                  {t("settings")}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={isCompact}
                className="rounded-lg"
                onCheckedChange={setIsCompact}
              >
                {t("compact")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showQueue}
                className="rounded-lg"
                onCheckedChange={setShowQueue}
              >
                {t("show_queue")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showInspector}
                className="rounded-lg"
                onCheckedChange={setShowInspector}
              >
                {t("show_inspector")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showStats}
                className="rounded-lg"
                onCheckedChange={setShowStats}
              >
                {t("stats.show")}
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="rounded-lg"
                onSelect={() => {
                  workspace.setSearch("")
                  setQueueFilter("all")
                  setActiveStatId("sets")
                  setActiveStage("import")
                  setShowQueue(true)
                  setShowInspector(true)
                  setShowStats(true)
                  reset()
                }}
              >
                {t("reset_layout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            className="ml-1 rounded-lg"
            onClick={() => {
              setActiveStage("import")
              openNewInput(t("window.new_input"))
            }}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("new_input")}</span>
          </Button>
        </div>
      </header>

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
            onSelect={(run) => workspace.setSelectedRunId(run.id)}
            onHide={() => setShowQueue(false)}
          />
        ) : (
          <FlowQueueRail
            runs={workspace.runs}
            selectedId={workspace.selectedRunId}
            filter={queueFilter}
            onSelect={(run) => workspace.setSelectedRunId(run.id)}
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
            vouchers={workspace.runVouchers}
            onStageChange={setActiveStage}
          />
        ) : null}
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
