import { Calculator, Plus, Trash2 } from "lucide-react"
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

  const isVatDebit = (id: string | undefined) => {
    if (!id) return false
    const match = accounts.find((a) => String(a.id) === id || a.code === id)
    return match?.code === "21400070" || id === "21400070"
  }

  const isVatCredit = (id: string | undefined) => {
    if (!id) return false
    const match = accounts.find((a) => String(a.id) === id || a.code === id)
    return match?.code === "21400060" || id === "21400060"
  }

  const handleRecalculateVat = () => {
    const current = form.getValues("entries")
    if (!current || current.length === 0) return

    const principalDebit = current.find(
      (e) =>
        !isVatDebit(e.externalErpAccountCodeId) &&
        !isVatCredit(e.externalErpAccountCodeId) &&
        Number(e.debit || 0) > 0
    )
    const principalCredit = current.find(
      (e) =>
        !isVatDebit(e.externalErpAccountCodeId) &&
        !isVatCredit(e.externalErpAccountCodeId) &&
        Number(e.credit || 0) > 0
    )

    const principalAmount = Number(
      principalDebit?.debit ||
        principalCredit?.credit ||
        current[0]?.debit ||
        current[0]?.credit ||
        0
    )
    if (principalAmount <= 0) return

    const vatAmount = Math.round(((principalAmount * 7) / 107) * 100) / 100
    const vatStr = vatAmount.toFixed(2)
    const principalStr = principalAmount.toFixed(2)

    const vatDebitAcc = accounts.find(
      (a) => a.code === "21400070" || String(a.id) === "21400070"
    )
    const vatDebitId = vatDebitAcc ? String(vatDebitAcc.id) : "21400070"

    const vatCreditAcc = accounts.find(
      (a) => a.code === "21400060" || String(a.id) === "21400060"
    )
    const vatCreditId = vatCreditAcc ? String(vatCreditAcc.id) : "21400060"

    const hasVatDebit = current.some((e) => isVatDebit(e.externalErpAccountCodeId))
    const hasVatCredit = current.some((e) => isVatCredit(e.externalErpAccountCodeId))

    if (hasVatDebit || hasVatCredit) {
      current.forEach((entry, idx) => {
        if (isVatDebit(entry.externalErpAccountCodeId)) {
          form.setValue(`entries.${idx}.debit`, vatStr)
          form.setValue(`entries.${idx}.credit`, "")
        } else if (isVatCredit(entry.externalErpAccountCodeId)) {
          form.setValue(`entries.${idx}.credit`, vatStr)
          form.setValue(`entries.${idx}.debit`, "")
        }
      })
    } else {
      const baseLine1 = principalDebit ?? current[0]
      const baseLine2 = principalCredit ?? current[1] ?? current[0]

      const nextEntries: GenerateVoucherFormValues["entries"] = [
        {
          ...baseLine1,
          externalErpAccountCodeId:
            baseLine1.externalErpAccountCodeId ||
            form.getValues("externalErpAccountCodeId"),
          debit: principalStr,
          credit: "",
        },
        {
          ...emptyVoucherEntry(
            vatDebitId,
            baseLine1.externalErpDepartmentId ||
              form.getValues("externalErpDepartmentId"),
            baseLine1.externalErpCurrencyId ||
              form.getValues("externalErpCurrencyId")
          ),
          invoiceNo: baseLine1.invoiceNo || "",
          invoiceDate: baseLine1.invoiceDate || "",
          debit: vatStr,
          credit: "",
        },
        {
          ...baseLine2,
          externalErpAccountCodeId:
            baseLine2.externalErpAccountCodeId ||
            form.getValues("externalErpAccountCodeId"),
          debit: "",
          credit: principalStr,
        },
        {
          ...emptyVoucherEntry(
            vatCreditId,
            baseLine2.externalErpDepartmentId ||
              form.getValues("externalErpDepartmentId"),
            baseLine2.externalErpCurrencyId ||
              form.getValues("externalErpCurrencyId")
          ),
          invoiceNo: baseLine2.invoiceNo || "",
          invoiceDate: baseLine2.invoiceDate || "",
          debit: "",
          credit: vatStr,
        },
      ]
      form.setValue("entries", nextEntries)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{t("form.entries")}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-none text-xs gap-1.5 text-primary border-primary/40 hover:bg-primary/5"
            onClick={handleRecalculateVat}
          >
            <Calculator className="size-3.5" />
            {t("form.recalculate_vat_7")}
          </Button>
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
                <td className="min-w-[220px] px-2 py-2 align-top">
                  <ErpLookupCombobox
                    form={form}
                    name={`entries.${index}.externalErpAccountCodeId`}
                    label=""
                    options={accounts}
                    placeholder={t("form.account_placeholder")}
                    required
                    showNameBelow
                    allowCustomValue
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
                    showNameBelow
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
                    showNameBelow
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
