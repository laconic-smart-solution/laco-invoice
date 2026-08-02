import { useEffect, useId, useRef, useState } from "react"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import {
  ORDER_IMPORT_SAMPLE_FILENAME,
  ORDER_IMPORT_SAMPLE_HREF,
} from "@/features/orders/constants/order-import-sample"
import {
  SUPPORTED_MARKETPLACES,
  type MarketplaceCode,
} from "@/features/stores/config/marketplaces"
import type { Store } from "@/features/stores/types/store"
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
import type { ApiOrderImportResultDto } from "@/shared/services/order.service"
import {
  getOrderErrorMessage,
  useImportOrdersMutation,
} from "@/shared/queries/order.query"

interface OrderImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stores: Store[]
  defaultStoreId?: string
}

export function OrderImportDialog({
  open,
  onOpenChange,
  stores,
  defaultStoreId = "",
}: OrderImportDialogProps) {
  const { t } = useTranslation("orders")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sampleHintId = useId()
  const importMutation = useImportOrdersMutation()

  const [storeId, setStoreId] = useState(defaultStoreId)
  const [marketplaceCode, setMarketplaceCode] = useState<MarketplaceCode>("TIKTOK")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [result, setResult] = useState<ApiOrderImportResultDto | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const initialStoreId = defaultStoreId || (stores[0] ? String(stores[0].id) : "")
    setStoreId(initialStoreId)
    setMarketplaceCode("TIKTOK")
    setSelectedFile(null)
    setValidationError(null)
    setResult(null)
    importMutation.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form only when dialog opens
  }, [open, defaultStoreId, stores])

  const isImporting = importMutation.isPending
  const showResult = result != null
  const parsedStoreId = Number(storeId)

  const mutationError =
    importMutation.isError && importMutation.error
      ? getOrderErrorMessage(importMutation.error, t("errors.import_failed"))
      : null

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setValidationError(null)
    setResult(null)
  }

  const handleSubmit = () => {
    if (!Number.isFinite(parsedStoreId) || parsedStoreId <= 0) {
      setValidationError(t("import.no_store"))
      return
    }
    if (!selectedFile) {
      setValidationError(t("import.no_file"))
      return
    }

    setValidationError(null)
    importMutation.mutate(
      {
        storeId: parsedStoreId,
        marketplaceCode,
        file: selectedFile,
      },
      {
        onSuccess: (data) => {
          setResult(data)
        },
      }
    )
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const statusLabel = result
    ? {
        COMPLETED: t("import.status_completed"),
        PARTIAL: t("import.status_partial"),
        FAILED: t("import.status_failed"),
      }[result.status]
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
          <DialogDescription>{t("import.description")}</DialogDescription>
        </DialogHeader>

        {showResult ? (
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
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("import.store_label")}
              </Label>
              <Select
                value={storeId}
                onValueChange={setStoreId}
                disabled={isImporting || stores.length === 0}
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
                disabled={isImporting}
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
                <Button variant="outline" size="sm" className="shrink-0 self-start" asChild>
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
              <Label className="text-xs text-muted-foreground" htmlFor="order-import-file">
                {t("import.file_label")}
              </Label>
              <input
                ref={fileInputRef}
                id="order-import-file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
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
              <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                {t("import.close")}
              </Button>
              <Button onClick={handleSubmit} disabled={isImporting || stores.length === 0}>
                {isImporting ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <FileSpreadsheet data-icon="inline-start" />
                )}
                {isImporting ? t("import.importing") : t("import.submit")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
