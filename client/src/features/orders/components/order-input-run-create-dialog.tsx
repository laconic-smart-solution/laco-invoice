import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { FileSpreadsheet, FileText, Loader2, UploadCloud, X } from "lucide-react"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import {
  getOrderInputFileTemplate,
} from "@/features/orders/constants/order-input-file-templates"
import { OrderInputTemplateDownload } from "@/features/orders/components/order-input-template-download"
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
  useDetectOrderInputFileTypeMutation,
  useUploadOrderInputOrderDetailMutation,
  useUploadOrderInputWithdrawMutation,
  useUploadOrderInputInvoicePdfMutation,
} from "@/shared/queries/order-input-run.query"
import { useMeProfileQuery } from "@/shared/queries/me.query"
import type { ApiOrderInputFileType } from "@/shared/services/order-input-run.service"
import { isDialogNestedLayer } from "@/shared/utils/dialog-nested-layer"
import { useDialogNestedOverlayOpen } from "@/shared/hooks/use-dialog-nested-overlay-open"

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const { data: meProfile } = useMeProfileQuery(open)
  const createMutation = useCreateOrderInputRunMutation()
  const detectFileTypeMutation = useDetectOrderInputFileTypeMutation()
  const uploadOrderDetailMutation = useUploadOrderInputOrderDetailMutation()
  const uploadWithdrawMutation = useUploadOrderInputWithdrawMutation()
  const uploadInvoicePdfMutation = useUploadOrderInputInvoicePdfMutation()

  const aiAutoChoose = meProfile?.orderInputAiAutoChoose === true

  const [title, setTitle] = useState("")
  const [storeId, setStoreId] = useState("")
  const [marketplaceCode, setMarketplaceCode] =
    useState<MarketplaceCode>("TIKTOK")
  const [inputFileType, setInputFileType] =
    useState<ApiOrderInputFileType>("SHIPPING_FEE")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [invoicePdfFile, setInvoicePdfFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState<string | null>(null)
  const { hasOpenOverlay, onOverlayOpenChange, resetOverlays } =
    useDialogNestedOverlayOpen()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pdfInputRef = useRef<HTMLInputElement | null>(null)

  const isSubmitting =
    createMutation.isPending ||
    detectFileTypeMutation.isPending ||
    uploadOrderDetailMutation.isPending ||
    uploadWithdrawMutation.isPending ||
    uploadInvoicePdfMutation.isPending

  const resolvedFileType: ApiOrderInputFileType = inputFileType
  const isShippingFee = resolvedFileType === "SHIPPING_FEE"
  const showTypeSpecificUpload = !aiAutoChoose || uploadFile != null
  const selectedTemplate = getOrderInputFileTemplate(resolvedFileType)

  useEffect(() => {
    if (!open) {
      return
    }
    setTitle("")
    setStoreId(stores[0] ? String(stores[0].id) : "")
    setMarketplaceCode("TIKTOK")
    setInputFileType("SHIPPING_FEE")
    setUploadFile(null)
    setInvoicePdfFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ""
    }
    setError(null)
    setUploadStep(null)
    resetOverlays()
    createMutation.reset()
    detectFileTypeMutation.reset()
    // Only reset when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-gated reset
  }, [open])

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) {
      return
    }
    onOpenChange(next)
  }

  const shouldIgnoreOutsideDismiss = (target: EventTarget | null) =>
    isSubmitting || isDialogNestedLayer(target) || hasOpenOverlay

  const handleInputFileTypeChange = (value: ApiOrderInputFileType) => {
    setInputFileType(value)
    setUploadFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
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
    if (!uploadFile) {
      setError(t("inputs.errors.file_required"))
      return
    }
    if (!invoicePdfFile) {
      setError(t("inputs.errors.invoice_pdf_required"))
      return
    }

    setError(null)
    try {
      let resolvedInputFileType = inputFileType
      if (aiAutoChoose) {
        setUploadStep(t("inputs.detecting_file_type"))
        const detected = await detectFileTypeMutation.mutateAsync(uploadFile)
        resolvedInputFileType = detected.inputFileType
        setInputFileType(resolvedInputFileType)
      }

      setUploadStep(t("inputs.creating"))
      const data = await createMutation.mutateAsync({
        title: trimmedTitle,
        storeId: parsedStoreId,
        marketplaceCode,
        inputFileType: resolvedInputFileType,
      })

      if (resolvedInputFileType === "SHIPPING_FEE") {
        setUploadStep(t("inputs.uploading_order_detail"))
        await uploadOrderDetailMutation.mutateAsync({
          id: data.id,
          file: uploadFile,
        })
      } else {
        setUploadStep(t("inputs.uploading_withdraw"))
        await uploadWithdrawMutation.mutateAsync({
          id: data.id,
          file: uploadFile,
        })
      }

      setUploadStep(t("inputs.uploading_invoice_pdf"))
      await uploadInvoicePdfMutation.mutateAsync({
        id: data.id,
        file: invoicePdfFile,
      })

      onOpenChange(false)
      onCreated?.(data.id)
    } catch (err: unknown) {
      setError(
        getOrderInputRunErrorMessage(
          err,
          t("inputs.errors.create_failed")
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
          if (shouldIgnoreOutsideDismiss(event.target)) {
            event.preventDefault()
          }
        }}
        onFocusOutside={(event) => {
          if (shouldIgnoreOutsideDismiss(event.target)) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (shouldIgnoreOutsideDismiss(event.target)) {
            event.preventDefault()
          }
        }}
        onEscapeKeyDown={(event) => {
          if (hasOpenOverlay) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("inputs.create_title")}</DialogTitle>
          <DialogDescription>
            {aiAutoChoose
              ? t("inputs.create_modal_subtitle_ai")
              : t("inputs.create_modal_subtitle")}
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
                onOpenChange={onOverlayOpenChange}
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
                onOpenChange={onOverlayOpenChange}
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

          {!aiAutoChoose ? (
            <div className="space-y-1.5">
              <Label>{t("inputs.fields.input_file_type")}</Label>
              <Select
                value={inputFileType}
                onValueChange={(value) =>
                  handleInputFileTypeChange(value as ApiOrderInputFileType)
                }
                onOpenChange={onOverlayOpenChange}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="SHIPPING_FEE">
                    {t("inputs.input_file_type.shipping_fee")}
                  </SelectItem>
                  <SelectItem value="SERVICE_FEE">
                    {t("inputs.input_file_type.service_fee")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="size-4 text-muted-foreground" />
              {t("inputs.upload_invoice_pdf")}
            </Label>
            <p className="text-[11px] text-muted-foreground">
              {t("inputs.upload_invoice_pdf_hint")}
            </p>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setInvoicePdfFile(file)
              }}
              disabled={isSubmitting}
            />
            {invoicePdfFile ? (
              <div className="flex items-center justify-between rounded border border-border bg-background/50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate">{invoicePdfFile.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    ({formatFileSize(invoicePdfFile.size)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => {
                    setInvoicePdfFile(null)
                    if (pdfInputRef.current) pdfInputRef.current.value = ""
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
                onClick={() => pdfInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    pdfInputRef.current?.click()
                  }
                }}
                className="flex items-center justify-center gap-2 rounded border border-dashed border-muted-foreground/30 hover:border-primary/50 bg-background/50 hover:bg-muted/40 py-3 px-4 cursor-pointer transition-colors text-xs text-muted-foreground"
              >
                <UploadCloud className="size-4 text-muted-foreground" />
                <span>{t("inputs.choose_invoice_pdf")}</span>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileSpreadsheet
                  className={`size-4 ${
                    showTypeSpecificUpload
                      ? isShippingFee
                        ? "text-emerald-600"
                        : "text-sky-600"
                      : "text-muted-foreground"
                  }`}
                />
                {aiAutoChoose && !showTypeSpecificUpload
                  ? t("inputs.upload_excel_file")
                  : isShippingFee
                    ? t("inputs.detail.order_detail_title")
                    : t("inputs.detail.withdraw_title")}
                {showTypeSpecificUpload && selectedTemplate ? (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({selectedTemplate.fileHint})
                  </span>
                ) : null}
              </Label>
              <OrderInputTemplateDownload
                selectedType={aiAutoChoose ? undefined : resolvedFileType}
                disabled={isSubmitting}
                onMenuOpenChange={onOverlayOpenChange}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setUploadFile(file)
              }}
              disabled={isSubmitting}
            />

            {uploadFile ? (
              <div
                className={`flex items-center justify-between rounded border px-3 py-2 text-xs ${
                  showTypeSpecificUpload
                    ? isShippingFee
                      ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20"
                    : "border-border bg-background/50"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet
                    className={`size-4 shrink-0 ${
                      showTypeSpecificUpload
                        ? isShippingFee
                          ? "text-emerald-600"
                          : "text-sky-600"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="font-medium truncate">{uploadFile.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    ({formatFileSize(uploadFile.size)})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => {
                    setUploadFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
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
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click()
                  }
                }}
                className="flex items-center justify-center gap-2 rounded border border-dashed border-muted-foreground/30 hover:border-primary/50 bg-background/50 hover:bg-muted/40 py-3 px-4 cursor-pointer transition-colors text-xs text-muted-foreground"
              >
                <UploadCloud className="size-4 text-muted-foreground" />
                <span>
                  {aiAutoChoose
                    ? t("inputs.choose_excel_file")
                    : isShippingFee
                      ? t("inputs.choose_shipping_file")
                      : t("inputs.choose_service_file")}
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
