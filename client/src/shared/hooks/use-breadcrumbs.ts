import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { SIDEBAR_NAV_ITEMS } from "@/constants/navigation"
import { useInvoiceDetailQuery } from "@/features/invoices/queries/invoice.query"
import { useVoucherDetailQuery } from "@/features/vouchers/queries/voucher.query"
import { useOrderDetailQuery } from "@/shared/queries/order.query"
import { useOrderInputRunDetailQuery } from "@/shared/queries/order-input-run.query"

export interface BreadcrumbItem {
  label: string
  href?: string
}

function lastPathSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean).pop() ?? ""
}

function parsePositiveId(value: string | undefined): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation()
  const { orderId, customerId, productId, inputRunId } = useParams()
  const { t } = useTranslation(["breadcrumb", "sidebar", "common", "products", "customers", "users"])
  const inputRunIdFromPath = pathname.startsWith(`${ROUTES.dashboard.orderInputs}/`)
    ? lastPathSegment(pathname)
    : undefined
  const resolvedInputRunId = inputRunId || inputRunIdFromPath
  const parsedInputRunId = Number(resolvedInputRunId)
  const inputRunDetailQuery = useOrderInputRunDetailQuery(
    Number.isFinite(parsedInputRunId) && parsedInputRunId > 0
      ? parsedInputRunId
      : null
  )
  const inputRunTitle = inputRunDetailQuery.data?.title?.trim() || ""
  const isInvoiceDetailPath = pathname.startsWith(`${ROUTES.dashboard.invoices}/`)
  const isVoucherDetailPath = pathname.startsWith(`${ROUTES.dashboard.vouchers}/`)
  const invoicePathId = isInvoiceDetailPath ? lastPathSegment(pathname) : ""
  const voucherPathId = isVoucherDetailPath ? lastPathSegment(pathname) : ""
  const invoiceDetailQuery = useInvoiceDetailQuery(
    isInvoiceDetailPath ? parsePositiveId(invoicePathId) : null
  )
  const voucherDetailQuery = useVoucherDetailQuery(
    isVoucherDetailPath ? parsePositiveId(voucherPathId) : null
  )
  const isOrderDetailPath =
    Boolean(orderId) &&
    pathname.startsWith(`${ROUTES.dashboard.orders}/`) &&
    !pathname.startsWith(ROUTES.dashboard.orderImports) &&
    !pathname.startsWith(ROUTES.dashboard.orderInputs)
  const orderDetailQuery = useOrderDetailQuery(
    isOrderDetailPath ? parsePositiveId(orderId) : null
  )
  const invoiceTitle = invoiceDetailQuery.data?.invoiceNumber?.trim() || ""
  const voucherTitle =
    voucherDetailQuery.data?.voucherNumber?.trim() ||
    voucherDetailQuery.data?.erpVoucherNo?.trim() ||
    ""
  const orderTitle =
    orderDetailQuery.data?.order.externalOrderId?.trim() || ""

  return useMemo(() => {
    if (pathname === ROUTES.dashboard.root) {
      return [{ label: t("sidebar:nav.dashboard") }]
    }

    if (pathname === ROUTES.dashboard.products) {
      return [
        { label: t("sidebar:nav.products"), href: ROUTES.dashboard.products },
        { label: t("products:breadcrumb.store_management") },
      ]
    }

    if (productId && pathname.startsWith(`${ROUTES.dashboard.products}/`)) {
      return [
        { label: t("sidebar:nav.products"), href: ROUTES.dashboard.products },
        { label: t("products:breadcrumb.store_management"), href: ROUTES.dashboard.products },
        { label: productId },
      ]
    }

    const navItem = SIDEBAR_NAV_ITEMS.find(
      (item) => item.path !== ROUTES.dashboard.root && item.path === pathname
    )

    if (navItem) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t(`sidebar:nav.${navItem.key}`) },
      ]
    }

    if (pathname === ROUTES.dashboard.orderImports) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.orders"), href: ROUTES.dashboard.orders },
        { label: t("sidebar:nav.order_imports") },
      ]
    }

    if (pathname.startsWith(`${ROUTES.dashboard.orderImports}/`)) {
      const importFileId = pathname.split("/").pop()
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.orders"), href: ROUTES.dashboard.orders },
        {
          label: t("sidebar:nav.order_imports"),
          href: ROUTES.dashboard.orderImports,
        },
        { label: importFileId ?? "" },
      ]
    }

    if (pathname === ROUTES.dashboard.invoices) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: "Invoices" },
      ]
    }

    if (pathname.startsWith(`${ROUTES.dashboard.invoices}/`)) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.invoices"), href: ROUTES.dashboard.invoices },
        { label: invoiceTitle || t("sidebar:nav.invoices") },
      ]
    }

    if (pathname.startsWith(`${ROUTES.dashboard.vouchers}/`)) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.vouchers"), href: ROUTES.dashboard.vouchers },
        { label: voucherTitle || t("sidebar:nav.vouchers") },
      ]
    }

    if (pathname === ROUTES.dashboard.orderInputs) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.orders"), href: ROUTES.dashboard.orders },
        { label: t("sidebar:nav.order_inputs") },
      ]
    }

    if (pathname.startsWith(`${ROUTES.dashboard.orderInputs}/`)) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.orders"), href: ROUTES.dashboard.orders },
        {
          label: t("sidebar:nav.order_inputs"),
          href: ROUTES.dashboard.orderInputs,
        },
        { label: inputRunTitle || resolvedInputRunId || "" },
      ]
    }

    if (
      orderId &&
      pathname.startsWith(`${ROUTES.dashboard.orders}/`) &&
      !pathname.startsWith(ROUTES.dashboard.orderImports) &&
      !pathname.startsWith(ROUTES.dashboard.orderInputs)
    ) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.orders"), href: ROUTES.dashboard.orders },
        { label: orderTitle || orderId },
      ]
    }

    if (pathname === ROUTES.dashboard.customerCreate) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.customers"), href: ROUTES.dashboard.customers },
        { label: t("customers:create.title") },
      ]
    }

    if (pathname === ROUTES.dashboard.userCreate) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.users"), href: ROUTES.dashboard.users },
        { label: t("users:create.title") },
      ]
    }

    if (customerId && pathname.endsWith("/edit")) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.customers"), href: ROUTES.dashboard.customers },
        { label: t("customers:edit.title") },
      ]
    }

    switch (pathname) {
      case ROUTES.auth.login:
        return [
          { label: t("common:app.name"), href: ROUTES.auth.login },
          { label: t("breadcrumb:login") },
        ]
      case ROUTES.auth.register:
        return [
          { label: t("common:app.name"), href: ROUTES.auth.login },
          { label: t("breadcrumb:register") },
        ]
      case ROUTES.auth.forgotPassword:
        return [
          { label: t("common:app.name"), href: ROUTES.auth.login },
          { label: t("breadcrumb:forgot_password") },
        ]
      case ROUTES.auth.resetPassword:
        return [
          { label: t("common:app.name"), href: ROUTES.auth.login },
          { label: t("breadcrumb:reset_password") },
        ]
      case ROUTES.auth.otpVerify:
        return [
          { label: t("common:app.name"), href: ROUTES.auth.login },
          { label: t("breadcrumb:otp_verify") },
        ]
      default:
        return [{ label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root }]
    }
  }, [customerId, inputRunTitle, invoiceTitle, orderId, orderTitle, pathname, resolvedInputRunId, t, voucherTitle])
}
