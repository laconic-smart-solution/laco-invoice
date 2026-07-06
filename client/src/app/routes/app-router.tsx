import { createBrowserRouter } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  CustomersPage,
  DashboardPage,
  ForgotPasswordPage,
  InvoiceDetailPage,
  InvoicesPage,
  LoginPage,
  OrderDetailPage,
  OrdersPage,
  OtpVerifyPage,
  ProductsPage,
  RegisterPage,
  ResetPasswordPage,
  SectionPlaceholderPage,
} from "@/app/constants/lazyload"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.dashboard.stores,
        element: <SectionPlaceholderPage />,
      },
      {
        path: ROUTES.dashboard.products,
        element: <ProductsPage />,
      },
      {
        path: ROUTES.dashboard.orders,
        element: <OrdersPage />,
      },
      {
        path: `${ROUTES.dashboard.orders}/:orderId`,
        element: <OrderDetailPage />,
      },
      {
        path: ROUTES.dashboard.invoices,
        element: <InvoicesPage />,
      },
      {
        path: `${ROUTES.dashboard.invoices}/:invoiceId`,
        element: <InvoiceDetailPage />,
      },
      {
        path: ROUTES.dashboard.customers,
        element: <CustomersPage />,
      },
      {
        path: ROUTES.dashboard.settings,
        element: <SectionPlaceholderPage />,
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.auth.login,
        element: <LoginPage />,
      },
      {
        path: ROUTES.auth.register,
        element: <RegisterPage />,
      },
      {
        path: ROUTES.auth.forgotPassword,
        element: <ForgotPasswordPage />,
      },
      {
        path: ROUTES.auth.otpVerify,
        element: <OtpVerifyPage />,
      },
      {
        path: ROUTES.auth.resetPassword,
        element: <ResetPasswordPage />,
      },
    ],
  },
])
