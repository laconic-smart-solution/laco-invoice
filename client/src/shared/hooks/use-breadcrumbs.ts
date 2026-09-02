import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { SIDEBAR_NAV_ITEMS } from "@/constants/navigation"
import { getMockOrderById } from "@/features/orders/data/mock-orders"
import { useOrderInputRunDetailQuery } from "@/shared/queries/order-input-run.query"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation()
  const { orderId, customerId, productId, inputRunId } = useParams()
  const { t } = useTranslation(["breadcrumb", "sidebar", "common", "products", "customers", "users"])
  const inputRunIdFromPath = pathname.startsWith(`${ROUTES.dashboard.orderInputs}/`)
    ? pathname.split("/").pop()
    : undefined
  const resolvedInputRunId = inputRunId || inputRunIdFromPath
  const parsedInputRunId = Number(resolvedInputRunId)
  const inputRunDetailQuery = useOrderInputRunDetailQuery(
    Number.isFinite(parsedInputRunId) && parsedInputRunId > 0
      ? parsedInputRunId
      : null
  )
  const inputRunTitle = inputRunDetailQuery.data?.title?.trim() || ""

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
      const invoiceId = pathname.split("/").pop()
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: "Invoices", href: ROUTES.dashboard.invoices },
        { label: invoiceId ?? "" },
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
      const order = getMockOrderById(orderId)

      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.orders"), href: ROUTES.dashboard.orders },
        { label: order?.orderId ?? orderId },
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
  }, [customerId, inputRunTitle, orderId, pathname, resolvedInputRunId, t])
}
