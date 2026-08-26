import axios from "axios"

/**
 * Triggers a browser file download from a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/**
 * Reads Content-Disposition filename, falling back to `fallback`.
 */
export function filenameFromContentDisposition(
  header: string | undefined,
  fallback: string
): string {
  if (!header) {
    return fallback
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim())
    } catch {
      return utf8Match[1].trim()
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(header)
  if (plainMatch?.[1]) {
    return plainMatch[1].trim()
  }

  return fallback
}

/**
 * When `responseType: "blob"`, API error bodies arrive as Blobs.
 * Re-throws with the JSON `message` when present so UI error helpers work.
 */
export async function rethrowBlobApiError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text()
      const json = JSON.parse(text) as { message?: unknown }
      if (typeof json.message === "string" && json.message.trim()) {
        throw new Error(json.message.trim())
      }
    } catch (parsed) {
      if (
        parsed instanceof Error &&
        parsed.message &&
        !(parsed instanceof SyntaxError)
      ) {
        throw parsed
      }
    }
  }

  throw error
}
