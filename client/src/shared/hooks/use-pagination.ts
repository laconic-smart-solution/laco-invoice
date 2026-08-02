import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const
export const PAGE_QUERY_KEY = "page"
export const LIMIT_QUERY_KEY = "limit"

interface UsePaginationOptions {
  defaultPage?: number
  defaultLimit?: number
  total?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  offset: number
  totalPages: number
  start: number
  end: number
  canGoPrev: boolean
  canGoNext: boolean
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return parsed
}

export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const safeLimit = Math.max(1, limit)
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  // When total is unknown (0 before the first fetch), trust the URL page so
  // pagination clicks actually change the request instead of clamping to 1.
  const safePage =
    total <= 0 ? Math.max(page, 1) : Math.min(Math.max(page, 1), totalPages)
  const offset = (safePage - 1) * safeLimit
  const start = total === 0 ? 0 : offset + 1
  const end = Math.min(offset + safeLimit, total)

  return {
    page: safePage,
    limit: safeLimit,
    offset,
    totalPages,
    start,
    end,
    canGoPrev: safePage > 1,
    canGoNext: total > 0 && safePage < totalPages,
  }
}

export function usePagination(options: UsePaginationOptions = {}) {
  const {
    defaultPage = DEFAULT_PAGE,
    defaultLimit = DEFAULT_LIMIT,
    total = 0,
  } = options
  const [searchParams, setSearchParams] = useSearchParams()

  const rawPage = parsePositiveInt(searchParams.get(PAGE_QUERY_KEY), defaultPage)
  const rawLimit = parsePositiveInt(searchParams.get(LIMIT_QUERY_KEY), defaultLimit)

  const meta = useMemo(
    () => getPaginationMeta(rawPage, rawLimit, total),
    [rawPage, rawLimit, total]
  )

  const setPage = useCallback(
    (page: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const nextPage = Math.max(1, page)

          if (nextPage === defaultPage) {
            next.delete(PAGE_QUERY_KEY)
          } else {
            next.set(PAGE_QUERY_KEY, String(nextPage))
          }

          return next
        },
        { replace: true }
      )
    },
    [defaultPage, setSearchParams]
  )

  const setLimit = useCallback(
    (limit: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const nextLimit = Math.max(1, limit)

          if (nextLimit === defaultLimit) {
            next.delete(LIMIT_QUERY_KEY)
          } else {
            next.set(LIMIT_QUERY_KEY, String(nextLimit))
          }

          next.delete(PAGE_QUERY_KEY)
          return next
        },
        { replace: true }
      )
    },
    [defaultLimit, setSearchParams]
  )

  const goToNextPage = useCallback(() => {
    if (meta.canGoNext) {
      setPage(meta.page + 1)
    }
  }, [meta.canGoNext, meta.page, setPage])

  const goToPrevPage = useCallback(() => {
    if (meta.canGoPrev) {
      setPage(meta.page - 1)
    }
  }, [meta.canGoPrev, meta.page, setPage])

  return {
    ...meta,
    setPage,
    setLimit,
    goToNextPage,
    goToPrevPage,
  }
}
