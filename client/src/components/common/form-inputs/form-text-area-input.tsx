import type { ComponentProps, ReactNode } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface FormTextAreaInputProps<T extends FieldValues> extends Omit<
  ComponentProps<typeof Textarea>,
  "name" | "form"
> {
  form: UseFormReturn<T>
  name: Path<T>
  label: ReactNode
  wrapperClass?: string
  labelClass?: string
  description?: ReactNode
}

export function FormTextAreaInput<T extends FieldValues>({
  form,
  name,
  label,
  wrapperClass,
  labelClass,
  description,
  className,
  required,
  ...props
}: FormTextAreaInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2", wrapperClass)}>
          <FormLabel className={cn("text-foreground", labelClass)}>
            {label}
            {required ? <span className="ml-1 text-destructive">*</span> : null}
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              {...props}
              className={cn(
                "min-h-24 rounded-none border border-input bg-background px-3 py-2 text-sm",
                className
              )}
            />
          </FormControl>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}
