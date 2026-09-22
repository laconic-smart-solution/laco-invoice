import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { BookText, Info, Loader2, RefreshCw, Sparkles } from "lucide-react"

import { ROUTES } from "@/app/constants/routes"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { FormCheckBox } from "@/components/common/form-inputs/form-check-box"
import { FormSelectInput } from "@/components/common/form-inputs/form-select-input"
import { FormTextAreaInput } from "@/components/common/form-inputs/form-text-area-input"
import { FormTextInput } from "@/components/common/form-inputs/form-text-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ErpLookupCombobox } from "@/features/vouchers/components/erp-lookup-combobox"
import { VoucherEntryLines } from "@/features/vouchers/components/voucher-entry-lines"
import {
  useErpAccountsQuery,
  useErpCurrenciesQuery,
  useErpDepartmentsQuery,
  useErpItemFinanceAccountsQuery,
  useErpItemsQuery,
  useErpVendorsQuery,
} from "@/features/vouchers/queries/erp-lookup.query"
import {
  useGenerateVoucherMutation,
  useUpdateVoucherMutation,
  useVoucherDetailQuery,
  useVoucherPreviewMutation,
  useVouchersByOrderInputRunQuery,
} from "@/features/vouchers/queries/voucher.query"
import {
  createGenerateVoucherSchema,
  defaultGenerateVoucherValues,
  fromMonthValue,
  toMonthValue,
  voucherToFormValues,
  type GenerateVoucherFormValues,
} from "@/features/vouchers/schemas/generate-voucher-schema"
import {
  DEFAULT_ERP_CURRENCY_ID,
  DEFAULT_ERP_DEPARTMENT_ID,
  VOUCHER_CATEGORIES,
  type ErpLookupRecord,
  type Voucher,
} from "@/features/vouchers/types/voucher"
import { extractApiErrorMessage } from "@/shared/api/extract-api-error-message"
import { useOrderInputRunsPageQuery } from "@/shared/queries/order-input-run.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"

interface GenerateVoucherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucherId?: number | null
  defaultOrderInputRunId?: number | null
  embedded?: boolean
  onGenerated?: (voucher: Voucher) => void
}

interface GenerateVoucherDialogShellProps {
  embedded: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicateConfirmOpen: boolean
  children: ReactNode
}

