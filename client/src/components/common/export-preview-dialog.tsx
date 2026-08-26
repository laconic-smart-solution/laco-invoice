import type { ReactNode } from "react"
import { Download } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function isNestedDismissableLayer(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        '[data-slot="dropdown-menu-content"], [data-slot="dropdown-menu-sub-content"], [data-radix-popper-content-wrapper]'
      )
    )
  )
}

interface ExportPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  totalCount: number
  columnControls: ReactNode
  children: ReactNode
  onConfirmExport: () => void | Promise<void>
  isExporting?: boolean
  canExport?: boolean
  exportError?: string | null
}

export function ExportPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  totalCount,
  columnControls,
  children,
  onConfirmExport,
  isExporting = false,
  canExport = true,
  exportError = null,
}: ExportPreviewDialogProps) {
  const { t } = useTranslation("common")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isExporting) {
          return
        }
        onOpenChange(next)
      }}
    >
      <DialogContent
        showCloseButton={!isExporting}
        className="flex max-h-[min(90vh,52rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        aria-describedby={undefined}
        onPointerDownOutside={(event) => {
          if (isNestedDismissableLayer(event.target)) {
            event.preventDefault()
          }
        }}
        onFocusOutside={(event) => {
          if (isNestedDismissableLayer(event.target)) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (isNestedDismissableLayer(event.target)) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}{" "}
            <span className="text-foreground">
              {t("table.showing_total", { count: totalCount })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border px-5 py-3">
          {columnControls}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

        {exportError ? (
          <p
            role="alert"
            className="shrink-0 border-t border-border px-5 py-2 text-sm text-destructive"
          >
            {exportError}
          </p>
        ) : null}

        <DialogFooter className="shrink-0 border-t border-border px-5 py-4 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t("export_preview.column_hint")}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void onConfirmExport()}
              disabled={isExporting || !canExport}
              aria-busy={isExporting}
            >
              <Download data-icon="inline-start" />
              {isExporting
                ? t("export_preview.exporting")
                : t("export_preview.download")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
