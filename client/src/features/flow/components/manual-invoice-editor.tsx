import { useEffect, useMemo, useRef } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react"

import { FormSelectInput } from "@/components/common/form-inputs/form-select-input"
import { FormTextAreaInput } from "@/components/common/form-inputs/form-text-area-input"
import { FormTextInput } from "@/components/common/form-inputs/form-text-input"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  useManualInvoicePreviewMutation,
  useSaveManualInvoiceMutation,
} from "@/features/invoices/queries/invoice.query"
import {
  createManualInvoiceSchema,
  defaultManualInvoiceValues,
  emptyManualInvoiceLine,
  manualInvoiceToFormValues,
  toManualInvoiceRequest,
  type ManualInvoiceFormValues,
} from "@/features/invoices/schemas/manual-invoice-schema"
import type { InvoiceDetail } from "@/features/invoices/types/invoice"
import { calculateManualInvoiceTotals } from "@/features/flow/util/manual-invoice"
import { SUPPORTED_MARKETPLACES } from "@/features/stores/config/marketplaces"
import { extractApiErrorMessage } from "@/shared/api/extract-api-error-message"
import { useStoresPageQuery } from "@/shared/queries/store.query"

interface ManualInvoiceEditorProps {
  invoice: InvoiceDetail | null
  onSaved: (invoiceId: number) => void
}

