import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { StoreForm } from "@/features/stores/components/store-form"
import type { StoreFormValues } from "@/features/stores/schemas/store-form-schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getStoreErrorMessage,
  useCreateStoreMutation,
} from "@/shared/queries/store.query"

const FORM_ID = "classic-create-store-form"

interface CreateStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (storeId: number) => void
}

export function CreateStoreDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateStoreDialogProps) {
  const { t } = useTranslation(["classic", "stores"])
  const createMutation = useCreateStoreMutation()
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError(null)
    }
    onOpenChange(next)
  }

  const handleSubmit = async (values: StoreFormValues) => {
    setError(null)
    try {
      const store = await createMutation.mutateAsync({
        name: values.name,
        logoUrl: values.logoUrl,
        active: values.active,
      })
      handleOpenChange(false)
      onCreated?.(store.id)
    } catch (err: unknown) {
      setError(getStoreErrorMessage(err, t("stores:errors.save_failed")))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{t("classic:setup.store_title")}</DialogTitle>
          <DialogDescription>
            {t("classic:setup.store_description")}
          </DialogDescription>
        </DialogHeader>
        <AuthFormError message={error} />
        <StoreForm formId={FORM_ID} onSubmit={handleSubmit} />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={createMutation.isPending}
          >
            {t("stores:form.cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={createMutation.isPending}
          >
            {t("stores:form.submit_create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
