import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

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
  useImportPreviewExcelRowsQuery,
} from "@/shared/queries/order.query"

interface OrderImportExcelRowsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: number
  batchId: number
  previewOrderId: number | null
  externalOrderId: string | null
}

export function OrderImportExcelRowsDialog({
  open,
  onOpenChange,
  storeId,
  batchId,
  previewOrderId,
  externalOrderId,
}: OrderImportExcelRowsDialogProps) {
  const { t } = useTranslation("orders")
  const query = useImportPreviewExcelRowsQuery(
    storeId,
    batchId,
    previewOrderId,
    open && previewOrderId != null
  )

  const loadError =
    query.isError && query.error
      ? getOrderErrorMessage(query.error, t("errors.import_excel_rows_failed"))
      : null

  const columns = query.data?.columns ?? []
  const rows = query.data?.rows ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,44rem)] w-full max-w-[min(96vw,72rem)] flex-col gap-4 overflow-hidden sm:max-w-[min(96vw,72rem)]">
        <DialogHeader>
          <DialogTitle>{t("import.excel_rows_title")}</DialogTitle>
          <DialogDescription>
            {t("import.excel_rows_description", {
              orderId: externalOrderId ?? query.data?.externalOrderId ?? "—",
              count: rows.length || (query.isLoading ? "…" : 0),
            })}
          </DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("import.excel_rows_loading")}
          </div>
        ) : null}

        <AuthFormError message={loadError} />

        {!query.isLoading && !loadError ? (
          <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-background">
                    {t("import.excel_rows_col_no")}
                  </TableHead>
                  {columns.map((column) => (
                    <TableHead key={column} className="whitespace-nowrap">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={Math.max(columns.length + 1, 1)}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {t("import.excel_rows_empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow
                      key={`${row.excelRowIndex ?? "row"}-${index}`}
                    >
                      <TableCell className="sticky left-0 z-10 bg-background font-medium">
                        {row.excelRowIndex ?? "—"}
                      </TableCell>
                      {columns.map((column) => (
                        <TableCell
                          key={column}
                          className="max-w-56 truncate whitespace-nowrap text-xs"
                          title={row.values[column] ?? ""}
                        >
                          {row.values[column] || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("import.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
