import { ConnectMarketplaceButton } from "@/features/stores/components/connect-marketplace-button"

interface ConnectLazadaButtonProps {
  storeId: number
}

export function ConnectLazadaButton({ storeId }: ConnectLazadaButtonProps) {
  return <ConnectMarketplaceButton storeId={storeId} marketplaceCode="LAZADA" />
}
