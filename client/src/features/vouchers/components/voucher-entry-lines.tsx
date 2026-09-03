import { Plus, Trash2 } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import { useFieldArray } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { FormTextInput } from "@/components/common/form-inputs/form-text-input"
import { ErpLookupCombobox } from "@/features/vouchers/components/erp-lookup-combobox"
import {
  emptyVoucherEntry,
  type GenerateVoucherFormValues,
} from "@/features/vouchers/schemas/generate-voucher-schema"
import type { ErpLookupRecord } from "@/features/vouchers/types/voucher"

interface VoucherEntryLinesProps {
  form: UseFormReturn<GenerateVoucherFormValues>
  accounts: ErpLookupRecord[]
  departments: ErpLookupRecord[]
  currencies: ErpLookupRecord[]
}

export function VoucherEntryLines({
  form,
  accounts,
  departments,
  currencies,
}: VoucherEntryLinesProps) {
  const { t } = useTranslation("vouchers")
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  const entries = form.watch("entries")
  const debitTotal = entries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0)
  const creditTotal = entries.reduce(
    (sum, entry) => sum + Number(entry.credit || 0),
    0
  )
  const isBalanced = Math.abs(debitTotal - creditTotal) <= 0.01

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{t("form.entries")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-none text-xs"
          onClick={() =>
            append(
              emptyVoucherEntry(
                form.getValues("externalErpAccountCodeId"),
                form.getValues("externalErpDepartmentId"),
                form.getValues("externalErpCurrencyId")
              )
            )
          }
        >
          <Plus className="size-3.5" />
          {t("form.add_line")}
        </Button>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[1100px] text-left text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">{t("form.account")}</th>
              <th className="px-3 py-2 font-medium text-right">{t("table.debit")}</th>
              <th className="px-3 py-2 font-medium text-right">{t("table.credit")}</th>
              <th className="px-3 py-2 font-medium">{t("form.invoice_no")}</th>
              <th className="px-3 py-2 font-medium">{t("form.invoice_date")}</th>
              <th className="px-3 py-2 font-medium">{t("form.department")}</th>
              <th className="px-3 py-2 font-medium text-right">{t("form.exchange_rate")}</th>
              <th className="px-3 py-2 font-medium">{t("form.currency")}</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fields.map((field, index) => (
              <tr key={field.id}>
                <td className="min-w-[200px] px-2 py-2 align-top">
                  <ErpLookupCombobox
                    form={form}
                    name={`entries.${index}.externalErpAccountCodeId`}
                    label=""
                    options={accounts}
                    placeholder={t("form.account_placeholder")}
                    required
                  />
                </td>
                <td className="w-28 px-2 py-2 align-top">
                  <FormTextInput
                    form={form}
                    name={`entries.${index}.debit`}
                    inputMode="decimal"
                    className="text-right font-mono"
                  />
                </td>
                <td className="w-28 px-2 py-2 align-top">
                  <FormTextInput
                    form={form}
                    name={`entries.${index}.credit`}
                    inputMode="decimal"
                    className="text-right font-mono"
                  />
                </td>
                <td className="min-w-[120px] px-2 py-2 align-top">
                  <FormTextInput
                    form={form}
                    name={`entries.${index}.invoiceNo`}
                    placeholder={t("form.invoice_no")}
                  />
                </td>
                <td className="min-w-[140px] px-2 py-2 align-top">
                  <FormTextInput
                    form={form}
                    name={`entries.${index}.invoiceDate`}
                    type="date"
                  />
                </td>
                <td className="min-w-[160px] px-2 py-2 align-top">
                  <ErpLookupCombobox
                    form={form}
                    name={`entries.${index}.externalErpDepartmentId`}
                    label=""
                    options={departments}
                    placeholder={t("form.department_placeholder")}
                  />
                </td>
                <td className="w-24 px-2 py-2 align-top">
                  <FormTextInput
                    form={form}
                    name={`entries.${index}.exchangeRate`}
                    inputMode="decimal"
                    className="text-right font-mono"
                  />
                </td>
                <td className="min-w-[150px] px-2 py-2 align-top">
                  <ErpLookupCombobox
                    form={form}
                    name={`entries.${index}.externalErpCurrencyId`}
                    label=""
                    options={currencies}
                    placeholder={t("form.currency_placeholder")}
                  />
                </td>
                <td className="px-2 py-2 align-top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-none text-muted-foreground"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                    aria-label={t("form.remove_line")}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-6 text-xs font-mono">
        <span>
          {t("table.debit")}: {debitTotal.toFixed(2)}
        </span>
        <span>
          {t("table.credit")}: {creditTotal.toFixed(2)}
        </span>
        <span className={isBalanced ? "text-success" : "text-destructive"}>
          {isBalanced ? t("form.balanced") : t("form.unbalanced")}
        </span>
      </div>
    </div>
  )
}
