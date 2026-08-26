import { useMemo } from "react"

import { useBreadcrumbs } from "@/shared/hooks/use-breadcrumbs"
import {
  formatAppDocumentTitle,
  useDocumentTitle,
} from "@/shared/hooks/use-document-title"

/** Keeps the browser tab title in sync with the current route breadcrumbs. */
export function AppDocumentTitle() {
  const items = useBreadcrumbs()
  const pageTitle = useMemo(() => {
    if (items.length === 0) {
      return null
    }
    return formatAppDocumentTitle(items[items.length - 1]?.label ?? "")
  }, [items])

  useDocumentTitle(pageTitle)

  return null
}
