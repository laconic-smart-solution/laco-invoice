import type { ReactNode } from "react"
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

export interface FormComboBoxOption {
  value: string
  label: string
  imageUrl?: string
}

export interface FormComboBoxInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: ReactNode
  options: FormComboBoxOption[]
  placeholder?: string
  wrapperClass?: string
  triggerClassName?: string
  description?: ReactNode
  required?: boolean
  disabled?: boolean
}

export function FormComboBoxInput<T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
  wrapperClass,
  triggerClassName,
  description,
  required,
  disabled,
}: FormComboBoxInputProps<T>) {
  const { t } = useTranslation("common")

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const raw = field.value
        const selected =
          typeof raw === "string" && raw !== ""
            ? (options.find((option) => option.value === raw) ?? null)
            : null

        return (
          <FormItem className={cn("w-full space-y-2", wrapperClass)}>
            <FormLabel className="text-foreground">
              {label}
              {required ? <span className="ml-1 text-destructive">*</span> : null}
            </FormLabel>
            <Combobox
              name={field.name}
              items={options}
              value={selected}
              itemToStringValue={(item) => item?.label ?? ""}
              disabled={disabled}
              required={required}
              onValueChange={(option) => {
                field.onChange(option?.value ?? "")
              }}
            >
              <FormControl>
                <ComboboxInput
                  ref={field.ref}
                  onBlur={field.onBlur}
                  placeholder={placeholder}
                  disabled={disabled}
                  className={cn(
                    "w-full rounded-none border border-border bg-background px-3 py-2 text-left text-sm placeholder:text-muted-foreground",
                    triggerClassName
                  )}
                />
              </FormControl>
              <ComboboxContent>
                <ComboboxList>
                  {(item: FormComboBoxOption) => (
                    <ComboboxItem key={item.value} value={item}>
                      <div className="flex min-w-0 items-center gap-2">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="size-8 shrink-0 rounded-none border border-border object-cover"
                          />
                        ) : (
                          <div
                            aria-hidden
                            className="size-8 shrink-0 rounded-none border border-border bg-muted"
                          />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                    </ComboboxItem>
                  )}
                </ComboboxList>
                <ComboboxEmpty>{t("form.no_matches")}</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
            <FormMessage className="text-xs" />
          </FormItem>
        )
      }}
    />
  )
}