export function ManualInvoiceEditor({
  invoice,
  onSaved,
}: ManualInvoiceEditorProps) {
  const { t } = useTranslation("flow")
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const schema = useMemo(
    () =>
      createManualInvoiceSchema({
        required: t("manual.validation.required"),
        positive: t("manual.validation.positive"),
        dateRange: t("manual.validation.date_range"),
        lineRequired: t("manual.validation.line_required"),
      }),
    [t]
  )
  const form = useForm<ManualInvoiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultManualInvoiceValues(),
  })
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "lines",
  })
  const lines = useWatch({ control: form.control, name: "lines" })
  const vatRate = Number(useWatch({ control: form.control, name: "vatRate" }) || 0)
  const storesQuery = useStoresPageQuery({ pageNumber: 1, pageSize: 200 })
  const previewMutation = useManualInvoicePreviewMutation()
  const saveMutation = useSaveManualInvoiceMutation()
  const errorMessages = Object.values(form.formState.errors)
    .flatMap((error) => {
      if (!error) return []
      if ("message" in error && typeof error.message === "string") {
        return [error.message]
      }
      return []
    })
    .filter((message, index, all) => all.indexOf(message) === index)

  useEffect(() => {
    form.reset(
      invoice ? manualInvoiceToFormValues(invoice) : defaultManualInvoiceValues()
    )
    previewMutation.reset()
    saveMutation.reset()
    // Reset only when selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id])

  useEffect(() => {
    if (form.formState.submitCount === 0 || errorMessages.length === 0) {
      return
    }
    const frame = requestAnimationFrame(() => {
      errorSummaryRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [errorMessages.length, form.formState.submitCount])

  const localTotals = useMemo(
    () =>
      calculateManualInvoiceTotals(
        (lines ?? []).map((line) => ({
          quantity: Number(line.quantity || 0),
          unitPrice: Number(line.unitPrice || 0),
          discount: Number(line.discount || 0),
        })),
        vatRate
      ),
    [lines, vatRate]
  )

  const marketplaceOptions = SUPPORTED_MARKETPLACES.map((marketplace) => ({
    value: marketplace.code,
    label: marketplace.code,
  }))
  const storeOptions = (storesQuery.data?.data ?? []).map((store) => ({
    value: String(store.id),
    label: store.name,
  }))
  const preview = previewMutation.data
  const totals = preview ?? localTotals

  const previewInvoice = form.handleSubmit((values) =>
    previewMutation.mutate(toManualInvoiceRequest(values))
  )
  const saveInvoice = form.handleSubmit(async (values) => {
    const saved = await saveMutation.mutateAsync({
      id: invoice?.id,
      request: toManualInvoiceRequest(values),
    })
    onSaved(saved.id)
  })

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={saveInvoice}>
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className={
            errorMessages.length
              ? "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              : "sr-only"
          }
        >
          <strong>{t("manual.error_summary")}</strong>
          {errorMessages.length ? (
            <ul className="mt-1 list-disc pl-5">
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <fieldset className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">
            {t("manual.sections.header")}
          </legend>
          <FormTextInput
            form={form}
            name="invoiceNumber"
            label={t("manual.fields.invoice_number")}
          />
          <FormTextInput
            form={form}
            name="title"
            label={t("manual.fields.title")}
            required
          />
          <FormSelectInput
            form={form}
            name="storeId"
            label={t("manual.fields.store")}
            options={storeOptions}
            placeholder={t("manual.fields.store_placeholder")}
            required
          />
          <FormSelectInput
            form={form}
            name="marketplaceCode"
            label={t("manual.fields.marketplace")}
            options={marketplaceOptions}
            placeholder={t("manual.fields.marketplace_placeholder")}
            required
          />
          <FormTextInput
            form={form}
            name="startDate"
            label={t("manual.fields.start_date")}
            type="date"
            required
          />
          <FormTextInput
            form={form}
            name="endDate"
            label={t("manual.fields.end_date")}
            type="date"
            required
          />
          <FormTextInput
            form={form}
            name="currency"
            label={t("manual.fields.currency")}
            required
          />
          <FormTextInput
            form={form}
            name="vatRate"
            label={t("manual.fields.vat_rate")}
            inputMode="decimal"
            required
          />
        </fieldset>

        <fieldset className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">
            {t("manual.sections.buyer")}
          </legend>
          <FormTextInput
            form={form}
            name="buyerName"
            label={t("manual.fields.buyer_name")}
          />
          <FormTextInput
            form={form}
            name="buyerTaxId"
            label={t("manual.fields.buyer_tax_id")}
          />
          <FormTextAreaInput
            form={form}
            name="buyerAddress"
            label={t("manual.fields.buyer_address")}
            className="md:col-span-2"
          />
          <FormTextAreaInput
            form={form}
            name="notes"
            label={t("manual.fields.notes")}
            className="md:col-span-2"
          />
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border border-border p-4">
          <legend className="px-2 text-sm font-semibold">
            {t("manual.sections.lines")}
          </legend>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-2">{t("manual.fields.product")}</th>
                  <th className="p-2">{t("manual.fields.sku")}</th>
                  <th className="p-2">{t("manual.fields.quantity")}</th>
                  <th className="p-2">{t("manual.fields.unit_price")}</th>
                  <th className="p-2">{t("manual.fields.discount")}</th>
                  <th className="p-2">
                    <span className="sr-only">{t("manual.fields.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-t border-border">
                    <td className="p-2">
                      <FormTextInput
                        form={form}
                        name={`lines.${index}.productName`}
                        aria-label={t("manual.row_field", {
                          field: t("manual.fields.product"),
                          row: index + 1,
                        })}
                      />
                    </td>
                    <td className="p-2">
                      <FormTextInput
                        form={form}
                        name={`lines.${index}.sellerSku`}
                        aria-label={t("manual.row_field", {
                          field: t("manual.fields.sku"),
                          row: index + 1,
                        })}
                      />
                    </td>
                    <td className="p-2">
                      <FormTextInput
                        form={form}
                        name={`lines.${index}.quantity`}
                        inputMode="decimal"
                        aria-label={t("manual.row_field", {
                          field: t("manual.fields.quantity"),
                          row: index + 1,
                        })}
                      />
                    </td>
                    <td className="p-2">
                      <FormTextInput
                        form={form}
                        name={`lines.${index}.unitPrice`}
                        inputMode="decimal"
                        aria-label={t("manual.row_field", {
                          field: t("manual.fields.unit_price"),
                          row: index + 1,
                        })}
                      />
                    </td>
                    <td className="p-2">
                      <FormTextInput
                        form={form}
                        name={`lines.${index}.discount`}
                        inputMode="decimal"
                        aria-label={t("manual.row_field", {
                          field: t("manual.fields.discount"),
                          row: index + 1,
                        })}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                          aria-label={t("manual.move_up", { row: index + 1 })}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                          aria-label={t("manual.move_down", { row: index + 1 })}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                          aria-label={t("manual.remove_line", { row: index + 1 })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyManualInvoiceLine())}
          >
            <Plus className="size-4" />
            {t("manual.add_line")}
          </Button>
        </fieldset>

        <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-3">
          <span>{t("manual.totals.subtotal", { value: totals.subtotal.toFixed(2) })}</span>
          <span>{t("manual.totals.vat", { value: totals.vatAmount.toFixed(2) })}</span>
          <strong>{t("manual.totals.total", { value: totals.grandTotal.toFixed(2) })}</strong>
        </div>

        <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {previewMutation.isPending
            ? t("manual.status.previewing")
            : saveMutation.isPending
              ? t("manual.status.saving")
              : previewMutation.isSuccess
                ? t("manual.status.preview_ready")
                : saveMutation.isSuccess
                  ? t("manual.status.saved")
                  : ""}
        </p>
        {previewMutation.isError || saveMutation.isError ? (
          <p className="text-sm text-destructive">
            {extractApiErrorMessage(
              previewMutation.error ?? saveMutation.error,
              t("manual.status.failed")
            )}
          </p>
        ) : null}

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-card/95 py-3 backdrop-blur">
          <Button
            type="button"
            variant="outline"
            disabled={previewMutation.isPending}
            onClick={() => void previewInvoice()}
          >
            {previewMutation.isPending ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            ) : null}
            {t("manual.actions.preview")}
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            ) : null}
            {t("manual.actions.save_draft")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
