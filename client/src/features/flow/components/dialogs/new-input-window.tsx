import { useState, type FormEvent } from "react"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FLOW_STORES_LIST_REQUEST } from "@/features/flow/data/flow-constants"
import { FlowFileUploadField } from "@/features/flow/components/dialogs/flow-file-upload-field"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
import { ORDER_INPUT_FILE_TEMPLATES } from "@/features/orders/constants/order-input-file-templates"
import {
  SUPPORTED_MARKETPLACES,
  type MarketplaceCode,
} from "@/features/stores/config/marketplaces"
import { useMeProfileQuery } from "@/shared/queries/me.query"
import {
  getOrderInputRunErrorMessage,
  useCreateOrderInputRunMutation,
  useDetectOrderInputFileTypeMutation,
  useUploadOrderInputInvoicePdfMutation,
  useUploadOrderInputOrderDetailMutation,
  useUploadOrderInputWithdrawMutation,
} from "@/shared/queries/order-input-run.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import type { ApiOrderInputFileType } from "@/shared/services/order-input-run.service"

interface NewInputWindowProps {
  onCreated?: (inputRunId: number) => void
}

interface NewInputErrors {
  title?: string
  store?: string
  invoice?: boolean
  excel?: boolean
}

export function NewInputWindow({ onCreated }: NewInputWindowProps) {
  const { t } = useTranslation("orders")
  const close = useFlowWindowsStore((state) => state.close)
  const { data: storesResponse } = useStoresPageQuery(FLOW_STORES_LIST_REQUEST)
  const stores = Array.isArray(storesResponse?.data) ? storesResponse.data : []
  const { data: meProfile } = useMeProfileQuery(true)
  const createMutation = useCreateOrderInputRunMutation()
  const detectFileTypeMutation = useDetectOrderInputFileTypeMutation()
  const uploadOrderDetailMutation = useUploadOrderInputOrderDetailMutation()
  const uploadWithdrawMutation = useUploadOrderInputWithdrawMutation()
  const uploadInvoicePdfMutation = useUploadOrderInputInvoicePdfMutation()

  const [title, setTitle] = useState("")
  const [storeId, setStoreId] = useState("")
  const [marketplace, setMarketplace] = useState<MarketplaceCode>("TIKTOK")
  const [inputType, setInputType] =
    useState<ApiOrderInputFileType>("SHIPPING_FEE")
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<NewInputErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState<string | null>(null)

  const aiAutoChoose = meProfile?.orderInputAiAutoChoose === true
  const isSubmitting =
    createMutation.isPending ||
    detectFileTypeMutation.isPending ||
    uploadOrderDetailMutation.isPending ||
    uploadWithdrawMutation.isPending ||
    uploadInvoicePdfMutation.isPending

  const handleStoreChange = (nextStoreId: string) => {
    setStoreId(nextStoreId)
    setErrors((current) => ({ ...current, store: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: NewInputErrors = {}
    if (!title.trim()) nextErrors.title = t("inputs.errors.title_required", "Title is required")
    if (!storeId) nextErrors.store = t("inputs.errors.store_required", "Store is required")
    if (!invoiceFile) nextErrors.invoice = true
    if (!excelFile) nextErrors.excel = true
    setErrors(nextErrors)
    setSubmitError(null)
    if (Object.keys(nextErrors).length > 0) return

    try {
      let resolvedInputFileType = inputType
      if (aiAutoChoose && excelFile) {
        setUploadStep(t("inputs.detecting_file_type"))
        const detected = await detectFileTypeMutation.mutateAsync(excelFile)
        resolvedInputFileType = detected.inputFileType
        setInputType(resolvedInputFileType)
      }

      setUploadStep(t("inputs.creating"))
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        storeId: Number(storeId),
        marketplaceCode: marketplace,
        inputFileType: resolvedInputFileType,
      })

      if (resolvedInputFileType === "SHIPPING_FEE") {
        setUploadStep(t("inputs.uploading_order_detail"))
        await uploadOrderDetailMutation.mutateAsync({
          id: created.id,
          file: excelFile as File,
        })
      } else {
        setUploadStep(t("inputs.uploading_withdraw"))
        await uploadWithdrawMutation.mutateAsync({
          id: created.id,
          file: excelFile as File,
        })
      }

      setUploadStep(t("inputs.uploading_invoice_pdf"))
      await uploadInvoicePdfMutation.mutateAsync({
        id: created.id,
        file: invoiceFile as File,
      })

      onCreated?.(created.id)
      close("new-input")
    } catch (err: unknown) {
      setSubmitError(
        getOrderInputRunErrorMessage(err, t("inputs.errors.create_failed"))
      )
    } finally {
      setUploadStep(null)
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-1.5">
        <Label htmlFor="flow-new-title">
          {t("inputs.fields.title")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="flow-new-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setErrors((current) => ({ ...current, title: undefined }))
          }}
          placeholder={t("inputs.fields.title_placeholder")}
          maxLength={200}
          disabled={isSubmitting}
          className="rounded-lg"
        />
        {errors.title ? (
          <p role="alert" className="text-[11px] text-destructive">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>
            {t("inputs.fields.store")} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={storeId || undefined}
            onValueChange={handleStoreChange}
            disabled={isSubmitting || stores.length === 0}
          >
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue placeholder={t("inputs.fields.store_placeholder")} />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[700]">
              {stores.map((store) => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.store ? (
            <p role="alert" className="text-[11px] text-destructive">
              {errors.store}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label>{t("inputs.fields.marketplace")}</Label>
          <Select
            value={marketplace}
            onValueChange={(value) => setMarketplace(value as MarketplaceCode)}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[700]">
              {SUPPORTED_MARKETPLACES.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.code}
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
            value={inputType}
            onValueChange={(value) => {
              setInputType(value as ApiOrderInputFileType)
              setExcelFile(null)
              setErrors((current) => ({ ...current, excel: undefined }))
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[700]">
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

      <FlowFileUploadField
        label={t("inputs.upload_invoice_pdf")}
        hint={t("inputs.upload_invoice_pdf_hint")}
        accept="application/pdf,.pdf"
        file={invoiceFile}
        onFileChange={(file) => {
          setInvoiceFile(file)
          setErrors((current) => ({ ...current, invoice: undefined }))
        }}
        kind="pdf"
        error={errors.invoice}
      />

      <FlowFileUploadField
        label={
          inputType === "SHIPPING_FEE"
            ? t("inputs.detail.order_detail_title")
            : t("inputs.detail.withdraw_title")
        }
        hint={
          inputType === "SHIPPING_FEE"
            ? t("inputs.detail.order_detail_description")
            : t("inputs.detail.withdraw_description")
        }
        accept=".xlsx,.xls,.csv"
        file={excelFile}
        onFileChange={(file) => {
          setExcelFile(file)
          setErrors((current) => ({ ...current, excel: undefined }))
        }}
        kind="excel"
        error={errors.excel}
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 rounded-lg"
                disabled={isSubmitting}
              >
                <Download className="size-3.5" />
                {t("inputs.detail.download_sample")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[700] w-64 rounded-xl">
              {ORDER_INPUT_FILE_TEMPLATES.map((template) => (
                <DropdownMenuItem key={template.type} asChild className="rounded-lg">
                  <a href={template.href} download={template.downloadFilename}>
                    <FileSpreadsheet className="size-4" />
                    <span className="flex-1">
                      <strong className="block text-xs">
                        {template.type === "SHIPPING_FEE"
                          ? t("inputs.input_file_type.shipping_fee")
                          : t("inputs.input_file_type.service_fee")}
                      </strong>
                    </span>
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <AuthFormError message={submitError} />

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-border bg-card px-5 pt-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          disabled={isSubmitting}
          onClick={() => close("new-input")}
        >
          {t("inputs.cancel")}
        </Button>
        <Button type="submit" className="rounded-lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {uploadStep || t("inputs.creating")}
            </>
          ) : (
            t("inputs.create_submit")
          )}
        </Button>
      </div>
    </form>
  )
}
