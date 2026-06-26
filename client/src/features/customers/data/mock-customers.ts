import type {
  Customer,
  CustomerBadgeTier,
  CustomerGender,
  CustomerStats,
} from "@/features/customers/types/customer"

export const MOCK_CUSTOMERS_TOTAL = 12842

export const MOCK_CUSTOMER_STATS: CustomerStats = {
  totalCustomers: 12842,
  totalCustomersTrendPercent: 12,
  avgLifetimeValue: 342.1,
  avgLifetimeValueTrendPercent: 5,
  activeThisMonth: 4210,
  syncErrors: 0,
}

const NAMES = [
  { name: "Marcus Thompson", badge: "premium" as const },
  { name: "Elena Rodriguez", badge: "top_buyer" as const },
  { name: "James Chen", badge: "new_customer" as const },
  { name: "Sarah Johnson", badge: "premium" as const },
  { name: "David Kim", badge: undefined },
  { name: "Priya Patel", badge: "top_buyer" as const },
  { name: "Oliver Wright", badge: "new_customer" as const },
  { name: "Hannah Lee", badge: undefined },
  { name: "Carlos Mendez", badge: "premium" as const },
  { name: "Aisha Khan", badge: undefined },
] as const

const ADDRESSES = [
  "742 Evergreen Terrace, Springfield, IL",
  "1280 Peachtree St NE, Atlanta, GA",
  "455 Market Street, San Francisco, CA",
  "88 Queen Street, Toronto, ON",
  "221B Baker Street, London, UK",
  "500 5th Avenue, New York, NY",
  "1600 Amphitheatre Pkwy, Mountain View, CA",
  "1 Infinite Loop, Cupertino, CA",
] as const

function getBadge(globalIndex: number): CustomerBadgeTier | undefined {
  const entry = NAMES[globalIndex % NAMES.length]
  return entry.badge
}

function getGender(globalIndex: number): CustomerGender {
  return globalIndex % 2 === 0 ? "male" : "female"
}

function formatPhone(globalIndex: number): string {
  const area = 200 + (globalIndex % 800)
  const prefix = 100 + (globalIndex % 900)
  const line = 1000 + (globalIndex % 9000)
  return `+1 (${area}) ${prefix}-${line}`
}

function buildMockCustomer(globalIndex: number): Customer {
  const person = NAMES[globalIndex % NAMES.length]
  const emailSlug = person.name.toLowerCase().replace(/\s+/g, ".")

  return {
    id: String(1000000000 + globalIndex),
    name: person.name,
    email: `${emailSlug}@example.com`,
    phone: formatPhone(globalIndex),
    gender: getGender(globalIndex),
    address: ADDRESSES[globalIndex % ADDRESSES.length],
    badge: getBadge(globalIndex),
  }
}

export function getMockCustomersPage(page: number, limit: number): Customer[] {
  const offset = (page - 1) * limit
  const count = Math.min(limit, Math.max(MOCK_CUSTOMERS_TOTAL - offset, 0))

  return Array.from({ length: count }, (_, index) =>
    buildMockCustomer(offset + index)
  )
}

export const ACTIVE_MARKETPLACE_FILTERS = ["tiktok", "shopify"] as const
