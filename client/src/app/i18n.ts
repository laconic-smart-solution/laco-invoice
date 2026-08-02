import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import enAuth from "@/locales/en/auth.json"
import enBreadcrumb from "@/locales/en/breadcrumb.json"
import enClassic from "@/locales/en/classic.json"
import enCommon from "@/locales/en/common.json"
import enDashboard from "@/locales/en/dashboard.json"
import enCustomers from "@/locales/en/customers.json"
import enErrors from "@/locales/en/errors.json"
import enUsers from "@/locales/en/users.json"
import enStores from "@/locales/en/stores.json"
import enInvoices from "@/locales/en/invoices.json"
import enNavbar from "@/locales/en/navbar.json"
import enOrders from "@/locales/en/orders.json"
import enProducts from "@/locales/en/products.json"
import enProfile from "@/locales/en/profile.json"
import enShortcuts from "@/locales/en/shortcuts.json"
import enSidebar from "@/locales/en/sidebar.json"
import myAuth from "@/locales/my/auth.json"
import myBreadcrumb from "@/locales/my/breadcrumb.json"
import myClassic from "@/locales/my/classic.json"
import myCommon from "@/locales/my/common.json"
import myDashboard from "@/locales/my/dashboard.json"
import myCustomers from "@/locales/my/customers.json"
import myErrors from "@/locales/my/errors.json"
import myUsers from "@/locales/my/users.json"
import myStores from "@/locales/my/stores.json"
import myInvoices from "@/locales/my/invoices.json"
import myNavbar from "@/locales/my/navbar.json"
import myOrders from "@/locales/my/orders.json"
import myProducts from "@/locales/my/products.json"
import myProfile from "@/locales/my/profile.json"
import myShortcuts from "@/locales/my/shortcuts.json"
import mySidebar from "@/locales/my/sidebar.json"
import thAuth from "@/locales/th/auth.json"
import thBreadcrumb from "@/locales/th/breadcrumb.json"
import thClassic from "@/locales/th/classic.json"
import thCommon from "@/locales/th/common.json"
import thDashboard from "@/locales/th/dashboard.json"
import thCustomers from "@/locales/th/customers.json"
import thErrors from "@/locales/th/errors.json"
import thUsers from "@/locales/th/users.json"
import thStores from "@/locales/th/stores.json"
import thInvoices from "@/locales/th/invoices.json"
import thNavbar from "@/locales/th/navbar.json"
import thOrders from "@/locales/th/orders.json"
import thProducts from "@/locales/th/products.json"
import thProfile from "@/locales/th/profile.json"
import thShortcuts from "@/locales/th/shortcuts.json"
import thSidebar from "@/locales/th/sidebar.json"
import zhAuth from "@/locales/zh/auth.json"
import zhBreadcrumb from "@/locales/zh/breadcrumb.json"
import zhClassic from "@/locales/zh/classic.json"
import zhCommon from "@/locales/zh/common.json"
import zhDashboard from "@/locales/zh/dashboard.json"
import zhCustomers from "@/locales/zh/customers.json"
import zhErrors from "@/locales/zh/errors.json"
import zhUsers from "@/locales/zh/users.json"
import zhStores from "@/locales/zh/stores.json"
import zhInvoices from "@/locales/zh/invoices.json"
import zhNavbar from "@/locales/zh/navbar.json"
import zhOrders from "@/locales/zh/orders.json"
import zhProducts from "@/locales/zh/products.json"
import zhProfile from "@/locales/zh/profile.json"
import zhShortcuts from "@/locales/zh/shortcuts.json"
import zhSidebar from "@/locales/zh/sidebar.json"

export const SUPPORTED_LOCALES = ["en", "th", "zh", "my"] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      breadcrumb: enBreadcrumb,
      classic: enClassic,
      sidebar: enSidebar,
      navbar: enNavbar,
      dashboard: enDashboard,
      orders: enOrders,
      invoices: enInvoices,
      customers: enCustomers,
      errors: enErrors,
      users: enUsers,
      stores: enStores,
      products: enProducts,
      profile: enProfile,
      shortcuts: enShortcuts,
    },
    th: {
      common: thCommon,
      auth: thAuth,
      breadcrumb: thBreadcrumb,
      classic: thClassic,
      sidebar: thSidebar,
      navbar: thNavbar,
      dashboard: thDashboard,
      orders: thOrders,
      invoices: thInvoices,
      customers: thCustomers,
      errors: thErrors,
      users: thUsers,
      stores: thStores,
      products: thProducts,
      profile: thProfile,
      shortcuts: thShortcuts,
    },
    zh: {
      common: zhCommon,
      auth: zhAuth,
      breadcrumb: zhBreadcrumb,
      classic: zhClassic,
      sidebar: zhSidebar,
      navbar: zhNavbar,
      dashboard: zhDashboard,
      orders: zhOrders,
      invoices: zhInvoices,
      customers: zhCustomers,
      errors: zhErrors,
      users: zhUsers,
      stores: zhStores,
      products: zhProducts,
      profile: zhProfile,
      shortcuts: zhShortcuts,
    },
    my: {
      common: myCommon,
      auth: myAuth,
      breadcrumb: myBreadcrumb,
      classic: myClassic,
      sidebar: mySidebar,
      navbar: myNavbar,
      dashboard: myDashboard,
      orders: myOrders,
      invoices: myInvoices,
      customers: myCustomers,
      errors: myErrors,
      users: myUsers,
      stores: myStores,
      products: myProducts,
      profile: myProfile,
      shortcuts: myShortcuts,
    },
  },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
