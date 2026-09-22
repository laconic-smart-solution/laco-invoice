import { GenerateVoucherDialog } from "@/features/vouchers/components/generate-voucher-dialog"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"

interface GenerateVoucherWindowProps {
  orderSetId: number
  voucherId?: number
  onGenerated?: () => void
}

export function GenerateVoucherWindow({
  orderSetId,
  voucherId,
  onGenerated,
}: GenerateVoucherWindowProps) {
  const close = useFlowWindowsStore((state) => state.close)
  const openVoucherDetail = useFlowWindowsStore((state) => state.openVoucherDetail)
  const windowId =
    voucherId != null
      ? `generate-voucher-${orderSetId}-${voucherId}`
      : `generate-voucher-${orderSetId}`

  return (
    <GenerateVoucherDialog
      open
      embedded
      voucherId={voucherId}
      defaultOrderInputRunId={orderSetId}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close(windowId)
        }
      }}
      onGenerated={(voucher) => {
        onGenerated?.()
        close(windowId)
        openVoucherDetail(voucher.id, voucher.voucherNumber)
      }}
    />
  )
}
