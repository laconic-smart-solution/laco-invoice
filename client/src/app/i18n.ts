import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import enAuth from "@/locales/en/auth.json"
import enBreadcrumb from "@/locales/en/breadcrumb.json"
import enCommon from "@/locales/en/common.json"
import enDashboard from "@/locales/en/dashboard.json"
import enCustomers from "@/locales/en/customers.json"
import enInvoices from "@/locales/en/invoices.json"
import enNavbar from "@/locales/en/navbar.json"
import enOrders from "@/locales/en/orders.json"
import enProducts from "@/locales/en/products.json"
import enSidebar from "@/locales/en/sidebar.json"
import thAuth from "@/locales/th/auth.json"
import thBreadcrumb from "@/locales/th/breadcrumb.json"
import thCommon from "@/locales/th/common.json"
import thDashboard from "@/locales/th/dashboard.json"
import thCustomers from "@/locales/th/customers.json"
import thInvoices from "@/locales/th/invoices.json"
import thNavbar from "@/locales/th/navbar.json"
import thOrders from "@/locales/th/orders.json"
import thProducts from "@/locales/th/products.json"
import thSidebar from "@/locales/th/sidebar.json"
import zhAuth from "@/locales/zh/auth.json"
import zhBreadcrumb from "@/locales/zh/breadcrumb.json"
import zhCommon from "@/locales/zh/common.json"
import zhDashboard from "@/locales/zh/dashboard.json"
import zhCustomers from "@/locales/zh/customers.json"
import zhInvoices from "@/locales/zh/invoices.json"
import zhNavbar from "@/locales/zh/navbar.json"
import zhOrders from "@/locales/zh/orders.json"
import zhProducts from "@/locales/zh/products.json"
import zhSidebar from "@/locales/zh/sidebar.json"

export const SUPPORTED_LOCALES = ["en", "th", "zh"] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      breadcrumb: enBreadcrumb,
      sidebar: enSidebar,
      navbar: enNavbar,
      dashboard: enDashboard,
      orders: enOrders,
      invoices: enInvoices,
      customers: enCustomers,
      products: enProducts,
    },
    th: {
      common: thCommon,
      auth: thAuth,
      breadcrumb: thBreadcrumb,
      sidebar: thSidebar,
      navbar: thNavbar,
      dashboard: thDashboard,
      orders: thOrders,
      invoices: thInvoices,
      customers: thCustomers,
      products: thProducts,
    },
    zh: {
      common: zhCommon,
      auth: zhAuth,
      breadcrumb: zhBreadcrumb,
      sidebar: zhSidebar,
      navbar: zhNavbar,
      dashboard: zhDashboard,
      orders: zhOrders,
      invoices: zhInvoices,
      customers: zhCustomers,
      products: zhProducts,
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
