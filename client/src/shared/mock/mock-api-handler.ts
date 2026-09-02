import type { InternalAxiosRequestConfig } from "axios"

import type { CustomerCreateInput } from "@/features/customers/types/customer"
import type {
  MarketplaceCode,
  StoreCreateInput,
} from "@/features/stores/types/store"
import type { AdminUserCreateInput } from "@/shared/services/admin-user.service"
import {
  getConnections,
  getCustomerById,
  getImportFileById,
  getInputRunById,
  getMockState,
  getProductDetailById,
  getStoreById,
  getUserById,
  MOCK_MARKETPLACES,
} from "@/shared/mock/mock-seed-data"
import {
  getMockApiOrderDetail,
  getMockApiOrdersPage,
  getMockOrderHistory,
  getMockOrderStats,
} from "@/shared/mock/mock-order-bridge"
import { MOCK_USER } from "@/shared/mock/mock-user"
import {
  emptyBlob,
  mockDelay,
  ok,
  paginateArray,
  parseRequestBody,
  resolveRequestPath,
} from "@/shared/mock/mock-utils"
import type { ApiResponse } from "@/shared/types/api-response"
import type { AuthSessionResponse } from "@/shared/types/auth.types"

interface MockHandlerResult {
  status: number
  body: unknown
  headers?: Record<string, string>
  isBlob?: boolean
}

const NOW = "2024-06-15T10:00:00Z"

function filterCustomers(
  items: ReturnType<typeof getMockState>["customers"],
  filter: Record<string, unknown> | undefined
) {
  if (!filter) {
    return items
  }

  let result = items
  const search = typeof filter.name === "string" ? filter.name.trim().toLowerCase() : ""
  if (search) {
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        (c.email?.toLowerCase().includes(search) ?? false) ||
        (c.phone?.includes(search) ?? false)
    )
  }
  if (filter.storeId != null) {
    const storeId = Number(filter.storeId)
    result = result.filter((c) => c.storeId === storeId)
  }
  if (typeof filter.gender === "string" && filter.gender) {
    result = result.filter((c) => c.gender === filter.gender)
  }
  return result
}

function filterUsers(
  items: ReturnType<typeof getMockState>["users"],
  filter: Record<string, unknown> | undefined
) {
  if (!filter) {
    return items
  }

  let result = items
  if (typeof filter.role === "string" && filter.role) {
    result = result.filter((u) => u.role === filter.role)
  }
  if (typeof filter.email === "string" && filter.email.trim()) {
    const q = filter.email.trim().toLowerCase()
    result = result.filter((u) => u.email.toLowerCase().includes(q))
  }
  if (typeof filter.fullName === "string" && filter.fullName.trim()) {
    const q = filter.fullName.trim().toLowerCase()
    result = result.filter((u) => (u.fullName ?? "").toLowerCase().includes(q))
  }
  if (filter.active === true) {
    result = result.filter((u) => u.active)
  }
  if (filter.active === false) {
    result = result.filter((u) => !u.active)
  }
  return result
}

function filterStores(
  items: ReturnType<typeof getMockState>["stores"],
  filter: Record<string, unknown> | undefined
) {
  if (!filter) {
    return items
  }

  let result = items
  if (typeof filter.name === "string" && filter.name.trim()) {
    const q = filter.name.trim().toLowerCase()
    result = result.filter((s) => s.name.toLowerCase().includes(q))
  }
  if (filter.active === true) {
    result = result.filter((s) => s.active)
  }
  if (filter.active === false) {
    result = result.filter((s) => !s.active)
  }
  return result
}

function filterProducts(
  items: ReturnType<typeof getMockState>["products"],
  filter: Record<string, unknown> | undefined
) {
  if (!filter) {
    return items
  }

  let result = items
  if (filter.storeId != null) {
    result = result.filter((p) => p.storeId === Number(filter.storeId))
  }
  if (typeof filter.marketplaceCode === "string" && filter.marketplaceCode) {
    result = result.filter((p) => p.marketplaceCode === filter.marketplaceCode)
  }
  if (typeof filter.search === "string" && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase()
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.externalProductId.toLowerCase().includes(q)
    )
  }
  if (typeof filter.erpStatus === "string" && filter.erpStatus) {
    result = result.filter((p) => p.erpStatus === filter.erpStatus)
  }
  return result
}

