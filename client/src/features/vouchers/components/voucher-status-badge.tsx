import { StatusBadge, type StatusBadgeVariant } from "@/components/common/status-badge"
import type { Voucher, VoucherStatus } from "@/features/vouchers/types/voucher"

function getVoucherStatusBadgeVariant(status: VoucherStatus): StatusBadgeVariant {
  switch (status) {
    case "POSTED":
      return "paid"
    case "GENERATED":
      return "synced"
    case "FAILED":
      return "failed"
    case "DRAFT":
    default:
      return "draft"
  }
}

interface VoucherStatusBadgeProps {
  status: VoucherStatus
  label: string
  description?: string | null
}

export function VoucherStatusBadge({
  status,
  label,
  description,
}: VoucherStatusBadgeProps) {
  return (
    <StatusBadge
      status={getVoucherStatusBadgeVariant(status)}
      label={label}
      tooltip={description?.trim() || null}
    />
  )
}

export function voucherStatusTooltip(
  voucher: Pick<Voucher, "status" | "voucherDescription">,
  statusDescription: string
): string {
  if (voucher.status === "POSTED") {
    const notes = voucher.voucherDescription?.trim()
    return notes ? `${statusDescription}\n\n${notes}` : statusDescription
  }
  return statusDescription
}
