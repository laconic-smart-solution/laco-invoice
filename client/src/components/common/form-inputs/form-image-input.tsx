import { ImagePlusIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { CSSProperties, ReactNode, RefCallback } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import ReactCrop from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useCrop } from "@/shared/hooks/use-crop"
import { getCroppedImageDataUrl } from "@/util/crop-image"
import { cn } from "@/lib/utils"

export interface FormImageInputProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label?: ReactNode
  accept?: string
  wrapperClass?: string
  description?: ReactNode
  aspectRatio?: number
  outputMimeType?: string
  required?: boolean
  existingPreviewUrl?: string | null
}

export function FormImageInput<T extends FieldValues>({
  form,
  name,
  label,
  required: requiredLabel,
  accept = "image/*",
  wrapperClass,
  description,
  aspectRatio = 1,
  outputMimeType = "image/jpeg",
  existingPreviewUrl,
}: FormImageInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormImageInputInner
          field={field}
          label={label}
          required={requiredLabel}
          accept={accept}
          wrapperClass={wrapperClass}
          description={description}
          aspectRatio={aspectRatio}
          outputMimeType={outputMimeType}
          existingPreviewUrl={existingPreviewUrl}
        />
      )}
    />
  )
}

interface FormImageInputInnerProps {
  field: {
    value: unknown
    onChange: (value: unknown) => void
    onBlur: () => void
    name: string
    ref: RefCallback<HTMLElement>
  }
  label?: ReactNode
  required?: boolean
  accept: string
  wrapperClass?: string
  description?: ReactNode
  aspectRatio: number
  outputMimeType: string
  existingPreviewUrl?: string | null
}

