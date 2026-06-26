import { lazy } from "react"

import { PageLoader } from "@/components/core/page-loader"
import { SectionPlaceholderPage } from "@/features/dashboard/pages/section-placeholder-page"

export const DashboardPage = PageLoader(
  lazy(() =>
    import("@/features/dashboard/pages/dashboard-page").then((module) => ({
      default: module.DashboardPage,
    }))
  )
)

export const OrdersPage = PageLoader(
  lazy(() =>
    import("@/features/orders/pages/orders-page").then((module) => ({
      default: module.OrdersPage,
    }))
  )
)

export const OrderDetailPage = PageLoader(
  lazy(() =>
    import("@/features/orders/pages/order-detail-page").then((module) => ({
      default: module.OrderDetailPage,
    }))
  )
)

export const InvoicesPage = PageLoader(
  lazy(() =>
    import("@/features/invoices/pages/invoices-page").then((module) => ({
      default: module.InvoicesPage,
    }))
  )
)

export const InvoiceDetailPage = PageLoader(
  lazy(() =>
    import("@/features/invoices/pages/invoice-detail-page").then((module) => ({
      default: module.InvoiceDetailPage,
    }))
  )
)

export const CustomersPage = PageLoader(
  lazy(() =>
    import("@/features/customers/pages/customers-page").then((module) => ({
      default: module.CustomersPage,
    }))
  )
)

export const LoginPage = PageLoader(
  lazy(() =>
    import("@/features/auth/pages/login-page").then((module) => ({
      default: module.LoginPage,
    }))
  )
)

export const RegisterPage = PageLoader(
  lazy(() =>
    import("@/features/auth/pages/register-page").then((module) => ({
      default: module.RegisterPage,
    }))
  )
)

export const ForgotPasswordPage = PageLoader(
  lazy(() =>
    import("@/features/auth/pages/forgot-password-page").then((module) => ({
      default: module.ForgotPasswordPage,
    }))
  )
)

export const OtpVerifyPage = PageLoader(
  lazy(() =>
    import("@/features/auth/pages/otp-verify-page").then((module) => ({
      default: module.OtpVerifyPage,
    }))
  )
)

export const ResetPasswordPage = PageLoader(
  lazy(() =>
    import("@/features/auth/pages/reset-password-page").then((module) => ({
      default: module.ResetPasswordPage,
    }))
  )
)

export { SectionPlaceholderPage }
