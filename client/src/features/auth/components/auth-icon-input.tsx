import type { LucideIcon } from "lucide-react"
import type { ComponentProps } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

interface AuthIconInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  icon: LucideIcon
  type?: ComponentProps<"input">["type"]
  placeholder?: string
  required?: boolean
  autoComplete?: string
  disabled?: boolean
}

export function AuthIconInput<T extends FieldValues>({
  form,
  name,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  required,
  autoComplete,
  disabled,
}: AuthIconInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
            {required ? <span className="ml-1 text-destructive">*</span> : null}
          </FormLabel>
          <FormControl>
            <InputGroup className="h-10 bg-background">
              <InputGroupAddon align="inline-start">
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                {...field}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                value={field.value == null ? "" : String(field.value)}
                className="h-10"
              />
            </InputGroup>
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  )
}