function FormImageInputInner({
  field,
  label,
  required: requiredLabel,
  accept,
  wrapperClass,
  description,
  aspectRatio,
  outputMimeType,
  existingPreviewUrl,
}: FormImageInputInnerProps) {
  const { t } = useTranslation("common")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const revokeUrlRef = useRef<string | null>(null)
  const previewKey = `${existingPreviewUrl ?? ""}:${String(field.value ?? "")}`
  const [hiddenExistingKey, setHiddenExistingKey] = useState<string | null>(null)
  const hideExisting = hiddenExistingKey === previewKey

  const {
    isOpenCrop,
    setIsOpenCrop,
    cropSrc,
    setCropSrc,
    crop,
    setCrop,
    completedCrop,
    imgRef,
    onCropImageLoad,
    onCropComplete,
    resetCropGeometry,
  } = useCrop({ aspectRatio })

  const cleanupSessionObjectUrl = () => {
    if (revokeUrlRef.current) {
      URL.revokeObjectURL(revokeUrlRef.current)
      revokeUrlRef.current = null
    }
  }

  const closeDialog = () => {
    cleanupSessionObjectUrl()
    setCropSrc("")
    setIsOpenCrop(false)
    resetCropGeometry()
  }

  const uploadValue =
    typeof field.value === "string" && field.value.startsWith("data:")
      ? field.value
      : ""
  const persistedValue =
    !hideExisting &&
    typeof field.value === "string" &&
    !field.value.startsWith("data:") &&
    (field.value.startsWith("http://") ||
      field.value.startsWith("https://") ||
      field.value.startsWith("blob:"))
      ? field.value
      : ""
  const existingValue =
    !hideExisting && existingPreviewUrl && !uploadValue && !persistedValue
      ? existingPreviewUrl
      : ""
  const displaySrc = uploadValue || persistedValue || existingValue
  const hasImage = Boolean(displaySrc)

  const clearImage = () => {
    cleanupSessionObjectUrl()

    if (uploadValue) {
      field.onChange(null)
      return
    }

    if (persistedValue) {
      field.onChange("")
      return
    }

    if (existingValue) {
      setHiddenExistingKey(previewKey)
    }
  }

  const handlePickFile = (file: File | undefined) => {
    if (!file) {
      return
    }

    cleanupSessionObjectUrl()
    resetCropGeometry()
    const url = URL.createObjectURL(file)
    revokeUrlRef.current = url
    setCropSrc(url)
    setIsOpenCrop(true)
  }

  const openCropForExisting = () => {
    if (!displaySrc) {
      return
    }

    cleanupSessionObjectUrl()
    resetCropGeometry()
    setCropSrc(displaySrc)
    setIsOpenCrop(true)
  }

  const triggerFileDialog = () => {
    fileInputRef.current?.click()
  }

  const applyCrop = async () => {
    const image = imgRef.current

    if (!image || !completedCrop) {
      return
    }

    try {
      const dataUrl = await getCroppedImageDataUrl(
        image,
        completedCrop,
        outputMimeType
      )
      setHiddenExistingKey(null)
      field.onChange(dataUrl)
      closeDialog()
    } catch {
      // Keep dialog open so the user can retry.
    }
  }

  const aspect =
    typeof aspectRatio === "number" &&
    aspectRatio > 0 &&
    Number.isFinite(aspectRatio)
      ? aspectRatio
      : 1

  const maxPreviewWidthPx =
    aspect >= 1 ? Math.min(320, Math.round(112 * Math.min(aspect, 16 / 9))) : 112

  const previewFrameStyle: CSSProperties = {
    aspectRatio: aspect,
    width: "100%",
    maxWidth: maxPreviewWidthPx,
  }

  const previewOuterStyle: CSSProperties = { maxWidth: maxPreviewWidthPx }

  return (
    <FormItem className={cn("space-y-2", wrapperClass)}>
      {label ? (
        <FormLabel className="text-foreground">
          {label}
          {requiredLabel ? <span className="text-destructive"> *</span> : null}
        </FormLabel>
      ) : null}
      <FormControl>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={(event) => {
              handlePickFile(event.target.files?.[0])
              event.target.value = ""
            }}
          />

          {!hasImage ? (
            <div
              className="relative flex items-center justify-center border border-dashed border-border bg-muted/30"
              style={previewFrameStyle}
            >
              <ImagePlusIcon
                className={cn(
                  "pointer-events-none text-muted-foreground",
                  maxPreviewWidthPx >= 200 ? "size-11" : "size-9"
                )}
                aria-hidden
              />
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute end-2 bottom-2 shadow-sm"
                aria-label={t("form.upload_image")}
                onClick={triggerFileDialog}
              >
                <UploadIcon className="size-4" />
              </Button>
            </div>
          ) : (
            <div
              className="relative inline-flex w-full"
              style={previewOuterStyle}
            >
              <button
                type="button"
                className="relative block w-full overflow-hidden border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ aspectRatio: aspect }}
                onClick={openCropForExisting}
                aria-label={t("form.open_crop_editor")}
              >
                <img src={displaySrc} alt="" className="size-full object-cover" />
              </button>
              <div className="absolute top-1 right-1 flex gap-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  className="shadow-sm"
                  aria-label={t("form.upload_new_image")}
                  onClick={(event) => {
                    event.stopPropagation()
                    triggerFileDialog()
                  }}
                >
                  <UploadIcon className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  className="text-destructive shadow-sm"
                  aria-label={t("form.remove_image")}
                  onClick={(event) => {
                    event.stopPropagation()
                    clearImage()
                  }}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          )}

          <Dialog
            open={isOpenCrop}
            onOpenChange={(open) => {
              if (!open) {
                closeDialog()
              }
            }}
          >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("form.crop_title")}</DialogTitle>
                <DialogDescription>{t("form.crop_description")}</DialogDescription>
              </DialogHeader>

              {cropSrc ? (
                <div className="flex justify-center overflow-auto">
                  <ReactCrop
                    aspect={aspectRatio}
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(pixelCrop) => onCropComplete(pixelCrop)}
                    className="max-w-full"
                  >
                    <img
                      ref={imgRef}
                      alt=""
                      src={cropSrc}
                      className="max-h-[55vh] max-w-full object-contain"
                      onLoad={onCropImageLoad}
                    />
                  </ReactCrop>
                </div>
              ) : null}

              <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={triggerFileDialog}>
                  <UploadIcon className="size-3.5" />
                  {t("form.upload_new_photo")}
                </Button>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t("form.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => void applyCrop()}
                  disabled={!completedCrop}
                >
                  {t("form.apply")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </FormControl>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <FormMessage className="text-xs" />
    </FormItem>
  )
}
