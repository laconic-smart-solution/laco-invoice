export type CustomerGender = "male" | "female"

export interface Customer {
  id: number
  storeId: number | null
  name: string
  email: string | null
  phone: string | null
  gender: CustomerGender | string | null
  address: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface CustomerCreateInput {
  name: string
  email?: string
  phone?: string
  gender?: string
  address?: string
}

export type CustomerUpdateInput = CustomerCreateInput

export interface CustomerPageRequest {
  pageNumber: number
  pageSize: number
  sortBy?: string
  sortOrder?: "ASC" | "DESC"
  filter?: {
    name?: string
    email?: string
    phone?: string
    gender?: string
  }
}
