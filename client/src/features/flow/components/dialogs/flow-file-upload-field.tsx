import { useId, useRef, type DragEvent, type ReactNode } from "react"
import { FileSpreadsheet, FileText, UploadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FlowFileUploadFieldProps {
  label: string
  hint: string
  accept: string
  file: File | null
  onFileChange: (file: File | null) => void
  kind: "pdf" | "excel"
  action?: ReactNode
  error?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FlowFileUploadField({
  label,
  hint,
  accept,
  file,
  onFileChange,
  kind,
  action,
  error = false,
}: FlowFileUploadFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const Icon = kind === "pdf" ? FileText : FileSpreadsheet

  const acceptFile = (nextFile: File | undefined) => {
    onFileChange(nextFile ?? null)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    acceptFile(event.dataTransfer.files[0])
  }

  return (
    <section
      className={cn(
        "rounded-xl border bg-muted/20 p-3",
        error ? "border-destructive" : "border-border/80"
      )}
      aria-labelledby={`${inputId}-label`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            id={`${inputId}-label`}
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <Icon className="size-4 text-primary" aria-hidden />
            {label}
            <span className="text-destructive" aria-label="required">
              *
            </span>
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        </div>
        {action}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      {file ? (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/25 bg-background px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-xs font-medium text-foreground">
              {file.name}
            </strong>
            <small className="mt-0.5 block text-[10px] text-muted-foreground">
              {formatFileSize(file.size)}
            </small>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${file.name}`}
            onClick={() => {
              onFileChange(null)
              if (inputRef.current) inputRef.current.value = ""
            }}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/35 bg-background px-4 py-4 text-center transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <UploadCloud className="size-5 text-primary" aria-hidden />
          <span className="mt-1.5 text-xs font-medium text-foreground">
            Click to select or drop file
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">
            {kind === "pdf" ? "PDF only" : "XLSX, XLS, or CSV"}
          </span>
        </div>
      )}

      {error ? (
        <p className="mt-2 text-[11px] text-destructive" role="alert">
          This file is required.
        </p>
      ) : null}
    </section>
  )
}
