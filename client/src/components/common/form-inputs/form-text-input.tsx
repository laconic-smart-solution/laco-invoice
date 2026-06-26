import type { ComponentProps, ReactNode } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface FormTextInputProps<T extends FieldValues> extends Omit<
  ComponentProps<typeof Input>,
  "name" | "form"
> {
  form: UseFormReturn<T>
  name: Path<T>
  label?: ReactNode
  wrapperClass?: string
  labelClass?: string
  description?: ReactNode
}

export function FormTextInput<T extends FieldValues>({
  form,
  name,
  label,
  wrapperClass,
  labelClass,
  description,
  className,
  required,
  ...props
}: FormTextInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            label != null && label !== "" ? "space-y-2" : "space-y-1",
            wrapperClass
          )}
        >
          {label != null && label !== "" ? (
            <FormLabel className={cn("text-foreground", labelClass)}>
              {label}
              {required ? <span className="ml-1 text-destructive">*</span> : null}
            </FormLabel>
          ) : null}
          <FormControl>
            <Input
              {...props}
              name={field.name}
              ref={field.ref}
              value={field.value == null ? "" : String(field.value)}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.value)}
              className={cn(
                "rounded-none border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground",
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
