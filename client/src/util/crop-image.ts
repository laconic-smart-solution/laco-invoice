import type { PixelCrop } from "react-image-crop"

export function getCroppedImageDataUrl(
  image: HTMLImageElement,
  pixelCrop: PixelCrop,
  mimeType = "image/jpeg",
  quality = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) {
      reject(new Error("Could not get canvas context"))
      return
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const sourceX = pixelCrop.x * scaleX
    const sourceY = pixelCrop.y * scaleY
    const sourceWidth = pixelCrop.width * scaleX
    const sourceHeight = pixelCrop.height * scaleY

    const destinationWidth = Math.max(1, Math.floor(sourceWidth))
    const destinationHeight = Math.max(1, Math.floor(sourceHeight))

    canvas.width = destinationWidth
    canvas.height = destinationHeight

    context.imageSmoothingQuality = "high"
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      destinationWidth,
      destinationHeight
    )

    resolve(canvas.toDataURL(mimeType, quality))
  })
}
