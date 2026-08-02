import type { UserRole } from "@/shared/types/auth.types"

export interface AdminUser {
  id: number
  email: string
  authServerUserId: string | null
  fullName: string | null
  role: UserRole
  active: boolean
  createdAt: string
  updatedAt: string
}

export type UserRoleFilter = UserRole | "all"

export type UserActiveFilter = "all" | "active" | "inactive"

export interface UserPageRequest {
  pageNumber: number
  pageSize: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    role?: UserRole
    email?: string
    fullName?: string
    active?: boolean
  }
}

export const USER_ROLE_FILTER_OPTIONS: { value: UserRoleFilter; labelKey: string }[] = [
  { value: "all", labelKey: "filters.role.all" },
  { value: "ADMIN", labelKey: "filters.role.admin" },
  { value: "OWNER", labelKey: "filters.role.owner" },
  { value: "MANAGER", labelKey: "filters.role.manager" },
  { value: "STAFF", labelKey: "filters.role.staff" },
]

export const USER_ACTIVE_FILTER_OPTIONS: {
  value: UserActiveFilter
  labelKey: string
}[] = [
  { value: "all", labelKey: "filters.active.all" },
  { value: "active", labelKey: "filters.active.active" },
  { value: "inactive", labelKey: "filters.active.inactive" },
]
