import { lazy } from "react"

import { PageLoader } from "@/components/core/page-loader"

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

export const OrderImportFilesPage = PageLoader(
  lazy(() =>
    import("@/features/orders/pages/order-import-files-page").then((module) => ({
      default: module.OrderImportFilesPage,
    }))
  )
)

export const OrderImportFileDetailPage = PageLoader(
  lazy(() =>
    import("@/features/orders/pages/order-import-file-detail-page").then(
      (module) => ({
        default: module.OrderImportFileDetailPage,
      })
    )
  )
)

export const OrderInputRunsPage = PageLoader(
  lazy(() =>
    import("@/features/orders/pages/order-input-runs-page").then((module) => ({
      default: module.OrderInputRunsPage,
    }))
  )
)

export const OrderInputRunDetailPage = PageLoader(
  lazy(() =>
    import("@/features/orders/pages/order-input-run-detail-page").then(
      (module) => ({
        default: module.OrderInputRunDetailPage,
      })
    )
  )
)

export const CustomersPage = PageLoader(
  lazy(() =>
    import("@/features/customers/pages/customers-page").then((module) => ({
      default: module.CustomersPage,
    }))
  )
)

export const CreateCustomerPage = PageLoader(
  lazy(() =>
    import("@/features/customers/pages/create-customer-page").then((module) => ({
      default: module.CreateCustomerPage,
    }))
  )
)

export const EditCustomerPage = PageLoader(
  lazy(() =>
    import("@/features/customers/pages/edit-customer-page").then((module) => ({
      default: module.EditCustomerPage,
    }))
  )
)

export const UsersPage = PageLoader(
  lazy(() =>
    import("@/features/users/pages/users-page").then((module) => ({
      default: module.UsersPage,
    }))
  )
)

export const CreateUserPage = PageLoader(
  lazy(() =>
    import("@/features/users/pages/create-user-page").then((module) => ({
      default: module.CreateUserPage,
    }))
  )
)

export const UserDetailPage = PageLoader(
  lazy(() =>
    import("@/features/users/pages/user-detail-page").then((module) => ({
      default: module.UserDetailPage,
    }))
  )
)

export const ProfilePage = PageLoader(
  lazy(() =>
    import("@/features/profile/pages/profile-page").then((module) => ({
      default: module.ProfilePage,
    }))
  )
)

export const StoresPage = PageLoader(
  lazy(() =>
    import("@/features/stores/pages/stores-page").then((module) => ({
      default: module.StoresPage,
    }))
  )
)

export const CreateStorePage = PageLoader(
  lazy(() =>
    import("@/features/stores/pages/create-store-page").then((module) => ({
      default: module.CreateStorePage,
    }))
  )
)

export const StoreDetailPage = PageLoader(
  lazy(() =>
    import("@/features/stores/pages/store-detail-page").then((module) => ({
      default: module.StoreDetailPage,
    }))
  )
)

export const MarketplaceOAuthCallbackPage = PageLoader(
  lazy(() =>
    import("@/features/stores/pages/marketplace-oauth-callback-page").then((module) => ({
      default: module.MarketplaceOAuthCallbackPage,
    }))
  )
)

export const LazadaCallbackPage = MarketplaceOAuthCallbackPage

export const ProductsPage = PageLoader(
  lazy(() =>
    import("@/features/products/pages/products-page").then((module) => ({
      default: module.ProductsPage,
    }))
  )
)

export const ProductDetailPage = PageLoader(
  lazy(() =>
    import("@/features/products/pages/product-detail-page").then((module) => ({
      default: module.ProductDetailPage,
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

export const ShortcutsPage = PageLoader(
  lazy(() =>
    import("@/features/shortcuts/pages/shortcuts-page").then((module) => ({
      default: module.ShortcutsPage,
    }))
  )
)
