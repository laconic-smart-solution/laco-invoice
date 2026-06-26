import type { ReactNode } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export interface FormCheckBoxProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: ReactNode
  wrapperClass?: string
  labelClass?: string
  description?: ReactNode
  disabled?: boolean
}

export function FormCheckBox<T extends FieldValues>({
  form,
  name,
  label,
  wrapperClass,
  labelClass,
  description,
  disabled,
}: FormCheckBoxProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2", wrapperClass)}>
          <div className="flex items-start gap-2">
            <FormControl>
              <Checkbox
                checked={Boolean(field.value)}
                disabled={disabled}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className={cn("text-foreground", labelClass)}>
                {label}
              </FormLabel>
              {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}
