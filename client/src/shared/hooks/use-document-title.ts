import { useEffect } from "react"

export const APP_DOCUMENT_TITLE = "Laco Invoice"

/**
 * Sets `document.title` while mounted.
 * Restores the default app title on unmount so error-page titles
 * cannot stick after recovery / soft navigation.
 */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) {
      return
    }

    document.title = title

    return () => {
      document.title = APP_DOCUMENT_TITLE
    }
  }, [title])
}

export function formatAppDocumentTitle(pageTitle: string): string {
  const trimmed = pageTitle.trim()
  if (!trimmed || trimmed === APP_DOCUMENT_TITLE) {
    return APP_DOCUMENT_TITLE
  }
  return `${trimmed} | ${APP_DOCUMENT_TITLE}`
}
