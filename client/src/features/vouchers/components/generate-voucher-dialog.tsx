import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { BookText, Loader2 } from "lucide-react"

import { ROUTES } from "@/app/constants/routes"
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
import { Form } from "@/components/ui/form"
import { ErpLookupCombobox } from "@/features/vouchers/components/erp-lookup-combobox"
import { VoucherEntryLines } from "@/features/vouchers/components/voucher-entry-lines"
import {
  useErpAccountsQuery,
  useErpCurrenciesQuery,
  useErpDepartmentsQuery,
  useErpItemsQuery,
  useErpVendorsQuery,
} from "@/features/vouchers/queries/erp-lookup.query"
import {
  useGenerateVoucherMutation,
  useUpdateVoucherMutation,
  useVoucherDetailQuery,
} from "@/features/vouchers/queries/voucher.query"
import {
  createGenerateVoucherSchema,
  defaultGenerateVoucherValues,
  fromMonthValue,
  voucherToFormValues,
  type GenerateVoucherFormValues,
} from "@/features/vouchers/schemas/generate-voucher-schema"
import { VOUCHER_CATEGORIES } from "@/features/vouchers/types/voucher"
import { extractApiErrorMessage } from "@/shared/api/extract-api-error-message"
import { useStoresPageQuery } from "@/shared/queries/store.query"

interface GenerateVoucherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucherId?: number | null
}

function toGenerateRequest(values: GenerateVoucherFormValues) {
  return {
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
    externalErpAccountCodeId: Number(values.externalErpAccountCodeId),
    externalErpVendorId: Number(values.externalErpVendorId),
    entries: values.entries.map((entry) => ({
      externalErpAccountCodeId: Number(entry.externalErpAccountCodeId),
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
  const voucherQuery = useVoucherDetailQuery(open && isEdit ? voucherId : null)
  const generateMutation = useGenerateVoucherMutation()
  const updateMutation = useUpdateVoucherMutation()
  const saveMutation = isEdit ? updateMutation : generateMutation

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
    defaultValues: defaultGenerateVoucherValues(),
  })

  useEffect(() => {
    if (!open) {
      return
    }
    generateMutation.reset()
    updateMutation.reset()
    if (isEdit) {
      if (voucherQuery.data) {
        form.reset(voucherToFormValues(voucherQuery.data))
      }
      return
    }
    form.reset(defaultGenerateVoucherValues())
    // Reset only when the dialog opens or the edited voucher loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, voucherQuery.data, form])

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
    form.getValues("entries").forEach((_, index) => {
      form.setValue(`entries.${index}.${field}`, value)
    })
  }

  const storeOptions = (storesQuery.data?.data ?? []).map((store) => ({
    value: String(store.id),
    label: store.name,
  }))

  const categoryOptions = VOUCHER_CATEGORIES.map((category) => ({
    value: category,
    label: t(`category.${category}`),
  }))

  const onSubmit = (values: GenerateVoucherFormValues) => {
    const request = toGenerateRequest(values)
    if (isEdit && voucherId) {
      updateMutation.mutate(
        { id: voucherId, request },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        }
      )
      return
    }
    generateMutation.mutate(request, {
      onSuccess: (created) => {
        onOpenChange(false)
        navigate(ROUTES.dashboard.voucherDetail(created.id))
      },
    })
  }

  const isLoadingEdit = isEdit && voucherQuery.isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl sm:max-w-7xl w-full overflow-hidden p-0 gap-0 border-border bg-card shadow-2xl rounded-none">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex max-h-[90vh] flex-col"
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

              <div className="grid gap-4 md:grid-cols-3">
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
                />
                <FormSelectInput
                  form={form}
                  name="storeId"
                  label={t("form.store")}
                  options={storeOptions}
                  placeholder={t("form.store_placeholder")}
                />
              </div>

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
                />
                <ErpLookupCombobox
                  form={form}
                  name="externalErpAccountCodeId"
                  label={t("form.account")}
                  options={accountsQuery.data ?? []}
                  placeholder={t("form.account_placeholder")}
                  required
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
      </DialogContent>
    </Dialog>
  )
}
