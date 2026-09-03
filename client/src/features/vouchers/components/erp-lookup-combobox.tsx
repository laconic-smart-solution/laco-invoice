import { useMemo } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import type { ErpLookupRecord } from "@/features/vouchers/types/voucher"

interface ErpLookupComboboxProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  options: ErpLookupRecord[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  onChange?: (value: string) => void
}

function optionLabel(record: ErpLookupRecord): string {
  return `${record.code} — ${record.name}`
}

export function ErpLookupCombobox<T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
  className,
  onChange,
}: ErpLookupComboboxProps<T>) {
  const { t } = useTranslation("common")
  const items = useMemo(
    () =>
      options.map((option) => ({
        value: String(option.id),
        label: optionLabel(option),
      })),
    [options]
  )

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const raw = field.value
        const selected =
          typeof raw === "string" && raw !== ""
            ? (items.find((item) => item.value === raw) ?? null)
            : null

        return (
          <FormItem className={cn("w-full", label ? "space-y-2" : "space-y-0", className)}>
            {label ? (
              <FormLabel className="text-foreground">
                {label}
                {required ? <span className="ml-1 text-destructive">*</span> : null}
              </FormLabel>
            ) : null}
            <Combobox
              name={field.name}
              items={items}
              value={selected}
              itemToStringLabel={(item) => item?.label ?? ""}
              itemToStringValue={(item) => item?.value ?? ""}
              isItemEqualToValue={(itemValue, value) =>
                itemValue?.value === value?.value
              }
              disabled={disabled}
              required={required}
              onValueChange={(option) => {
                const next = option?.value ?? ""
                field.onChange(next)
                onChange?.(next)
              }}
            >
              <FormControl>
                <ComboboxInput
                  ref={field.ref}
                  onBlur={field.onBlur}
                  placeholder={placeholder}
                  disabled={disabled}
                  className="w-full rounded-none border border-border bg-background px-3 py-2 text-left text-sm placeholder:text-muted-foreground"
                />
              </FormControl>
              <ComboboxContent>
                <ComboboxList>
                  {(item: { value: string; label: string }) => (
                    <ComboboxItem key={item.value} value={item}>
                      <span className="truncate">{item.label}</span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty>{t("form.no_matches")}</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
            <FormMessage className="text-xs" />
          </FormItem>
        )
      }}
    />
  )
}
