export type CustomerGender = "male" | "female"

export type CustomerBadgeTier = "premium" | "top_buyer" | "new_customer"

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  gender: CustomerGender
  address: string
  badge?: CustomerBadgeTier
}

export interface CustomerStats {
  totalCustomers: number
  totalCustomersTrendPercent: number
  avgLifetimeValue: number
  avgLifetimeValueTrendPercent: number
  activeThisMonth: number
  syncErrors: number
}
