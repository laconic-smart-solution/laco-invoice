import { MarketplaceConnectionCard } from "@/features/stores/components/marketplace-connection-card"
import type { LazadaConnection } from "@/features/stores/types/store"

interface LazadaConnectionCardProps {
  storeId: number
  connection: LazadaConnection
}

export function LazadaConnectionCard({ storeId, connection }: LazadaConnectionCardProps) {
  return (
    <MarketplaceConnectionCard
      storeId={storeId}
      marketplaceCode="LAZADA"
      connection={connection}
    />
  )
}
