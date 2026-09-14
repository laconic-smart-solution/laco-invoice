import { useTranslation } from "react-i18next"

import { StatusBadge, type StatusBadgeVariant } from "@/components/common/status-badge"
import type {
  ApiOrderInputRunDto,
  ApiOrderInputRunStatus,
} from "@/shared/services/order-input-run.service"
import { hasOrderInputInvoiceDisplayError } from "@/shared/services/order-input-run.service"

const RUN_STATUS_BADGE: Record<ApiOrderInputRunStatus, StatusBadgeVariant> = {
  DRAFT: "pending",
  RUNNING: "pending",
  COMPLETED: "synced",
  PARTIAL: "pending",
  FAILED: "failed",
}

export function getOrderInputInvoiceErrorMessage(
  run: ApiOrderInputRunDto,
  t: (key: string) => string
): string | null {
  if (!hasOrderInputInvoiceDisplayError(run)) {
    return null
  }
  const matchStatus = run.invoiceMatchStatus
  const detail = run.invoicePdfError?.trim()
  if (detail) {
    return detail
  }
  if (matchStatus) {
    return t(`inputs.invoice_match.${matchStatus.toLowerCase()}`)
  }
  return t("inputs.status.error")
}

interface OrderInputRunStatusBadgesProps {
  run: ApiOrderInputRunDto
  displayStatus?: ApiOrderInputRunStatus
}

export function OrderInputRunStatusBadges({
  run,
  displayStatus,
}: OrderInputRunStatusBadgesProps) {
  const { t } = useTranslation("orders")
  const status = displayStatus ?? run.status
  const invoiceError = getOrderInputInvoiceErrorMessage(run, t)

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {invoiceError ? (
        <StatusBadge
          status="error"
          label={t("inputs.status.error")}
          tooltip={invoiceError}
        />
      ) : (
        <StatusBadge
          status={RUN_STATUS_BADGE[status]}
          label={t(`inputs.status.${status.toLowerCase()}`)}
        />
      )}
    </span>
  )
}
