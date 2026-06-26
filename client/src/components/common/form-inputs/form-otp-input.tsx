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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"

export interface FormOtpInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: ReactNode
  length?: number
  wrapperClass?: string
  labelClass?: string
  groupClass?: string
  slotClass?: string
  description?: ReactNode
  required?: boolean
  disabled?: boolean
}

export function FormOtpInput<T extends FieldValues>({
  form,
  name,
  label,
  length = 6,
  wrapperClass,
  labelClass,
  groupClass,
  slotClass,
  description,
  required,
  disabled,
}: FormOtpInputProps<T>) {
  const slots = Array.from({ length }, (_, index) => index)

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-3", wrapperClass)}>
          <FormLabel className={cn("text-foreground", labelClass)}>
            {label}
            {required ? <span className="ml-1 text-destructive">*</span> : null}
          </FormLabel>
          <FormControl>
            <InputOTP
              maxLength={length}
              disabled={disabled}
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              containerClassName="w-full"
            >
              <InputOTPGroup className={cn("w-full justify-center", groupClass)}>
                {slots.map((index) => (
                  <InputOTPSlot key={index} index={index} className={slotClass} />
                ))}
              </InputOTPGroup>
            </InputOTP>
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
