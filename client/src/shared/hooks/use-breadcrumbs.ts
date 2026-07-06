import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useParams } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import { SIDEBAR_NAV_ITEMS } from "@/constants/navigation"
import { getMockOrderById } from "@/features/orders/data/mock-orders"
import { getMockInvoiceById } from "@/features/invoices/data/mock-invoices"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation()
  const { orderId, invoiceId } = useParams()
  const { t } = useTranslation(["breadcrumb", "sidebar", "common", "products"])

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

    const navItem = SIDEBAR_NAV_ITEMS.find(
      (item) => item.path !== ROUTES.dashboard.root && item.path === pathname
    )

    if (navItem) {
      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t(`sidebar:nav.${navItem.key}`) },
      ]
    }

    if (invoiceId && pathname.startsWith(`${ROUTES.dashboard.invoices}/`)) {
      const invoice = getMockInvoiceById(invoiceId)

      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.invoices"), href: ROUTES.dashboard.invoices },
        { label: invoice?.invoiceNo ?? invoiceId },
      ]
    }

    if (orderId && pathname.startsWith(`${ROUTES.dashboard.orders}/`)) {
      const order = getMockOrderById(orderId)

      return [
        { label: t("sidebar:nav.dashboard"), href: ROUTES.dashboard.root },
        { label: t("sidebar:nav.orders"), href: ROUTES.dashboard.orders },
        { label: order?.orderId ?? orderId },
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
  }, [invoiceId, orderId, pathname, t])
}
