import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import {
  SUPPORTED_MARKETPLACES,
  type MarketplaceCode,
} from "@/features/stores/config/marketplaces"
import type { Store } from "@/features/stores/types/store"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getOrderInputRunErrorMessage,
  useCreateOrderInputRunMutation,
} from "@/shared/queries/order-input-run.query"

function isSelectLayer(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        '[data-slot="select-content"], [data-radix-select-viewport], [data-radix-popper-content-wrapper]'
      )
    )
  )
}

interface OrderInputRunCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stores: Store[]
  onCreated?: (inputRunId: number) => void
}

export function OrderInputRunCreateDialog({
  open,
  onOpenChange,
  stores,
  onCreated,
}: OrderInputRunCreateDialogProps) {
  const { t } = useTranslation("orders")
  const createMutation = useCreateOrderInputRunMutation()

  const [title, setTitle] = useState("")
  const [storeId, setStoreId] = useState("")
  const [marketplaceCode, setMarketplaceCode] =
    useState<MarketplaceCode>("TIKTOK")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    setTitle("")
    setStoreId(stores[0] ? String(stores[0].id) : "")
    setMarketplaceCode("TIKTOK")
    setError(null)
    createMutation.reset()
    // Only reset when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-gated reset
  }, [open])

  const handleOpenChange = (next: boolean) => {
    if (createMutation.isPending) {
      return
    }
    onOpenChange(next)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const trimmedTitle = title.trim()
    const parsedStoreId = Number(storeId)

    if (!trimmedTitle) {
      setError(t("inputs.errors.title_required"))
      return
    }
    if (!Number.isFinite(parsedStoreId) || parsedStoreId <= 0) {
      setError(t("inputs.errors.store_required"))
      return
    }

    setError(null)
    try {
      const data = await createMutation.mutateAsync({
        title: trimmedTitle,
        storeId: parsedStoreId,
        marketplaceCode,
      })
      onOpenChange(false)
      onCreated?.(data.id)
    } catch (err: unknown) {
      setError(
        getOrderInputRunErrorMessage(err, t("inputs.errors.create_failed"))
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={!createMutation.isPending}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          const titleInput = document.getElementById("order-input-title")
          titleInput?.focus()
        }}
        onPointerDownOutside={(event) => {
          if (createMutation.isPending || isSelectLayer(event.target)) {
            event.preventDefault()
          }
        }}
        onFocusOutside={(event) => {
          if (createMutation.isPending || isSelectLayer(event.target)) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (createMutation.isPending || isSelectLayer(event.target)) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("inputs.create_title")}</DialogTitle>
          <DialogDescription>{t("inputs.create_subtitle")}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-1.5">
            <Label htmlFor="order-input-title">{t("inputs.fields.title")}</Label>
            <Input
              id="order-input-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("inputs.fields.title_placeholder")}
              maxLength={200}
              disabled={createMutation.isPending}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("inputs.fields.store")}</Label>
            <Select
              value={storeId || undefined}
              onValueChange={setStoreId}
              disabled={createMutation.isPending || stores.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("inputs.fields.store_placeholder")} />
              </SelectTrigger>
              <SelectContent position="popper">
                {stores.map((store) => (
                  <SelectItem key={store.id} value={String(store.id)}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("inputs.fields.marketplace")}</Label>
            <Select
              value={marketplaceCode}
              onValueChange={(value) =>
                setMarketplaceCode(value as MarketplaceCode)
              }
              disabled={createMutation.isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {SUPPORTED_MARKETPLACES.map((marketplace) => (
                  <SelectItem key={marketplace.code} value={marketplace.code}>
                    {marketplace.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AuthFormError message={error} />

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {t("inputs.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? t("inputs.creating")
                : t("inputs.create_submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
