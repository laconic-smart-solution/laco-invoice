export interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data: T
  meta?: PageMeta
}

export interface PageMeta {
  page: number
  size: number
  totalElements: number
  totalPages: number
}
