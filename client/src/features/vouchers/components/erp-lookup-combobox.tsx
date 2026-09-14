import { useMemo, useState } from "react"
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
  /** Put the code in the input and wrap the full name under the field. */
  showNameBelow?: boolean
  /** Allow direct typing and custom account code entries. */
  allowCustomValue?: boolean
}

interface ErpLookupOption {
  value: string
  code: string
  name: string
  label: string
  isCustom?: boolean
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
  showNameBelow = false,
  allowCustomValue = false,
}: ErpLookupComboboxProps<T>) {
  const { t } = useTranslation("common")
  const [inputQuery, setInputQuery] = useState("")

  const baseItems = useMemo<ErpLookupOption[]>(
    () =>
      options.map((option) => ({
        value: String(option.id),
        code: option.code,
        name: option.name,
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

        const items = useMemo<ErpLookupOption[]>(() => {
          const list = [...baseItems]
          const rawStr = raw != null ? String(raw).trim() : ""

          // If current form value exists but isn't in baseItems (e.g. custom account code), keep it
          if (
            allowCustomValue &&
            rawStr !== "" &&
            !list.some((it) => it.value === rawStr || it.code.toLowerCase() === rawStr.toLowerCase())
          ) {
            list.unshift({
              value: rawStr,
              code: rawStr,
              name: "Custom Account",
              label: `${rawStr} — Custom`,
              isCustom: true,
            })
          }

          // If user is actively typing something that doesn't match an existing option, offer it
          if (allowCustomValue && inputQuery.trim()) {
            const q = inputQuery.trim()
            const exists = list.some(
              (it) =>
                it.code.toLowerCase() === q.toLowerCase() ||
                it.value.toLowerCase() === q.toLowerCase()
            )
            if (!exists) {
              list.unshift({
                value: q,
                code: q,
                name: "Custom Account",
                label: `${q} — Use custom code`,
                isCustom: true,
              })
            }
          }
          return list
        }, [raw, inputQuery])

        const selected =
          typeof raw === "string" && raw !== ""
            ? (items.find((item) => item.value === raw || item.code.toLowerCase() === raw.toLowerCase()) ?? null)
            : null

        const commitValue = (val: string) => {
          field.onChange(val)
          onChange?.(val)
        }

        const handleBlur = () => {
          field.onBlur()
          if (!allowCustomValue) return
          const typed = inputQuery.trim()
          if (!typed) return

          // 1. Exact match by code, value, or full label
          const exact = baseItems.find(
            (o) =>
              o.code.toLowerCase() === typed.toLowerCase() ||
              o.value.toLowerCase() === typed.toLowerCase() ||
              o.label.toLowerCase() === typed.toLowerCase()
          )
          if (exact) {
            commitValue(exact.value)
            setInputQuery("")
            return
          }

          // 2. Partial / hyphen-stripped match (e.g. "2101" matches "2101-000")
          const cleanTyped = typed.replace(/[-\s]/g, "").toLowerCase()
          const partial = baseItems.find((o) => {
            const cleanCode = o.code.replace(/[-\s]/g, "").toLowerCase()
            return (
              cleanCode.startsWith(cleanTyped) ||
              o.code.toLowerCase().startsWith(typed.toLowerCase())
            )
          })
          if (partial) {
            commitValue(partial.value)
            setInputQuery("")
            return
          }

          // 3. Custom value typed
          commitValue(typed)
          setInputQuery("")
        }

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
              autoHighlight
              itemToStringLabel={(item) =>
                showNameBelow ? (item?.code ?? "") : (item?.label ?? "")
              }
              itemToStringValue={(item) => item?.value ?? ""}
              isItemEqualToValue={(itemValue, value) =>
                itemValue?.value === value?.value
              }
              disabled={disabled}
              required={required}
              onInputValueChange={(query) => {
                setInputQuery(query)
              }}
              onValueChange={(option) => {
                const next = option?.value ?? ""
                commitValue(next)
                setInputQuery("")
              }}
            >
              <FormControl>
                <ComboboxInput
                  ref={field.ref}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  disabled={disabled}
                  className="w-full rounded-none border border-border bg-background px-3 py-2 text-left text-sm placeholder:text-muted-foreground"
                />
              </FormControl>
              <ComboboxContent className="min-w-[20rem] w-max max-w-[min(36rem,var(--available-width))]">
                <ComboboxList className="max-h-[min(18rem,calc(var(--available-height,18rem)-8px))] overflow-y-auto">
                  {(item: ErpLookupOption) => (
                    <ComboboxItem key={item.value} value={item}>
                      <span className="flex min-w-0 flex-col gap-0.5 whitespace-normal">
                        <span className="font-medium flex items-center gap-1.5">
                          {item.code}
                          {item.isCustom ? (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                              Custom
                            </span>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground">{item.name}</span>
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty>{t("form.no_matches")}</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
            {showNameBelow && selected?.name ? (
              <p className="pt-1 text-xs leading-snug whitespace-normal break-words text-muted-foreground">
                {selected.name}
              </p>
            ) : null}
            <FormMessage className="text-xs" />
          </FormItem>
        )
      }}
    />
  )
}
