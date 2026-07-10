import { createBrowserRouter } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  CustomersPage,
  CreateCustomerPage,
  DashboardPage,
  EditCustomerPage,
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
  UsersPage,
  CreateUserPage,
  StoresPage,
  CreateStorePage,
  StoreDetailPage,
  MarketplaceOAuthCallbackPage,
} from "@/app/constants/lazyload"
import { AdminRoute } from "@/components/common/admin-route"
import { GuestRoute } from "@/components/common/guest-route"
import { ProtectedRoute } from "@/components/common/protected-route"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { NotFoundPage } from "@/features/errors/pages/not-found-page"

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.dashboard.stores,
        element: <StoresPage />,
      },
      {
        path: ROUTES.dashboard.storeCreate,
        element: <CreateStorePage />,
      },
      {
        path: `${ROUTES.dashboard.stores}/:marketplace/callback`,
        element: <MarketplaceOAuthCallbackPage />,
      },
      {
        path: `${ROUTES.dashboard.stores}/:storeId`,
        element: <StoreDetailPage />,
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
        path: ROUTES.dashboard.customerCreate,
        element: <CreateCustomerPage />,
      },
      {
        path: `${ROUTES.dashboard.customers}/:customerId/edit`,
        element: <EditCustomerPage />,
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: ROUTES.dashboard.users,
            element: <UsersPage />,
          },
          {
            path: ROUTES.dashboard.userCreate,
            element: <CreateUserPage />,
          },
        ],
      },
      {
        path: ROUTES.dashboard.settings,
        element: <SectionPlaceholderPage />,
      },
        ],
      },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
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
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
