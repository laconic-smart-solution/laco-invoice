import type { ReactNode } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface FormSelectOption {
  value: string
  label: string
}

export interface FormSelectInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: ReactNode
  options: FormSelectOption[]
  placeholder?: string
  wrapperClass?: string
  triggerClassName?: string
  description?: ReactNode
  required?: boolean
}

export function FormSelectInput<T extends FieldValues>({
  form,
  name,
  label,
  options,
  placeholder,
  wrapperClass,
  triggerClassName,
  description,
  required,
}: FormSelectInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("w-full space-y-2", wrapperClass)}>
          <FormLabel className="text-foreground">
            {label}
            {required ? <span className="ml-1 text-destructive">*</span> : null}
          </FormLabel>
          <Select
            value={field.value === "" ? undefined : field.value}
            onValueChange={(value) => field.onChange(value ?? "")}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  "h-10 w-full rounded-none border border-border bg-background px-3 py-2 text-left text-sm",
                  triggerClassName
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}
