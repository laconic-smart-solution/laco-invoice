import { Loader2 } from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getOrderErrorMessage,
  useOrderHistoryQuery,
} from "@/shared/queries/order.query"
import { useInfiniteScrollSentinel } from "@/shared/hooks/use-infinite-scroll-sentinel"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatDateTime } from "@/util/format"

interface OrderHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number | null
  externalOrderId: string | null
}

function displayValue(value: string | null | undefined, emptyLabel: string): string {
  if (value == null || value === "") {
    return emptyLabel
  }
  return value
}

export function OrderHistoryDialog({
  open,
  onOpenChange,
  orderId,
  externalOrderId,
}: OrderHistoryDialogProps) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null)

  const query = useOrderHistoryQuery(orderId, open && orderId != null)

  const loadError =
    query.isError && query.error
      ? getOrderErrorMessage(query.error, t("history.load_failed"))
      : null

  const events = query.data?.pages.flatMap((page) => page.data ?? []) ?? []
  const totalElements = query.data?.pages[0]?.meta?.totalElements ?? 0
  const emptyLabel = t("history.empty_value")

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage()
    }
  }, [query])

  const sentinelRef = useInfiniteScrollSentinel({
    enabled: open && Boolean(query.hasNextPage),
    onIntersect: loadMore,
    root: scrollRoot,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,44rem)] w-full max-w-[min(96vw,56rem)] flex-col gap-4 overflow-hidden sm:max-w-[min(96vw,56rem)]">
        <DialogHeader>
          <DialogTitle>{t("history.title")}</DialogTitle>
          <DialogDescription>
            {t("history.description", {
              orderId: externalOrderId ?? orderId ?? "—",
            })}
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("history.loading")}
          </div>
        ) : null}

        <AuthFormError message={loadError} />

        {!query.isLoading && !loadError ? (
          <div
            ref={setScrollRoot}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto"
          >
            {events.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("history.empty")}
              </p>
            ) : (
              <>
                {events.map((event) => (
                  <section
                    key={event.id}
                    className="space-y-3 rounded-md border border-border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-foreground">
                          {formatDateTime(event.updatedAt, locale)}
                        </p>
                        <p className="text-muted-foreground">
                          {t("history.updated_by", {
                            name: event.updatedBy ?? t("history.unknown_user"),
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          {t("history.action_label", {
                            action: t(`history.actions.${event.action.toLowerCase()}`),
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          {t("history.source_label", {
                            source: t(`history.sources.${event.source.toLowerCase()}`),
                          })}
                        </p>
                        {event.source === "IMPORT_EXCEL" && event.importFileId != null ? (
                          <p className="text-muted-foreground">
                            {t("history.excel_file_label")}{" "}
                            <Link
                              to={ROUTES.dashboard.orderImportDetail(event.importFileId)}
                              className="font-medium text-primary underline-offset-4 hover:underline"
                              onClick={() => onOpenChange(false)}
                            >
                              {event.excelFileName ?? `#${event.importFileId}`}
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-md border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("history.columns.field")}</TableHead>
                            <TableHead>{t("history.columns.before")}</TableHead>
                            <TableHead>{t("history.columns.after")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {event.changes.map((change) => (
                            <TableRow key={`${event.id}-${change.field}`}>
                              <TableCell className="font-medium">
                                {t(`history.fields.${change.field}`, {
                                  defaultValue: change.field,
                                })}
                              </TableCell>
                              <TableCell className="whitespace-pre-wrap break-all text-muted-foreground">
                                {displayValue(change.before, emptyLabel)}
                              </TableCell>
                              <TableCell className="whitespace-pre-wrap break-all">
                                {displayValue(change.after, emptyLabel)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                ))}

                <div ref={sentinelRef} className="h-8 w-full" aria-hidden />

                {query.isFetchingNextPage ? (
                  <p className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    {t("history.loading_more")}
                  </p>
                ) : null}

                {!query.hasNextPage && events.length > 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    {t("history.end")}
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {events.length > 0
              ? t("history.loaded_info", {
                  loaded: events.length,
                  total: totalElements,
                })
              : null}
          </p>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t("history.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
