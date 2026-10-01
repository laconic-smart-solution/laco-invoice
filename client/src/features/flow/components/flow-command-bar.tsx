import { Link } from "react-router-dom"
import {
  Bell,
  BookOpen,
  CheckCheck,
  CircleHelp,
  Keyboard,
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
import { useFlowNotifications } from "@/features/flow/hooks/use-flow-notifications"
import { useFlowWorkspace } from "@/features/flow/hooks/use-flow-workspace"
import type { Voucher } from "@/features/vouchers/types/voucher"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"

interface FlowCommandBarProps {
  title: string
  subtitle: string
  searchAriaLabel: string
  primaryActionLabel: string
  onSearch: () => void
  onPrimaryAction: () => void
  isCompact: boolean
  showQueue: boolean
  showInspector: boolean
  showStats: boolean
  onCompactChange: (value: boolean) => void
  onShowQueueChange: (value: boolean) => void
  onShowInspectorChange: (value: boolean) => void
  onShowStatsChange: (value: boolean) => void
  onResetLayout: () => void
  onOpenQuickStart?: () => void
  onReviewWorkflow?: () => void
  onMismatchNotification?: (run: ApiOrderInputRunDto) => void
  onExportNotification?: (voucher: Voucher) => void
}

export function FlowCommandBar({
  title,
  subtitle,
  searchAriaLabel,
  primaryActionLabel,
  onSearch,
  onPrimaryAction,
  isCompact,
  showQueue,
  showInspector,
  showStats,
  onCompactChange,
  onShowQueueChange,
  onShowInspectorChange,
  onShowStatsChange,
  onResetLayout,
  onOpenQuickStart,
  onReviewWorkflow,
  onMismatchNotification,
  onExportNotification,
}: FlowCommandBarProps) {
  const { t } = useTranslation("flow")
  const workspace = useFlowWorkspace()
  const notifications = useFlowNotifications(
    workspace.runs,
    workspace.allVouchers
  )

  return (
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
          <h1 className="truncate text-sm font-semibold">{title}</h1>
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="flow-global-search"
        aria-label={searchAriaLabel}
        onClick={onSearch}
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
            {onOpenQuickStart ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg"
                  onSelect={onOpenQuickStart}
                >
                  <BookOpen className="size-4" />
                  {t("quick_start")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg"
                  onSelect={onOpenQuickStart}
                >
                  <Keyboard className="size-4" />
                  <span className="flex-1">{t("shortcuts")}</span>
                  <kbd className="text-[10px] text-muted-foreground">
                    Ctrl + `
                  </kbd>
                </DropdownMenuItem>
              </>
            ) : null}
            {onReviewWorkflow ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg"
                  onSelect={onReviewWorkflow}
                >
                  {t("review_workflow")}
                </DropdownMenuItem>
              </>
            ) : null}
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
                        onMismatchNotification?.(item.run)
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
                      onExportNotification?.(item.voucher)
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
              onCheckedChange={onCompactChange}
            >
              {t("compact")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showQueue}
              className="rounded-lg"
              onCheckedChange={onShowQueueChange}
            >
              {t("show_queue")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showInspector}
              className="rounded-lg"
              onCheckedChange={onShowInspectorChange}
            >
              {t("show_inspector")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showStats}
              className="rounded-lg"
              onCheckedChange={onShowStatsChange}
            >
              {t("stats.show")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg" onSelect={onResetLayout}>
              {t("reset_layout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" className="ml-1 rounded-lg" onClick={onPrimaryAction}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">{primaryActionLabel}</span>
        </Button>
      </div>
    </header>
  )
}
