import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Download, FileSpreadsheet, Loader2, UploadCloud, X } from "lucide-react"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import {
  SERVICE_FEE_SAMPLE_FILENAME,
  SERVICE_FEE_SAMPLE_HREF,
  SHIPPING_FEE_SAMPLE_FILENAME,
  SHIPPING_FEE_SAMPLE_HREF,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getOrderInputRunErrorMessage,
  useCreateOrderInputRunMutation,
  useUploadOrderInputOrderDetailMutation,
  useUploadOrderInputWithdrawMutation,
} from "@/shared/queries/order-input-run.query"


function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isSelectLayer(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        '[data-slot="select-content"], [data-radix-select-viewport], [data-radix-popper-content-wrapper]'
      )
    )
  )
}

interface OrderInputRunCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stores: Store[]
  onCreated?: (inputRunId: number) => void
}

export function OrderInputRunCreateDialog({
  open,
  onOpenChange,
  stores,
  onCreated,
}: OrderInputRunCreateDialogProps) {
  const { t } = useTranslation("orders")
  const createMutation = useCreateOrderInputRunMutation()
  const uploadOrderDetailMutation = useUploadOrderInputOrderDetailMutation()
  const uploadWithdrawMutation = useUploadOrderInputWithdrawMutation()

  const [title, setTitle] = useState("")
  const [storeId, setStoreId] = useState("")
  const [marketplaceCode, setMarketplaceCode] =
    useState<MarketplaceCode>("TIKTOK")
  const [orderDetailFile, setOrderDetailFile] = useState<File | null>(null)
  const [withdrawFile, setWithdrawFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState<string | null>(null)

  const orderDetailInputRef = useRef<HTMLInputElement | null>(null)
  const withdrawInputRef = useRef<HTMLInputElement | null>(null)

  const isSubmitting =
    createMutation.isPending ||
    uploadOrderDetailMutation.isPending ||
    uploadWithdrawMutation.isPending

  useEffect(() => {
    if (!open) {
      return
    }
    setTitle("")
    setStoreId(stores[0] ? String(stores[0].id) : "")
    setMarketplaceCode("TIKTOK")
    setOrderDetailFile(null)
    setWithdrawFile(null)
    setError(null)
    setUploadStep(null)
    createMutation.reset()
    // Only reset when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-gated reset
  }, [open])

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) {
      return
    }
    onOpenChange(next)
  }

  const handleFileChange = (
    type: "orderDetail" | "withdraw",
    file: File | null
  ) => {
    if (type === "orderDetail") {
      setOrderDetailFile(file)
    } else {
      setWithdrawFile(file)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const trimmedTitle = title.trim()
    const parsedStoreId = Number(storeId)

    if (!trimmedTitle) {
      setError(t("inputs.errors.title_required", "Title is required"))
      return
    }
    if (!Number.isFinite(parsedStoreId) || parsedStoreId <= 0) {
      setError(t("inputs.errors.store_required", "Store is required"))
      return
    }

    setError(null)
    try {
      setUploadStep(t("inputs.creating", "Creating order set..."))
      const data = await createMutation.mutateAsync({
        title: trimmedTitle,
        storeId: parsedStoreId,
        marketplaceCode,
      })

      if (orderDetailFile) {
        setUploadStep(
          t("inputs.uploading_order_detail", "Uploading Shipping Fee Excel...")
        )
        await uploadOrderDetailMutation.mutateAsync({
          id: data.id,
          file: orderDetailFile,
        })
      }

      if (withdrawFile) {
        setUploadStep(
          t("inputs.uploading_withdraw", "Uploading Service Fee Excel...")
        )
        await uploadWithdrawMutation.mutateAsync({
          id: data.id,
          file: withdrawFile,
        })
      }

      onOpenChange(false)
      onCreated?.(data.id)
    } catch (err: unknown) {
      setError(
        getOrderInputRunErrorMessage(
          err,
          t("inputs.errors.create_failed", "Failed to create order set")
        )
      )
    } finally {
      setUploadStep(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        showCloseButton={!isSubmitting}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          const titleInput = document.getElementById("order-input-title")
          titleInput?.focus()
        }}
        onPointerDownOutside={(event) => {
          if (isSubmitting || isSelectLayer(event.target)) {
            event.preventDefault()
          }
        }}
        onFocusOutside={(event) => {
          if (isSubmitting || isSelectLayer(event.target)) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (isSubmitting || isSelectLayer(event.target)) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("inputs.create_title")}</DialogTitle>
          <DialogDescription>
            {t(
              "inputs.create_modal_subtitle",
              "Give this order set a title and optionally attach Shipping Fee & Service Fee Excels."
            )}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-1.5">
            <Label htmlFor="order-input-title">{t("inputs.fields.title")}</Label>
            <Input
              id="order-input-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("inputs.fields.title_placeholder")}
              maxLength={200}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inputs.fields.store")}</Label>
              <Select
                value={storeId || undefined}
                onValueChange={setStoreId}
                disabled={isSubmitting || stores.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("inputs.fields.store_placeholder")} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={String(store.id)}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("inputs.fields.marketplace")}</Label>
              <Select
                value={marketplaceCode}
                onValueChange={(value) =>
                  setMarketplaceCode(value as MarketplaceCode)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {SUPPORTED_MARKETPLACES.map((marketplace) => (
                    <SelectItem key={marketplace.code} value={marketplace.code}>
                      {marketplace.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload Section: Shipping Fee File */}
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileSpreadsheet className="size-4 text-emerald-600" />
                {t("inputs.detail_files.order_detail_title", "Shipping Fee File")}
                <span className="text-[10px] text-muted-foreground font-normal">
                  (OrderSKUList .xlsx)
                </span>
              </Label>
              <a
                href={SHIPPING_FEE_SAMPLE_HREF}
                download={SHIPPING_FEE_SAMPLE_FILENAME}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                title="Download Shipping Fee Sample Template"
              >
                <Download className="size-3.5" />
                {t("inputs.download_template", "Download Template")}
              </a>
            </div>

            <input
              ref={orderDetailInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                handleFileChange("orderDetail", file)
              }}
              disabled={isSubmitting}
            />

            {orderDetailFile ? (
              <div className="flex items-center justify-between rounded border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                  <span className="font-medium truncate">{orderDetailFile.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    ({formatFileSize(orderDetailFile.size)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => {
                    handleFileChange("orderDetail", null)
                    if (orderDetailInputRef.current) orderDetailInputRef.current.value = ""
                  }}
                  disabled={isSubmitting}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => orderDetailInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    orderDetailInputRef.current?.click()
                  }
                }}
                className="flex items-center justify-center gap-2 rounded border border-dashed border-muted-foreground/30 hover:border-primary/50 bg-background/50 hover:bg-muted/40 py-3 px-4 cursor-pointer transition-colors text-xs text-muted-foreground"
              >
                <UploadCloud className="size-4 text-muted-foreground" />
                <span>
                  {t("inputs.choose_shipping_file", "Click to select Shipping Fee Excel file")}
                </span>
              </div>
            )}
          </div>

          {/* Upload Section: Service Fee File */}
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileSpreadsheet className="size-4 text-sky-600" />
                {t("inputs.detail_files.withdraw_title", "Service Fee File")}
                <span className="text-[10px] text-muted-foreground font-normal">
                  (Payout Report .xlsx)
                </span>
              </Label>
              <a
                href={SERVICE_FEE_SAMPLE_HREF}
                download={SERVICE_FEE_SAMPLE_FILENAME}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                title="Download Service Fee Sample Template"
              >
                <Download className="size-3.5" />
                {t("inputs.download_template", "Download Template")}
              </a>
            </div>

            <input
              ref={withdrawInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                handleFileChange("withdraw", file)
              }}
              disabled={isSubmitting}
            />

            {withdrawFile ? (
              <div className="flex items-center justify-between rounded border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet className="size-4 text-sky-600 shrink-0" />
                  <span className="font-medium truncate">{withdrawFile.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    ({formatFileSize(withdrawFile.size)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => {
                    handleFileChange("withdraw", null)
                    if (withdrawInputRef.current) withdrawInputRef.current.value = ""
                  }}
                  disabled={isSubmitting}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => withdrawInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    withdrawInputRef.current?.click()
                  }
                }}
                className="flex items-center justify-center gap-2 rounded border border-dashed border-muted-foreground/30 hover:border-primary/50 bg-background/50 hover:bg-muted/40 py-3 px-4 cursor-pointer transition-colors text-xs text-muted-foreground"
              >
                <UploadCloud className="size-4 text-muted-foreground" />
                <span>
                  {t("inputs.choose_service_file", "Click to select Service Fee Excel file")}
                </span>
              </div>
            )}
          </div>

          <AuthFormError message={error} />

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("inputs.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-24 gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {uploadStep || t("inputs.creating")}
                </>
              ) : (
                t("inputs.create_submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
