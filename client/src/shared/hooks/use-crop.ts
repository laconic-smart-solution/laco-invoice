import { useCallback, useRef, useState, type SyntheticEvent } from "react"
import type { Crop, PixelCrop } from "react-image-crop"

interface UseCropProps {
  aspectRatio: number
}

const defaultPercentCrop: Crop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
}

export function useCrop({ aspectRatio }: UseCropProps) {
  const [isOpenCrop, setIsOpenCrop] = useState(false)
  const [cropSrc, setCropSrc] = useState("")
  const [crop, setCrop] = useState<Crop>(defaultPercentCrop)
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const resetCropGeometry = useCallback(() => {
    setCrop(defaultPercentCrop)
    setCompletedCrop(null)
  }, [])

  const onCropComplete = useCallback((pixelCrop: PixelCrop) => {
    setCompletedCrop(pixelCrop)
  }, [])

  const onCropImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight, width, height } = event.currentTarget
      const aspect = aspectRatio

      let widthPercent = 100
      let heightPercent = (naturalWidth / aspect / naturalHeight) * 100

      if (heightPercent > 100) {
        heightPercent = 100
        widthPercent = ((naturalHeight * aspect) / naturalWidth) * 100
      }

      const initialCrop = {
        unit: "%" as const,
        x: (100 - widthPercent) / 2,
        y: (100 - heightPercent) / 2,
        width: widthPercent,
        height: heightPercent,
      }

      setCrop(initialCrop)

      const completed: PixelCrop = {
        unit: "px",
        x: (initialCrop.x / 100) * width,
        y: (initialCrop.y / 100) * height,
        width: (initialCrop.width / 100) * width,
        height: (initialCrop.height / 100) * height,
      }

      setCompletedCrop(completed)
    },
    [aspectRatio]
  )

  return {
    isOpenCrop,
    setIsOpenCrop,
    cropSrc,
    setCropSrc,
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    imgRef,
    onCropImageLoad,
    onCropComplete,
    resetCropGeometry,
  }
}
