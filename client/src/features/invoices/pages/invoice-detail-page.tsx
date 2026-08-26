import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Printer,
  FileText,
  Building2,
  Calendar,
  Layers,
  Receipt,
  Search,
  Check,
  Store,
  HandCoins,
  ClipboardList,
  Scale,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge, type StatusBadgeVariant } from "@/components/common/status-badge"
import { formatCurrency, formatNumber } from "@/util/format"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { ROUTES } from "@/app/constants/routes"
import { useInvoiceDetailQuery, useUpdateInvoiceStatusMutation } from "../queries/invoice.query"
import { InvoiceTaxPreview } from "../components/invoice-tax-preview"

function getInvoiceStatusBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case "PAID":
      return "paid"
    case "ISSUED":
      return "synced"
    case "DRAFT":
      return "draft"
    case "VOID":
    default:
      return "failed"
  }
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const locale = useLocaleStore((state) => state.locale)

  const [activeTab, setActiveTab] = useState<"orders" | "items" | "tax">("orders")
  const [orderSearch, setOrderSearch] = useState("")
  const [showTaxPreview, setShowTaxPreview] = useState(false)

  const invoiceQuery = useInvoiceDetailQuery(id)
  const updateStatusMutation = useUpdateInvoiceStatusMutation()

  const invoice = invoiceQuery.data

  if (invoiceQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
        Loading invoice details…
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center border border-border bg-card shadow-sm">
        <FileText className="mx-auto size-10 text-muted-foreground/50" />
        <h2 className="font-heading text-lg font-semibold">Invoice Not Found</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The requested invoice does not exist or has been removed.
        </p>
        <Button asChild>
          <Link to={ROUTES.dashboard.invoices}>Back to Invoices</Link>
        </Button>
      </div>
    )
  }

  const filteredOrders = (invoice.orders || []).filter(
    (o) =>
      o.externalOrderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.buyerName && o.buyerName.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (o.buyerTaxId && o.buyerTaxId.includes(orderSearch))
  )

  const handleMarkPaid = () => {
    updateStatusMutation.mutate({ id: invoice.id, status: "PAID" })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back Link & Header */}
      <div>
        <Link
          to={ROUTES.dashboard.invoices}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="size-3.5" /> Back to Invoices
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                {invoice.title}
              </h1>
              <StatusBadge
                status={getInvoiceStatusBadgeVariant(invoice.status)}
                label={invoice.status}
              />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-foreground">{invoice.invoiceNumber}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Store className="size-3.5" /> {invoice.storeName}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" /> {invoice.startDate} → {invoice.endDate}
              </span>
              {invoice.orderRunTitle && (
                <>
                  <span>·</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary font-medium">
                    Batch: {invoice.orderRunTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTaxPreview(true)}
            >
              <Printer className="size-4" />
              Tax Invoice PDF
            </Button>
            {invoice.status !== "PAID" && (
              <Button
                type="button"
                className="border-primary text-primary"
                variant="outline"
                onClick={handleMarkPaid}
                disabled={updateStatusMutation.isPending}
              >
                <Check className="size-4" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Standard Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="TOTAL ORDERS"
          value={`${formatNumber(invoice.orderCount, locale)} Orders`}
          icon={ClipboardList}
          iconWrapperClassName="bg-info/10 text-info"
        />
        <StatCard
          title="SUBTOTAL (EX-VAT)"
          value={formatCurrency(invoice.subtotal, locale, invoice.currency)}
          icon={HandCoins}
          iconWrapperClassName="bg-muted text-foreground"
        />
        <StatCard
          title="VAT (7%)"
          value={formatCurrency(invoice.vatAmount, locale, invoice.currency)}
          icon={Receipt}
          iconWrapperClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="GRAND TOTAL"
          value={formatCurrency(invoice.grandTotal, locale, invoice.currency)}
          icon={Scale}
          iconWrapperClassName="bg-success/10 text-success"
        />
      </div>

      {/* Tabs & Table Layout */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-border text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === "orders"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="size-4" />
            Orders Listing ({invoice.orderCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === "items"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-4" />
            Order Line Items ({invoice.items?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tax")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === "tax"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="size-4" />
            Buyer & Tax Info
          </button>
        </div>

        {/* Tab 1: Orders Listing */}
        {activeTab === "orders" && (
          <div className="border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="relative w-72">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search order ID, buyer…"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="h-9 pl-8 text-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Showing {filteredOrders.length} of {invoice.orderCount} orders
              </p>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur font-medium text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">ORDER ID</th>
                    <th className="px-4 py-3">DATE</th>
                    <th className="px-4 py-3">BUYER NAME</th>
                    <th className="px-4 py-3">BUYER TAX ID</th>
                    <th className="px-4 py-3 text-center">ITEMS</th>
                    <th className="px-4 py-3 text-right">AMOUNT (EX-VAT)</th>
                    <th className="px-4 py-3 text-right">VAT (7%)</th>
                    <th className="px-4 py-3 text-right">TOTAL (INC. VAT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((ord, idx) => (
                    <tr key={ord.orderId} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground">
                        {ord.externalOrderId}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{ord.orderDate}</td>
                      <td className="px-4 py-3">{ord.buyerName || "—"}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {ord.buyerTaxId || "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">{ord.itemCount}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(ord.amountExVat, locale, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-primary font-medium">
                        {formatCurrency(ord.vatAmount, locale, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(ord.totalAmount, locale, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Line Items Breakdown */}
        {activeTab === "items" && (
          <div className="border border-border bg-card shadow-sm">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur font-medium text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">ORDER ID</th>
                    <th className="px-4 py-3">PRODUCT NAME</th>
                    <th className="px-4 py-3">SELLER SKU</th>
                    <th className="px-4 py-3">VARIATION</th>
                    <th className="px-4 py-3 text-center">QTY</th>
                    <th className="px-4 py-3 text-right">UNIT PRICE</th>
                    <th className="px-4 py-3 text-right">DISCOUNT</th>
                    <th className="px-4 py-3 text-right">LINE TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(invoice.items || []).map((item, idx) => (
                    <tr key={item.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {item.externalOrderId}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{item.sellerSku}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.variation || "—"}</td>
                      <td className="px-4 py-3 text-center font-mono font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(item.unitPrice, locale, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        -{formatCurrency(item.discount, locale, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(item.totalAmount, locale, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Buyer & Tax Info */}
        {activeTab === "tax" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="font-heading text-sm font-semibold text-foreground">Issuer / Seller Information</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p><strong className="text-foreground">Store:</strong> {invoice.storeName}</p>
                <p><strong className="text-foreground">Tax ID:</strong> 0105558123456 (Head Office)</p>
                <p><strong className="text-foreground">Channel:</strong> {invoice.marketplaceCode} Shop</p>
                <p><strong className="text-foreground">Currency:</strong> {invoice.currency}</p>
                <p><strong className="text-foreground">VAT Rate:</strong> {(invoice.vatRate * 100).toFixed(0)}% Standard Tax</p>
              </div>
            </div>

            <div className="border border-border bg-card p-5 space-y-3 shadow-sm">
              <h3 className="font-heading text-sm font-semibold text-foreground">Customer / Buyer Information</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p><strong className="text-foreground">Buyer Name:</strong> {invoice.buyerName || "—"}</p>
                <p><strong className="text-foreground">Buyer Tax ID:</strong> {invoice.buyerTaxId || "N/A"}</p>
                <p><strong className="text-foreground">Address:</strong> {invoice.buyerAddress || "—"}</p>
                {invoice.notes && (
                  <p className="mt-2 pt-2 border-t border-border">
                    <strong className="text-foreground">Notes:</strong> {invoice.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax Invoice Printable Preview Modal */}
      {showTaxPreview && (
        <InvoiceTaxPreview
          invoice={invoice}
          onClose={() => setShowTaxPreview(false)}
        />
      )}
    </div>
  )
}
export default InvoiceDetailPage
