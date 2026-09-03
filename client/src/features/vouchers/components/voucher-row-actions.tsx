import { Pencil, Send } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  canEditVoucher,
  canPostVoucherToErp,
  type VoucherStatus,
} from "@/features/vouchers/types/voucher"

interface VoucherRowActionsProps {
  status: VoucherStatus
  onEdit: () => void
  onPost: () => void
}

export function VoucherRowActions({
  status,
  onEdit,
  onPost,
}: VoucherRowActionsProps) {
  const { t } = useTranslation("vouchers")
  const canEdit = canEditVoucher(status)
  const canPost = canPostVoucherToErp(status)

  return (
    <div
      className="flex items-center justify-end gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              disabled={!canEdit}
              onClick={onEdit}
              aria-label={t("table.edit")}
            >
              <Pencil className="size-3.5" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {canEdit ? t("table.edit") : t("errors.cannot_edit_posted")}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              disabled={!canPost}
              onClick={onPost}
              aria-label={t("table.post_to_erp")}
            >
              <Send className="size-3.5" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {canPost ? t("table.post_to_erp") : t("errors.cannot_post")}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
