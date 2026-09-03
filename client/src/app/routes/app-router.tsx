import { createBrowserRouter } from "react-router-dom"

import { ROUTES } from "@/app/constants/routes"
import {
  CustomersPage,
  CreateCustomerPage,
  DashboardPage,
  EditCustomerPage,
  ForgotPasswordPage,
  InvoicesPage,
  InvoiceDetailPage,
  VouchersPage,
  VoucherDetailPage,
  LoginPage,
  OrderDetailPage,
  OrderImportFilesPage,
  OrderImportFileDetailPage,
  OrderInputRunsPage,
  OrderInputRunDetailPage,
  OrdersPage,
  OtpVerifyPage,
  ProductsPage,
  ProductDetailPage,
  RegisterPage,
  ResetPasswordPage,
  UsersPage,
  CreateUserPage,
  UserDetailPage,
  StoresPage,
  CreateStorePage,
  StoreDetailPage,
  MarketplaceOAuthCallbackPage,
  ProfilePage,
  ShortcutsPage,
} from "@/app/constants/lazyload"
import { AdminRoute } from "@/components/common/admin-route"
import { GuestRoute } from "@/components/common/guest-route"
import { ProtectedRoute } from "@/components/common/protected-route"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { NotFoundPage } from "@/features/errors/pages/not-found-page"
import { ServerErrorPage } from "@/features/errors/pages/server-error-page"
import { SomethingWentWrongPage } from "@/features/errors/pages/something-went-wrong-page"

export const router = createBrowserRouter([
  {
    errorElement: <SomethingWentWrongPage />,
    children: [
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
                path: `${ROUTES.dashboard.products}/:productId`,
                element: <ProductDetailPage />,
              },
              {
                path: ROUTES.dashboard.orders,
                element: <OrdersPage />,
              },
              {
                path: ROUTES.dashboard.orderImports,
                element: <OrderImportFilesPage />,
              },
              {
                path: `${ROUTES.dashboard.orderImports}/:importFileId`,
                element: <OrderImportFileDetailPage />,
              },
              {
                path: ROUTES.dashboard.orderInputs,
                element: <OrderInputRunsPage />,
              },
              {
                path: `${ROUTES.dashboard.orderInputs}/:inputRunId`,
                element: <OrderInputRunDetailPage />,
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
                path: `${ROUTES.dashboard.invoices}/:id`,
                element: <InvoiceDetailPage />,
              },
              {
                path: ROUTES.dashboard.vouchers,
                element: <VouchersPage />,
              },
              {
                path: `${ROUTES.dashboard.vouchers}/:id`,
                element: <VoucherDetailPage />,
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
                  {
                    path: `${ROUTES.dashboard.users}/:userId`,
                    element: <UserDetailPage />,
                  },
                ],
              },
              {
                path: ROUTES.dashboard.profile,
                element: <ProfilePage />,
              },
              {
                path: ROUTES.dashboard.shortcuts,
                element: <ShortcutsPage />,
              },
              {
                path: ROUTES.dashboard.settings,
                element: <ProfilePage />,
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
        path: ROUTES.errors.serverError,
        element: <ServerErrorPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
])
