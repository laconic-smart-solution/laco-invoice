import { useTranslation } from "react-i18next"
import { ChevronDown, Download } from "lucide-react"

import {
  ORDER_INPUT_FILE_TEMPLATES,
  getOrderInputFileTemplate,
} from "@/features/orders/constants/order-input-file-templates"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ApiOrderInputFileType } from "@/shared/services/order-input-run.service"

interface OrderInputTemplateDownloadProps {
  /** When set, show a single link for that type; otherwise show all templates in a menu. */
  selectedType?: ApiOrderInputFileType
  disabled?: boolean
  onMenuOpenChange?: (open: boolean) => void
}

export function OrderInputTemplateDownload({
  selectedType,
  disabled = false,
  onMenuOpenChange,
}: OrderInputTemplateDownloadProps) {
  const { t } = useTranslation("orders")

  if (selectedType) {
    const template = getOrderInputFileTemplate(selectedType)
    if (!template) {
      return null
    }

    return (
      <a
        href={template.href}
        download={template.downloadFilename}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium shrink-0"
      >
        <Download className="size-3.5" />
        {t("inputs.download_template")}
      </a>
    )
  }

  return (
    <DropdownMenu modal={false} onOpenChange={onMenuOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-auto gap-1 px-2 py-1 text-xs font-medium text-primary hover:text-primary shrink-0"
        >
          <Download className="size-3.5" />
          {t("inputs.download_templates")}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        {ORDER_INPUT_FILE_TEMPLATES.map((template) => (
          <DropdownMenuItem key={template.type} asChild>
            <a
              href={template.href}
              download={template.downloadFilename}
              className="flex flex-col items-start gap-0.5 cursor-pointer"
            >
              <span>{t(template.labelKey)}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {template.fileHint}
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