function authSession(email = MOCK_USER.email): AuthSessionResponse {
  return {
    userId: MOCK_USER.id,
    email,
    otpVerified: true,
  }
}

function matchPath(pattern: RegExp, path: string): RegExpMatchArray | null {
  return path.match(pattern)
}

function extractUploadFilename(data: unknown): string | null {
  if (data instanceof FormData) {
    const file = data.get("file")
    if (file instanceof File) {
      return file.name
    }
  }
  return null
}

function mockDetectInputFileType(filename: string | null): "SHIPPING_FEE" | "SERVICE_FEE" {
  const name = (filename ?? "").toLowerCase()
  if (
    name.includes("payout") ||
    name.includes("withdraw") ||
    name.includes("service") ||
    name.includes("settlement")
  ) {
    return "SERVICE_FEE"
  }
  return "SHIPPING_FEE"
}

export async function handleMockRequest(
  config: InternalAxiosRequestConfig
): Promise<MockHandlerResult> {
  await mockDelay()

  const method = (config.method ?? "get").toUpperCase()
  const path = resolveRequestPath(config.url, config.baseURL)
  const body = parseRequestBody(config.data)
  const params = config.params as Record<string, unknown> | undefined
  const state = getMockState()

  if (method === "POST" && path === "/v1/auth/login") {
    const identifier =
      typeof body.identifier === "string" ? body.identifier : MOCK_USER.email
    return { status: 200, body: ok(authSession(identifier)) }
  }

  if (method === "POST" && path === "/v1/auth/verify-otp") {
    const email = typeof body.email === "string" ? body.email : MOCK_USER.email
    return { status: 200, body: ok(authSession(email)) }
  }

  if (
    method === "POST" &&
    (path === "/v1/auth/refresh" ||
      path === "/v1/auth/logout" ||
      path === "/v1/auth/resend-otp" ||
      path === "/v1/auth/change-password")
  ) {
    return { status: 200, body: ok(null) }
  }

  if (method === "GET" && path === "/v1/me/profile") {
    return { status: 200, body: ok(MOCK_USER) }
  }

  if (method === "PUT" && path === "/v1/me/credentials") {
    return { status: 200, body: ok(MOCK_USER) }
  }

  if (method === "GET" && path === "/v1/marketplaces") {
    return { status: 200, body: ok(MOCK_MARKETPLACES) }
  }

  if (method === "POST" && path === "/v1/stores/pageable") {
    const filtered = filterStores(state.stores, body.filter as Record<string, unknown>)
    const { data, meta } = paginateArray(filtered, body.pageNumber, body.pageSize)
    return { status: 200, body: ok(data, meta) }
  }

  const storeGet = matchPath(/^\/v1\/stores\/(\d+)$/, path)
  if (method === "GET" && storeGet) {
    const store = getStoreById(Number(storeGet[1]))
    return { status: 200, body: ok(store ?? null) }
  }

  if (method === "POST" && path === "/v1/stores") {
    const input = body as unknown as StoreCreateInput
    const newStore = {
      id: state.nextStoreId++,
      ownerId: MOCK_USER.id,
      name: String(input.name ?? "New Store").trim(),
      logoUrl: input.logoUrl ?? null,
      active: input.active ?? true,
      createdAt: NOW,
    }
    state.stores.push(newStore)
    return { status: 200, body: ok(newStore) }
  }

  if (method === "POST" && path === "/v1/customers/pageable") {
    const filtered = filterCustomers(
      state.customers,
      body.filter as Record<string, unknown>
    )
    const { data, meta } = paginateArray(filtered, body.pageNumber, body.pageSize)
    return { status: 200, body: ok(data, meta) }
  }

  if (method === "POST" && path === "/v1/customers/export/preview") {
    const filtered = filterCustomers(
      state.customers,
      body.filter as Record<string, unknown>
    )
    const { data, meta } = paginateArray(filtered, body.pageNumber, body.pageSize)
    return { status: 200, body: ok(data, meta) }
  }

  if (method === "POST" && path === "/v1/customers/export") {
    return {
      status: 200,
      body: emptyBlob(),
      isBlob: true,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": "attachment; filename=customers-export.xlsx",
      },
    }
  }

  const customerGet = matchPath(/^\/v1\/customers\/(\d+)$/, path)
  if (method === "GET" && customerGet) {
    return { status: 200, body: ok(getCustomerById(Number(customerGet[1])) ?? null) }
  }

  if (method === "POST" && path === "/v1/customers") {
    const input = body as unknown as CustomerCreateInput
    const newCustomer = {
      id: state.nextCustomerId++,
      storeId: null,
      storeName: null,
      marketplaceId: null,
      marketplaceCode: null,
      externalCustomerId: null,
      name: String(input.name ?? "").trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      gender: input.gender ?? null,
      address: input.address ?? null,
      createdAt: NOW,
      updatedAt: NOW,
    }
    state.customers.unshift(newCustomer)
    return { status: 200, body: ok(newCustomer) }
  }

  if (method === "PUT" && customerGet) {
    const id = Number(customerGet[1])
    const existing = getCustomerById(id)
    if (!existing) {
      return { status: 404, body: ok(null) }
    }
    const input = body as unknown as CustomerCreateInput
    Object.assign(existing, {
      name: String(input.name ?? existing.name).trim(),
      email: input.email ?? existing.email,
      phone: input.phone ?? existing.phone,
      gender: input.gender ?? existing.gender,
      address: input.address ?? existing.address,
      updatedAt: NOW,
    })
    return { status: 200, body: ok(existing) }
  }

  if (method === "DELETE" && customerGet) {
    const id = Number(customerGet[1])
    state.customers = state.customers.filter((c) => c.id !== id)
    return { status: 200, body: ok(null) }
  }

  if (method === "POST" && path === "/v1/users/pageable") {
    const filtered = filterUsers(state.users, body.filter as Record<string, unknown>)
    const { data, meta } = paginateArray(filtered, body.pageNumber, body.pageSize)
    return { status: 200, body: ok(data, meta) }
  }

  if (method === "POST" && path === "/v1/users/export/preview") {
    const filtered = filterUsers(state.users, body.filter as Record<string, unknown>)
    const { data, meta } = paginateArray(filtered, body.pageNumber, body.pageSize)
    return { status: 200, body: ok(data, meta) }
  }

  if (method === "POST" && path === "/v1/users/export") {
    return {
      status: 200,
      body: emptyBlob(),
      isBlob: true,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": "attachment; filename=users-export.xlsx",
      },
    }
  }

  const userGet = matchPath(/^\/v1\/users\/(\d+)$/, path)
  if (method === "GET" && userGet) {
    return { status: 200, body: ok(getUserById(Number(userGet[1])) ?? null) }
  }

  const userVerifyOtp = matchPath(/^\/v1\/users\/(\d+)\/verify-otp$/, path)
  if (method === "POST" && userVerifyOtp) {
    return { status: 200, body: ok(null) }
  }

  if (method === "POST" && path === "/v1/users") {
    const input = body as unknown as AdminUserCreateInput
    const newUser = {
      id: state.nextUserId++,
      email: String(input.email ?? "").trim(),
      authServerUserId: `mock-auth-${state.nextUserId}`,
      fullName: String(input.fullName ?? "").trim(),
      role: input.role,
      active: input.active ?? true,
      createdAt: NOW,
      updatedAt: NOW,
    }
    state.users.unshift(newUser)
    return { status: 200, body: ok(newUser) }
  }

  if (method === "POST" && path === "/v1/orders/pageable") {
    const page = Number(body.pageNumber) || 1
    const size = Number(body.pageSize) || 10
    const all = getMockApiOrdersPage(page, size)
    const total = 4284
    const meta = {
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    }
    return { status: 200, body: ok(all, meta) }
  }

  if (method === "POST" && path === "/v1/orders/export/preview") {
    const page = Number(body.pageNumber) || 1
    const size = Number(body.pageSize) || 10
    const data = getMockApiOrdersPage(page, size)
    const total = 4284
    return {
      status: 200,
      body: ok(data, {
        page,
        size,
        totalElements: total,
        totalPages: Math.ceil(total / size),
      }),
    }
  }

  if (method === "POST" && path === "/v1/orders/export") {
    return {
      status: 200,
      body: emptyBlob(),
      isBlob: true,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": "attachment; filename=orders-export.xlsx",
      },
    }
  }

  const orderHistory = matchPath(/^\/v1\/orders\/(\d+)\/history$/, path)
  if (method === "GET" && orderHistory) {
    const orderId = Number(orderHistory[1])
    const page = Number(params?.pageNumber) || 1
    const size = Number(params?.pageSize) || 10
    const events = getMockOrderHistory(orderId)
    const { data, meta } = paginateArray(events, page, size)
    return { status: 200, body: ok(data, meta) }
  }

  const orderGet = matchPath(/^\/v1\/orders\/(\d+)$/, path)
  if (method === "GET" && orderGet) {
    const detail = getMockApiOrderDetail(Number(orderGet[1]))
    return { status: 200, body: ok(detail) }
  }

  if (method === "GET" && path === "/v1/orders/stats") {
    return { status: 200, body: ok(getMockOrderStats()) }
  }

  if (method === "POST" && path === "/v1/orders/sync") {
    return { status: 200, body: ok(null) }
  }

  const importPreviewCommit = matchPath(/^\/v1\/orders\/import\/preview\/(\d+)\/commit$/, path)
  if (method === "POST" && importPreviewCommit) {
    return {
      status: 200,
      body: ok({
        importFileId: Number(importPreviewCommit[1]),
        sheetName: "Order SKU list",
        rowCount: 10,
        orderCount: 8,
        itemCount: 15,
        status: "COMPLETED",
        errors: [],
      }),
    }
  }

  const importPreviewExcelRows = matchPath(
    /^\/v1\/orders\/import\/preview\/(\d+)\/orders\/(\d+)\/excel-rows$/,
    path
  )
  if (method === "GET" && importPreviewExcelRows) {
    return {
      status: 200,
      body: ok({
        previewOrderId: Number(importPreviewExcelRows[2]),
        externalOrderId: `#TK-MOCK-${importPreviewExcelRows[2]}`,
        columns: ["SKU", "Quantity", "Price"],
        rows: [
          { excelRowIndex: 1, values: { SKU: "WEP-001", Quantity: "2", Price: "29.99" } },
          { excelRowIndex: 2, values: { SKU: "SWB-014", Quantity: "1", Price: "14.50" } },
        ],
      }),
    }
  }

  const importPreviewDecide = matchPath(/^\/v1\/orders\/import\/preview\/(\d+)\/orders$/, path)
  if (method === "PATCH" && importPreviewDecide) {
    return {
      status: 200,
      body: ok({
        batchId: Number(importPreviewDecide[1]),
        status: "PREVIEW",
        sheetName: "Order SKU list",
        originalFilename: "mock-import.xlsx",
        rowCount: 10,
        totalOrders: 5,
        newCount: 3,
        duplicateCount: 2,
        expiresAt: "2025-12-31T23:59:59Z",
        orders: [],
      }),
    }
  }

  if (method === "POST" && (path === "/v1/orders/import" || path === "/v1/orders/import/preview")) {
    return {
      status: 200,
      body: ok(
        path.endsWith("/preview")
          ? {
              batchId: 99,
              status: "PREVIEW",
              sheetName: "Order SKU list",
              originalFilename: "mock-import.xlsx",
              rowCount: 12,
              totalOrders: 6,
              newCount: 4,
              duplicateCount: 2,
              expiresAt: "2025-12-31T23:59:59Z",
              orders: [
                {
                  id: 1,
                  externalOrderId: "#TK-MOCK-001",
                  matchStatus: "NEW",
                  existingOrderId: null,
                  resolveAction: "CREATE",
                  resolveSource: null,
                  excelItemCount: 3,
                  existingItemCount: null,
                  excelTotalAmount: 120.5,
                  existingTotalAmount: null,
                  warningCode: null,
                },
                {
                  id: 2,
                  externalOrderId: "#TK-MOCK-002",
                  matchStatus: "DUPLICATE",
                  existingOrderId: 2,
                  resolveAction: "MERGE",
                  resolveSource: null,
                  excelItemCount: 2,
                  existingItemCount: 2,
                  excelTotalAmount: 89.99,
                  existingTotalAmount: 85,
                  warningCode: null,
                },
              ],
            }
          : {
              importFileId: 99,
              sheetName: "Order SKU list",
              rowCount: 12,
              orderCount: 6,
              itemCount: 14,
              status: "COMPLETED",
              errors: [],
            }
      ),
    }
  }

  if (method === "POST" && path === "/v1/order-import-files/pageable") {
    const { data, meta } = paginateArray(
      state.importFiles,
      body.pageNumber,
      body.pageSize
    )
    return { status: 200, body: ok(data, meta) }
  }

  const importFileGet = matchPath(/^\/v1\/order-import-files\/(\d+)$/, path)
  if (method === "GET" && importFileGet) {
    return {
      status: 200,
      body: ok(getImportFileById(Number(importFileGet[1])) ?? null),
    }
  }

  if (method === "POST" && path === "/v1/order-input-runs/pageable") {
    const { data, meta } = paginateArray(state.inputRuns, body.pageNumber, body.pageSize)
    return { status: 200, body: ok(data, meta) }
  }

  if (method === "POST" && path === "/v1/order-input-runs/detect-input-file-type") {
    if (!MOCK_USER.orderInputAiAutoChoose) {
      return {
        status: 403,
        body: {
          success: false,
          code: 403,
          message: "AI auto-choose input file type is not enabled for this user.",
          data: null,
        },
      }
    }
    const filename = extractUploadFilename(config.data)
    return {
      status: 200,
      body: ok({ inputFileType: mockDetectInputFileType(filename) }),
    }
  }

  const inputRunDownload = matchPath(/^\/v1\/order-input-runs\/(\d+)\/files\/download$/, path)
  if (method === "GET" && inputRunDownload) {
    const run = getInputRunById(Number(inputRunDownload[1]))
    if (!run) {
      return {
        status: 404,
        body: {
          success: false,
          code: 404,
          message: "Order input run not found.",
          data: null,
        },
      }
    }
    const filename =
      run.inputFileType === "SERVICE_FEE"
        ? run.withdrawFilename ?? "service-fee.xlsx"
        : run.orderDetailFilename ?? "order-detail.xlsx"
    return {
      status: 200,
      body: emptyBlob(),
      isBlob: true,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    }
  }

  const inputRunGet = matchPath(/^\/v1\/order-input-runs\/(\d+)$/, path)
  if (method === "GET" && inputRunGet) {
    return {
      status: 200,
      body: ok(getInputRunById(Number(inputRunGet[1])) ?? null),
    }
  }

  if (method === "POST" && path === "/v1/order-input-runs") {
    const title = String(body.title ?? "New input run")
    const storeId = Number(body.storeId) || 1
    const marketplaceCode = String(body.marketplaceCode ?? "TIKTOK")
    const inputFileType =
      body.inputFileType === "SERVICE_FEE"
        ? ("SERVICE_FEE" as const)
        : ("SHIPPING_FEE" as const)
    const store = getStoreById(storeId)
    const newRun = {
      id: state.nextInputRunId++,
      storeId,
      storeName: store?.name ?? null,
      marketplaceId: marketplaceCode === "LAZADA" ? 1 : 3,
      marketplaceCode,
      title,
      inputFileType,
      status: "DRAFT" as const,
      orderDetailFilename: null,
      orderDetailSize: null,
      orderDetailStatus: "MISSING" as const,
      orderDetailError: null,
      orderDetailStartedAt: null,
      orderDetailFinishedAt: null,
      orderDetailBatchId: null,
      orderDetailImportFileId: null,
      withdrawFilename: null,
      withdrawSize: null,
      withdrawStatus: "MISSING" as const,
      withdrawError: null,
      withdrawStartedAt: null,
      withdrawFinishedAt: null,
      withdrawRowCount: null,
      withdrawMatchedCount: null,
      withdrawUnmatchedCount: null,
      orderCount: null,
      itemCount: null,
      createdAt: NOW,
      updatedAt: NOW,
    }
    state.inputRuns.unshift(newRun)
    return { status: 200, body: ok(newRun) }
  }

  const inputRunTitle = matchPath(/^\/v1\/order-input-runs\/(\d+)\/title$/, path)
  if (method === "PUT" && inputRunTitle) {
    const run = getInputRunById(Number(inputRunTitle[1]))
    if (run) {
      run.title = String(body.title ?? run.title)
      run.updatedAt = NOW
    }
    return { status: 200, body: ok(run ?? null) }
  }

  const inputRunWithdrawRows = matchPath(/^\/v1\/order-input-runs\/(\d+)\/withdraw-rows$/, path)
  if (method === "GET" && inputRunWithdrawRows) {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      excelRowIndex: index + 1,
      externalOrderId: `#TK-W-${index + 1}`,
      orderId: index + 1,
      withdrawAmount: 15 + index,
      totalFees: 2.5,
      adjustmentAmount: 0,
      currency: "USD",
      withdrawAt: NOW,
      matchStatus: index % 3 === 0 ? "UNMATCHED" : "MATCHED",
      applyStatus: index % 4 === 0 ? "PENDING" : "APPLIED",
      errorMessage: null,
    }))
    const page = Number(params?.pageNumber) || 1
    const size = Number(params?.pageSize) || 20
    const { data, meta } = paginateArray(rows, page, size)
    return { status: 200, body: ok(data, meta) }
  }

  const inputRunMutations = [
    "/files/order-detail",
    "/files/withdraw",
    "/run/preview",
    "/run/cancel-preview",
    "/run/reset-stuck",
    "/run/finish",
    "/run/withdraw",
    "/rollback/order-detail",
    "/rollback/withdraw",
  ]
  const inputRunMutation = inputRunMutations.find((suffix) => {
    const pattern = new RegExp(`^/v1/order-input-runs/(\\d+)${suffix.replace(/\//g, "\\/")}$`)
    return method === "POST" && pattern.test(path)
  })
  if (inputRunMutation) {
    const id = Number(path.match(/\/v1\/order-input-runs\/(\d+)/)?.[1])
    const run = getInputRunById(id)
    if (run && inputRunMutation.includes("preview")) {
      return {
        status: 200,
        body: ok({
          batchId: 50,
          status: "PREVIEW",
          sheetName: "Order SKU list",
          originalFilename: "mock-import.xlsx",
          rowCount: 8,
          totalOrders: 4,
          newCount: 3,
          duplicateCount: 1,
          expiresAt: "2025-12-31T23:59:59Z",
          orders: [],
        }),
      }
    }
    return { status: 200, body: ok(run ?? null) }
  }

  if (method === "DELETE" && inputRunGet) {
    const id = Number(inputRunGet[1])
    state.inputRuns = state.inputRuns.filter((r) => r.id !== id)
    return { status: 200, body: ok(null) }
  }

  if (method === "GET" && path === "/v1/marketplace-products/sources") {
    return { status: 200, body: ok(state.productSources) }
  }

  if (method === "GET" && path === "/v1/marketplace-products") {
    const page = Number(params?.page) || 1
    const limit = Number(params?.limit) || 20
    const storeId = Number(params?.storeId)
    const filtered = state.products.filter((p) => !storeId || p.storeId === storeId)
    const { data, meta } = paginateArray(filtered, page, limit)
    return { status: 200, body: ok(data, meta) }
  }

  if (method === "POST" && path === "/v1/marketplace-products/pageable") {
    const filtered = filterProducts(
      state.products,
      body.filter as Record<string, unknown>
    )
    const { data, meta } = paginateArray(filtered, body.pageNumber, body.pageSize)
    return { status: 200, body: ok(data, meta) }
  }

  if (method === "POST" && path === "/v1/marketplace-products/export/preview") {
    const filtered = filterProducts(
      state.products,
      body.filter as Record<string, unknown>
    )
    const { data, meta } = paginateArray(filtered, body.pageNumber, body.pageSize)
    return { status: 200, body: ok(data, meta) }
  }

  if (method === "POST" && path === "/v1/marketplace-products/export") {
    return {
      status: 200,
      body: emptyBlob(),
      isBlob: true,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": "attachment; filename=products-export.xlsx",
      },
    }
  }

  if (method === "GET" && path === "/v1/marketplace-products/stats") {
    const storeId = params?.storeId != null ? Number(params.storeId) : undefined
    const marketplaceCode =
      typeof params?.marketplaceCode === "string" ? params.marketplaceCode : undefined
    let filtered = state.products
    if (storeId) {
      filtered = filtered.filter((p) => p.storeId === storeId)
    }
    if (marketplaceCode) {
      filtered = filtered.filter((p) => p.marketplaceCode === marketplaceCode)
    }
    const synced = filtered.filter((p) => p.erpStatus === "synced").length
    const unmapped = filtered.filter((p) => p.erpStatus === "unmapped").length
    const total = filtered.length
    return {
      status: 200,
      body: ok({
        totalCount: total,
        syncedCount: synced,
        unmappedCount: unmapped,
        mappingRatePercent: total > 0 ? Math.round((synced / total) * 100) : 0,
      }),
    }
  }

  const productGet = matchPath(/^\/v1\/marketplace-products\/(\d+)$/, path)
  if (method === "GET" && productGet) {
    return {
      status: 200,
      body: ok(getProductDetailById(Number(productGet[1]))),
    }
  }

  if (method === "POST" && path === "/v1/marketplace-products/sync") {
    const storeId = Number(params?.storeId) || 1
    const marketplaceCode = (params?.marketplaceCode ??
      "TIKTOK") as MarketplaceCode
    const run = {
      id: state.syncRuns.length + 1,
      storeId,
      marketplaceCode,
      status: "COMPLETED" as const,
      insertedCount: 5,
      updatedCount: 12,
      disabledCount: 0,
      failedCount: 0,
      startedAt: NOW,
      finishedAt: NOW,
      completedAt: NOW,
      errorMessage: null,
    }
    state.syncRuns.push(run)
    return { status: 200, body: ok(run) }
  }

  const syncGet = matchPath(/^\/v1\/marketplace-products\/sync\/(\d+)$/, path)
  if (method === "GET" && syncGet) {
    const id = Number(syncGet[1])
    const run = state.syncRuns.find((r) => r.id === id) ?? {
      id,
      storeId: 1,
      marketplaceCode: "TIKTOK" as const,
      status: "COMPLETED" as const,
      insertedCount: 0,
      updatedCount: 0,
      disabledCount: 0,
      startedAt: NOW,
      finishedAt: NOW,
      errorMessage: null,
    }
    return { status: 200, body: ok(run) }
  }

  const storeMarketplace = matchPath(
    /^\/v1\/stores\/(\d+)\/(lazada|shopee|tiktok)(\/.*)?$/,
    path
  )
  if (storeMarketplace) {
    const storeId = Number(storeMarketplace[1])
    const segment = storeMarketplace[2].toUpperCase()
    const marketplaceCode =
      segment === "LAZADA" ? "LAZADA" : segment === "SHOPEE" ? "SHOPEE" : "TIKTOK"
    const suffix = storeMarketplace[3] ?? ""

    if (method === "GET" && suffix === "/authorize-url") {
      return {
        status: 200,
        body: ok({
          url: `https://mock.example.com/oauth/${marketplaceCode.toLowerCase()}`,
          state: "mock-state",
        }),
      }
    }

    if (method === "GET" && suffix === "/connections") {
      return {
        status: 200,
        body: ok(getConnections(storeId, marketplaceCode)),
      }
    }

    if (method === "POST" && suffix === "/connect") {
      return {
        status: 200,
        body: ok({
          id: storeId,
          storeId,
          marketplaceId: marketplaceCode === "LAZADA" ? 1 : marketplaceCode === "SHOPEE" ? 2 : 3,
          marketplaceCode,
          marketplaceName: marketplaceCode,
          externalConnectionId: `ext-${storeId}-${marketplaceCode}`,
          externalSellerId: `seller-${storeId}`,
          externalCountry: storeId === 3 ? "TH" : "US",
          displayName: `Mock ${marketplaceCode}`,
          tokenExpiry: "2025-12-31T00:00:00Z",
          status: "CONNECTED",
          createdAt: NOW,
          updatedAt: NOW,
        }),
      }
    }

    const refreshConn = matchPath(
      /^\/connections\/([^/]+)\/refresh$/,
      suffix
    )
    if (method === "POST" && refreshConn) {
      return {
        status: 200,
        body: ok({
          id: storeId,
          storeId,
          marketplaceId: 3,
          marketplaceCode,
          marketplaceName: marketplaceCode,
          externalConnectionId: refreshConn[1],
          externalSellerId: `seller-${storeId}`,
          externalCountry: "US",
          displayName: `Mock ${marketplaceCode}`,
          tokenExpiry: "2025-12-31T00:00:00Z",
          status: "CONNECTED",
          createdAt: NOW,
          updatedAt: NOW,
        }),
      }
    }

    const revokeConn = matchPath(/^\/connections\/([^/]+)$/, suffix)
    if (method === "DELETE" && revokeConn) {
      return { status: 200, body: ok(null) }
    }
  }

  console.warn(`[mock-api] Unhandled ${method} ${path}`)

  const fallback: ApiResponse<null> = {
    success: false,
    code: 404,
    message: `Mock API: no handler for ${method} ${path}`,
    data: null,
  }
  return { status: 404, body: fallback }
}
