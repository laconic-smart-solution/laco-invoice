import { Network, ShoppingBag } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

export function OauthProviderButtons() {
  const { t } = useTranslation("auth")

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button type="button" variant="outline" className="h-10 w-full">
        <Network className="size-4" aria-hidden />
        {t("oauth.shopify")}
      </Button>
      <Button type="button" variant="outline" className="h-10 w-full">
        <ShoppingBag className="size-4" aria-hidden />
        {t("oauth.amazon")}
      </Button>
    </div>
  )
}
