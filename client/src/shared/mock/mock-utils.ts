import type { ApiResponse, PageMeta } from "@/shared/types/api-response"

const MOCK_DELAY_MS = 120

export function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

export function pageMeta(page: number, size: number, totalElements: number): PageMeta {
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  return {
    page,
    size,
    totalElements,
    totalPages,
  }
}

export function ok<T>(data: T, meta?: PageMeta): ApiResponse<T> {
  return {
    success: true,
    code: 200,
    message: "OK",
    data,
    ...(meta ? { meta } : {}),
  }
}

export function emptyBlob(): Blob {
  return new Blob([], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

export function parseRequestBody(data: unknown): Record<string, unknown> {
  if (data == null) {
    return {}
  }
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as unknown
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }
  if (typeof data === "object") {
    return data as Record<string, unknown>
  }
  return {}
}

export function resolveRequestPath(url: string | undefined, baseURL: string | undefined): string {
  const raw = url ?? ""
  let path = raw

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      path = new URL(path).pathname
    } catch {
      // keep raw path
    }
  }

  const base = (baseURL ?? "").replace(/\/$/, "")
  if (base && path.startsWith(base)) {
    path = path.slice(base.length)
  }

  path = path.replace(/^\/api/, "")
  if (!path.startsWith("/")) {
    path = `/${path}`
  }

  return path.split("?")[0]
}

export function paginateArray<T>(
  items: T[],
  pageNumber: unknown,
  pageSize: unknown
): { data: T[]; meta: PageMeta } {
  const page = Math.max(1, Number(pageNumber) || 1)
  const size = Math.max(1, Number(pageSize) || 10)
  const start = (page - 1) * size
  const data = items.slice(start, start + size)
  return { data, meta: pageMeta(page, size, items.length) }
}