function GenerateVoucherDialogShell({
  embedded,
  open,
  onOpenChange,
  duplicateConfirmOpen,
  children,
}: GenerateVoucherDialogShellProps) {
  if (embedded) {
    return <>{children}</>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showMaximizeButton={false}
        className="max-w-7xl sm:max-w-7xl w-full overflow-hidden p-0 gap-0 border-border bg-card shadow-2xl rounded-none"
        onPointerDownOutside={(event) => {
          event.preventDefault()
        }}
        onInteractOutside={(event) => {
          event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          const hasOpenOverlay = Boolean(
            document.querySelector(
              '[data-slot="select-content"], [data-slot="combobox-content"], [data-radix-select-viewport], [data-radix-popper-content-wrapper], [role="listbox"], [data-slot="dropdown-menu-content"]'
            )
          )
          if (hasOpenOverlay || duplicateConfirmOpen) {
            event.preventDefault()
          }
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function parseAccountId(val: string | number | undefined | null): number {
  if (!val) return 0
  const num = Number(val)
  if (!Number.isNaN(num) && num > 0) return num
  const clean = String(val).replace(/[^0-9]/g, "")
  return Number(clean) || 0
}

function toGenerateRequest(values: GenerateVoucherFormValues) {
  return {
    orderInputRunId: values.orderInputRunId ? Number(values.orderInputRunId) : null,
    storeId: values.storeId ? Number(values.storeId) : null,
    voucherCategory: values.voucherCategory,
    voucherDate: values.voucherDate,
    taxMonth: fromMonthValue(values.taxMonth),
    whtMonth: fromMonthValue(values.whtMonth),
    voucherBrief: values.voucherBrief,
    voucherDescription: values.voucherDescription || null,
    noTaxInvoice: values.noTaxInvoice,
    rejectRemark: values.rejectRemark?.trim() || null,
    externalErpItemId: Number(values.externalErpItemId),
    externalErpAccountCodeId: parseAccountId(values.externalErpAccountCodeId),
    externalErpVendorId: Number(values.externalErpVendorId),
    entries: values.entries.map((entry) => ({
      externalErpAccountCodeId: parseAccountId(entry.externalErpAccountCodeId),
      debit: Number(entry.debit || 0),
      credit: Number(entry.credit || 0),
      invoiceNo: entry.invoiceNo || null,
      invoiceDate: entry.invoiceDate || null,
      externalErpDepartmentId: entry.externalErpDepartmentId
        ? Number(entry.externalErpDepartmentId)
        : null,
      exchangeRate: Number(entry.exchangeRate || 1),
      externalErpCurrencyId: entry.externalErpCurrencyId
        ? Number(entry.externalErpCurrencyId)
        : null,
    })),
  }
}

export function GenerateVoucherDialog({
  open,
  onOpenChange,
  voucherId = null,
  defaultOrderInputRunId = null,
  embedded = false,
  onGenerated,
}: GenerateVoucherDialogProps) {
  const { t } = useTranslation("vouchers")
  const navigate = useNavigate()
  const isEdit = voucherId != null && voucherId > 0
  const itemsQuery = useErpItemsQuery()
  const accountsQuery = useErpAccountsQuery()
  const vendorsQuery = useErpVendorsQuery()
  const departmentsQuery = useErpDepartmentsQuery()
  const currenciesQuery = useErpCurrenciesQuery()
  const storesQuery = useStoresPageQuery({ pageNumber: 1, pageSize: 200 })
  const runsQuery = useOrderInputRunsPageQuery({
    pageNumber: 1,
    pageSize: 200,
    sortBy: "createdAt",
    sortOrder: "DESC",
    filter: { status: "COMPLETED" },
  })
  const voucherQuery = useVoucherDetailQuery(open && isEdit ? voucherId : null)
  const generateMutation = useGenerateVoucherMutation()
  const updateMutation = useUpdateVoucherMutation()
  const previewMutation = useVoucherPreviewMutation()
  const saveMutation = isEdit ? updateMutation : generateMutation
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false)
  const [pendingGenerateValues, setPendingGenerateValues] =
    useState<GenerateVoucherFormValues | null>(null)

  const schema = useMemo(
    () =>
      createGenerateVoucherSchema({
        briefRequired: t("form.validation.brief_required"),
        itemRequired: t("form.validation.item_required"),
        accountRequired: t("form.validation.account_required"),
        vendorRequired: t("form.validation.vendor_required"),
        entryAccountRequired: t("form.validation.entry_account_required"),
        invalidAmount: t("form.validation.invalid_amount"),
        entryAmountRequired: t("form.validation.entry_amount_required"),
        bothDebitCredit: t("form.validation.both_debit_credit"),
        unbalanced: t("form.validation.unbalanced"),
        invalidRate: t("form.validation.invalid_rate"),
      }),
    [t]
  )

  const form = useForm<GenerateVoucherFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultGenerateVoucherValues(defaultOrderInputRunId),
  })

  const selectedItemId = form.watch("externalErpItemId")
  const selectedRunId = form.watch("orderInputRunId")
  const currentStoreId = form.watch("storeId")
  const selectedFinanceValue = form.watch("selectedFinanceAccountId")
  const noTaxInvoiceValue = form.watch("noTaxInvoice")
  const prevFinanceValueRef = useRef<string>("")
  const prevNoTaxRef = useRef<boolean>(false)

  const selectedRunIdNumber =
    selectedRunId && Number.isFinite(Number(selectedRunId)) && Number(selectedRunId) > 0
      ? Number(selectedRunId)
      : null
  const existingVouchersQuery = useVouchersByOrderInputRunQuery(
    open && !isEdit ? selectedRunIdNumber : null
  )
  const existingVouchersForRun = existingVouchersQuery.data ?? []

  const selectedRun = useMemo(
    () =>
      (runsQuery.data?.data ?? []).find(
        (r) => String(r.id) === String(selectedRunId)
      ),
    [runsQuery.data?.data, selectedRunId]
  )

  const currentStoreName = useMemo(() => {
    if (selectedRun?.storeName) return selectedRun.storeName
    if (currentStoreId) {
      const match = (storesQuery.data?.data ?? []).find(
        (s) => String(s.id) === String(currentStoreId)
      )
      if (match) return match.name
    }
    return ""
  }, [selectedRun?.storeName, currentStoreId, storesQuery.data?.data])

  useEffect(() => {
    if (selectedRun?.storeId != null) {
      form.setValue("storeId", String(selectedRun.storeId))
    }
  }, [selectedRun?.storeId, form])

  const financeAccountsQuery = useErpItemFinanceAccountsQuery(
    selectedItemId ? Number(selectedItemId) : null
  )
  const financeAccounts = useMemo(
    () => financeAccountsQuery.data ?? [],
    [financeAccountsQuery.data]
  )

  const financeOptions = useMemo(() => {
    const opts: {
      value: string
      label: string
      partnerTypeId: number
      debitAccountId: number
      creditAccountId?: number | null
    }[] = []
    financeAccounts.forEach((fa) => {
      if (fa.purchaseAccountId) {
        opts.push({
          value: `${fa.tradingPartnerTypeId}:PURCHASE:${fa.purchaseAccountId}`,
          label: `${fa.tradingPartnerTypeName} — Purchase / Expense (${fa.purchaseAccountCode ?? ""} ${fa.purchaseAccountTitle ?? ""})`,
          partnerTypeId: fa.tradingPartnerTypeId,
          debitAccountId: fa.purchaseAccountId,
          creditAccountId: fa.depositAccountId,
        })
      }
      if (fa.saleAccountId) {
        opts.push({
          value: `${fa.tradingPartnerTypeId}:SALE:${fa.saleAccountId}`,
          label: `${fa.tradingPartnerTypeName} — Sale / Revenue (${fa.saleAccountCode ?? ""} ${fa.saleAccountTitle ?? ""})`,
          partnerTypeId: fa.tradingPartnerTypeId,
          debitAccountId: fa.saleAccountId,
          creditAccountId: fa.depositAccountId,
        })
      }
    })
    return opts
  }, [financeAccounts])

  const handleApplyPreview = (
    runId: number,
    itemId?: number | null,
    partnerTypeId?: number | null,
    debitAccId?: number | null,
    creditAccId?: number | null,
    noTax?: boolean
  ) => {
    previewMutation.mutate(
      {
        orderInputRunId: runId,
        externalErpItemId: itemId ?? undefined,
        tradingPartnerTypeId: partnerTypeId ?? undefined,
        debitAccountId: debitAccId ?? undefined,
        creditAccountId: creditAccId ?? undefined,
        noTaxInvoice: noTax !== undefined ? noTax : form.getValues("noTaxInvoice"),
      },
      {
        onSuccess: (preview) => {
          if (preview.storeId != null) {
            form.setValue("storeId", String(preview.storeId))
          }
          if (preview.voucherCategory && !form.getFieldState("voucherCategory").isDirty) {
            form.setValue("voucherCategory", preview.voucherCategory)
          }
          if (preview.voucherDate) {
            form.setValue("voucherDate", preview.voucherDate)
          }
          if (preview.taxMonth) {
            form.setValue("taxMonth", toMonthValue(preview.taxMonth))
          }
          if (preview.whtMonth) {
            form.setValue("whtMonth", toMonthValue(preview.whtMonth))
          }
          if (preview.voucherBrief) {
            form.setValue("voucherBrief", preview.voucherBrief)
          }
          if (preview.voucherDescription) {
            form.setValue("voucherDescription", preview.voucherDescription)
          }
          if (preview.noTaxInvoice != null) {
            form.setValue("noTaxInvoice", preview.noTaxInvoice)
          }
          if (preview.externalErpItemId != null) {
            form.setValue("externalErpItemId", String(preview.externalErpItemId))
          }
          if (preview.externalErpAccountCodeId != null) {
            form.setValue(
              "externalErpAccountCodeId",
              String(preview.externalErpAccountCodeId)
            )
          }
          if (preview.externalErpVendorId != null) {
            form.setValue(
              "externalErpVendorId",
              String(preview.externalErpVendorId)
            )
          }
          if (preview.externalErpDepartmentId != null) {
            form.setValue(
              "externalErpDepartmentId",
              String(preview.externalErpDepartmentId)
            )
          }
          if (preview.externalErpCurrencyId != null) {
            form.setValue(
              "externalErpCurrencyId",
              String(preview.externalErpCurrencyId)
            )
          }
          if (preview.entries && preview.entries.length > 0) {
            form.setValue(
              "entries",
              preview.entries.map((entry) => ({
                externalErpAccountCodeId: String(entry.externalErpAccountCodeId),
                debit: entry.debit ? String(entry.debit) : "",
                credit: entry.credit ? String(entry.credit) : "",
                invoiceNo: entry.invoiceNo ?? "",
                invoiceDate: entry.invoiceDate ?? "",
                externalErpDepartmentId: String(
                  entry.externalErpDepartmentId ?? DEFAULT_ERP_DEPARTMENT_ID
                ),
                exchangeRate: String(entry.exchangeRate ?? 1),
                externalErpCurrencyId: String(
                  entry.externalErpCurrencyId ?? DEFAULT_ERP_CURRENCY_ID
                ),
              }))
            )
          }
        },
      }
    )
  }

  useEffect(() => {
    if (!open) {
      setDuplicateConfirmOpen(false)
      setPendingGenerateValues(null)
      return
    }
    generateMutation.reset()
    updateMutation.reset()
    previewMutation.reset()
    prevFinanceValueRef.current = ""
    prevNoTaxRef.current = false
    setDuplicateConfirmOpen(false)
    setPendingGenerateValues(null)
    if (isEdit) {
      if (voucherQuery.data) {
        form.reset(voucherToFormValues(voucherQuery.data))
      }
      return
    }
    form.reset(defaultGenerateVoucherValues(defaultOrderInputRunId))
    if (defaultOrderInputRunId) {
      handleApplyPreview(defaultOrderInputRunId)
    }
    // Reset only when the dialog opens or the edited voucher loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, voucherQuery.data, defaultOrderInputRunId])

  useEffect(() => {
    if (isEdit || !open) {
      prevNoTaxRef.current = noTaxInvoiceValue
      return
    }
    if (prevNoTaxRef.current === noTaxInvoiceValue) return
    prevNoTaxRef.current = noTaxInvoiceValue

    const runId = form.getValues("orderInputRunId")
    if (runId) {
      handleApplyPreview(
        Number(runId),
        selectedItemId ? Number(selectedItemId) : null,
        undefined,
        undefined,
        undefined,
        noTaxInvoiceValue
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noTaxInvoiceValue, open, isEdit, selectedItemId])

  useEffect(() => {
    if (!selectedFinanceValue || selectedFinanceValue === prevFinanceValueRef.current) {
      return
    }
    prevFinanceValueRef.current = selectedFinanceValue
    const selected = financeOptions.find((o) => o.value === selectedFinanceValue)
    if (!selected) return

    form.setValue("tradingPartnerTypeId", String(selected.partnerTypeId))

    const runId = form.getValues("orderInputRunId")
    if (runId) {
      handleApplyPreview(
        Number(runId),
        selectedItemId ? Number(selectedItemId) : null,
        selected.partnerTypeId,
        selected.debitAccountId,
        selected.creditAccountId
      )
    } else {
      form.setValue("entries.0.externalErpAccountCodeId", String(selected.debitAccountId))
      if (selected.creditAccountId) {
        form.setValue("entries.1.externalErpAccountCodeId", String(selected.creditAccountId))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFinanceValue, financeOptions, selectedItemId])

  const applyToEntries = (
    field:
      | "externalErpAccountCodeId"
      | "externalErpDepartmentId"
      | "externalErpCurrencyId",
    value: string
  ) => {
    if (!value) {
      return
    }
    form.getValues("entries").forEach((entry, index) => {
      if (
        field === "externalErpAccountCodeId" &&
        (entry.externalErpAccountCodeId === "21400070" ||
          entry.externalErpAccountCodeId === "21400060")
      ) {
        return
      }
      form.setValue(`entries.${index}.${field}`, value)
    })
  }


  const runOptions = useMemo<ErpLookupRecord[]>(
    () =>
      (runsQuery.data?.data ?? [])
        .filter(
          (run) =>
            run.status === "COMPLETED" ||
            (selectedRunId != null && String(run.id) === String(selectedRunId))
        )
        .map((run) => {
          const amount = run.invoiceTotalAmount ?? run.excelMatchedAmount
          const amountStr =
            amount != null
              ? ` · ฿${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : ""
          const storeStr = run.storeName ? ` [${run.storeName}]` : ""
          return {
            id: run.id,
            code: `#${run.id}`,
            name: `${run.title || "Order Run"}${storeStr}${amountStr}`,
          }
        }),
    [runsQuery.data, selectedRunId]
  )

  const categoryOptions = VOUCHER_CATEGORIES.map((category) => ({
    value: category,
    label: t(`category.${category}`),
  }))

  const submitGenerate = async (values: GenerateVoucherFormValues) => {
    const created = await generateMutation.mutateAsync(toGenerateRequest(values))
    setDuplicateConfirmOpen(false)
    setPendingGenerateValues(null)
    onOpenChange(false)
    if (onGenerated) {
      onGenerated(created)
      return
    }
    navigate(ROUTES.dashboard.voucherDetail(created.id))
  }

  const onSubmit = async (values: GenerateVoucherFormValues) => {
    if (isEdit && voucherId) {
      updateMutation.mutate(
        { id: voucherId, request: toGenerateRequest(values) },
        {
          onSuccess: (updated) => {
            onOpenChange(false)
            if (onGenerated) {
              onGenerated(updated)
            }
          },
        }
      )
      return
    }

    let existing = existingVouchersForRun
    if (selectedRunIdNumber) {
      const refreshed = await existingVouchersQuery.refetch()
      existing = refreshed.data ?? []
    }

    if (existing.length > 0) {
      setPendingGenerateValues(values)
      setDuplicateConfirmOpen(true)
      return
    }
    await submitGenerate(values)
  }

  const existingVoucherNumbers = existingVouchersForRun
    .map((voucher) => voucher.voucherNumber)
    .filter((number): number is string => Boolean(number?.trim()))
    .join(", ")

  const isLoadingEdit = isEdit && voucherQuery.isLoading

  const alignedFieldClassName =
    "h-10 px-3 py-2 text-sm"

  const voucherSummaryFields = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
      <FormSelectInput
        form={form}
        name="voucherCategory"
        label={t("form.category")}
        options={categoryOptions}
        required
      />
      <FormTextInput
        form={form}
        name="voucherDate"
        label={t("form.date")}
        type="date"
        required
        className={alignedFieldClassName}
      />
      <div className="w-full space-y-2">
        <FormLabel className="text-foreground">{t("form.store")}</FormLabel>
        <Input
          readOnly
          tabIndex={-1}
          value={currentStoreName}
          placeholder={t("form.store_placeholder", "Associated from order set")}
          className={cn(
            alignedFieldClassName,
            "cursor-default bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:border-input focus-visible:ring-0"
          )}
        />
      </div>
    </div>
  )

  return (
    <>
    <GenerateVoucherDialogShell
      embedded={embedded}
      open={open}
      onOpenChange={onOpenChange}
      duplicateConfirmOpen={duplicateConfirmOpen}
    >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn(
              "flex flex-col",
              embedded
                ? "max-h-none"
                : "max-h-[90vh] group-data-[maximized=true]/dialog:h-full group-data-[maximized=true]/dialog:max-h-none"
            )}
          >
            <div className="border-b border-border/80 bg-muted/20 px-6 py-5">
              <DialogHeader className="space-y-1 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-none border border-primary/20 bg-primary/10 text-primary">
                    <BookText className="size-5" />
                  </div>
                  <div>
                    <DialogTitle className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
                      {isEdit ? t("edit") : t("generate")}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {isEdit ? t("edit_subtitle") : t("generate_subtitle")}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-5 overflow-y-auto px-6 py-5">
              {isLoadingEdit ? (
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              ) : null}

              {!isEdit && (
                <div className="rounded-none border border-border/80 bg-muted/20 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">
                        {t("form.order_input")}
                      </h4>
                      {selectedRunId ? (
                        <span className="inline-flex items-center rounded-none bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/20">
                          {t("form.auto_calculated_badge")}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      {previewMutation.isPending ? (
                        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>{t("form.calculating_preview")}</span>
                        </div>
                      ) : null}
                      {selectedRunId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={previewMutation.isPending}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            handleApplyPreview(
                              Number(selectedRunId),
                              selectedItemId ? Number(selectedItemId) : null
                            )
                          }}
                        >
                          <RefreshCw className="mr-1 size-3" />
                          {t("form.recalculate")}
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("form.order_input_description")}
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ErpLookupCombobox
                      form={form}
                      name="orderInputRunId"
                      label={t("form.order_input")}
                      options={runOptions}
                      placeholder={t("form.order_input_placeholder")}
                      onChange={(value) => {
                        if (value) {
                          handleApplyPreview(
                            Number(value),
                            selectedItemId ? Number(selectedItemId) : null
                          )
                        }
                      }}
                    />

                    {financeOptions.length > 0 ? (
                      <FormSelectInput
                        form={form}
                        name="selectedFinanceAccountId"
                        label={
                          <span className="inline-flex items-center gap-1.5">
                            {t("form.finance_info")}
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    aria-label={t("form.finance_info_description")}
                                  >
                                    <Info className="size-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  align="start"
                                  className="max-w-xs rounded-md border border-border bg-popover p-3 text-xs leading-relaxed text-popover-foreground shadow-xl"
                                >
                                  {t("form.finance_info_description")}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                        }
                        options={financeOptions}
                        placeholder={t("form.finance_info_placeholder")}
                      />
                    ) : null}
                  </div>

                  {voucherSummaryFields}
                </div>
              )}

              {isEdit ? voucherSummaryFields : null}

              <div className="grid gap-4 md:grid-cols-3">
                <FormTextInput
                  form={form}
                  name="taxMonth"
                  label={t("form.tax_month")}
                  type="month"
                />
                <FormTextInput
                  form={form}
                  name="whtMonth"
                  label={t("form.wht_month")}
                  type="month"
                />
                <FormCheckBox
                  form={form}
                  name="noTaxInvoice"
                  label={t("form.no_tax_invoice")}
                  wrapperClass="pt-8"
                />
              </div>

              <FormTextInput
                form={form}
                name="voucherBrief"
                label={t("form.brief")}
                placeholder={t("form.brief_placeholder")}
                required
              />
              <FormTextAreaInput
                form={form}
                name="voucherDescription"
                label={t("form.description")}
                placeholder={t("form.description_placeholder")}
                className="min-h-20"
              />
              <FormTextAreaInput
                form={form}
                name="rejectRemark"
                label={t("form.reject_remark")}
                placeholder={t("form.reject_remark_placeholder")}
                className="min-h-20"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <ErpLookupCombobox
                  form={form}
                  name="externalErpItemId"
                  label={t("form.item")}
                  options={itemsQuery.data ?? []}
                  placeholder={t("form.item_placeholder")}
                  required
                  onChange={(value) => {
                    const runId = form.getValues("orderInputRunId")
                    if (runId && value) {
                      handleApplyPreview(Number(runId), Number(value))
                    }
                  }}
                />
                <ErpLookupCombobox
                  form={form}
                  name="externalErpAccountCodeId"
                  label={t("form.account")}
                  options={accountsQuery.data ?? []}
                  placeholder={t("form.account_placeholder")}
                  required
                  allowCustomValue
                  onChange={(value) =>
                    applyToEntries("externalErpAccountCodeId", value)
                  }
                />
                <ErpLookupCombobox
                  form={form}
                  name="externalErpVendorId"
                  label={t("form.vendor")}
                  options={vendorsQuery.data ?? []}
                  placeholder={t("form.vendor_placeholder")}
                  required
                />
                <ErpLookupCombobox
                  form={form}
                  name="externalErpDepartmentId"
                  label={t("form.department")}
                  options={departmentsQuery.data ?? []}
                  placeholder={t("form.department_placeholder")}
                  onChange={(value) =>
                    applyToEntries("externalErpDepartmentId", value)
                  }
                />
                <ErpLookupCombobox
                  form={form}
                  name="externalErpCurrencyId"
                  label={t("form.currency")}
                  options={currenciesQuery.data ?? []}
                  placeholder={t("form.currency_placeholder")}
                  onChange={(value) =>
                    applyToEntries("externalErpCurrencyId", value)
                  }
                />
              </div>

              <VoucherEntryLines
                form={form}
                accounts={accountsQuery.data ?? []}
                departments={departmentsQuery.data ?? []}
                currencies={currenciesQuery.data ?? []}
              />

              {saveMutation.isError ? (
                <p className="text-xs text-destructive">
                  {extractApiErrorMessage(
                    saveMutation.error,
                    isEdit ? t("errors.update_failed") : t("errors.generate_failed")
                  )}
                </p>
              ) : null}
            </div>

            <DialogFooter className="border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => onOpenChange(false)}
              >
                {t("form.cancel")}
              </Button>
              <Button
                type="submit"
                className="rounded-none bg-primary text-primary-foreground"
                disabled={saveMutation.isPending || isLoadingEdit}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {isEdit ? t("form.save") : t("generate")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
    </GenerateVoucherDialogShell>

      <ConfirmDialog
        open={duplicateConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (generateMutation.isPending) {
            return
          }
          setDuplicateConfirmOpen(nextOpen)
          if (!nextOpen) {
            setPendingGenerateValues(null)
          }
        }}
        title={t("duplicate_order_set.title")}
        description={
          existingVoucherNumbers
            ? t("duplicate_order_set.description_with_numbers", {
                numbers: existingVoucherNumbers,
              })
            : t("duplicate_order_set.description")
        }
        confirmLabel={t("duplicate_order_set.confirm")}
        cancelLabel={t("form.cancel")}
        isLoading={generateMutation.isPending}
        onConfirm={async () => {
          if (!pendingGenerateValues) {
            return
          }
          await submitGenerate(pendingGenerateValues)
        }}
      />
    </>
  )
}
