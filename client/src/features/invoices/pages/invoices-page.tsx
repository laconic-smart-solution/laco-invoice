import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ClipboardList,
  FileText,
  HandCoins,
  ListFilter,
  Plus,
  Printer,
  Receipt,
  Scale,
  Search,
  Store,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge, type StatusBadgeVariant } from "@/components/common/status-badge"
import { formatCurrency, formatNumber } from "@/util/format"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { ROUTES } from "@/app/constants/routes"
import { useInvoicesQuery } from "../queries/invoice.query"
import { CreateInvoiceDialog } from "../components/create-invoice-dialog"
import { InvoiceTaxPreview } from "../components/invoice-tax-preview"
import type { Invoice } from "../types/invoice"

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

export function InvoicesPage() {
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [storeFilter, setStoreFilter] = useState("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)

  const invoicesQuery = useInvoicesQuery()
  const invoices = invoicesQuery.data ?? []

  // Computed summary metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
  const totalVat = invoices.reduce((sum, inv) => sum + inv.vatAmount, 0)
  const totalOrders = invoices.reduce((sum, inv) => sum + inv.orderCount, 0)
  const activeInvoicesCount = invoices.filter((i) => i.status !== "VOID").length

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.title.toLowerCase().includes(search.toLowerCase()) ||
      inv.storeName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.buyerName && inv.buyerName.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === "all" || inv.status === statusFilter
    const matchesStore = storeFilter === "all" || inv.storeId === storeFilter
    return matchesSearch && matchesStatus && matchesStore
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header matching OrdersHeader layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Invoice Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage multi-order consolidated invoices, period sales, and official 7% VAT tax invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-primary text-primary"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus data-icon="inline-start" className="size-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Standard Stat Cards Layout */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="TOTAL INVOICED"
          value={formatCurrency(totalInvoiced, locale, "THB")}
          icon={HandCoins}
          iconWrapperClassName="bg-success/10 text-success"
        />
        <StatCard
          title="VAT 7% TOTAL"
          value={formatCurrency(totalVat, locale, "THB")}
          icon={Receipt}
          iconWrapperClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="TOTAL ORDERS"
          value={`${formatNumber(totalOrders, locale)} Orders`}
          icon={ClipboardList}
          iconWrapperClassName="bg-info/10 text-info"
        />
        <StatCard
          title="ACTIVE INVOICES"
          value={`${activeInvoicesCount} Invoices`}
          icon={Scale}
          iconWrapperClassName="bg-warning/10 text-warning"
        />
      </div>

      {/* Standard Filter Bar */}
      <section className="border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Store</Label>
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stores</SelectItem>
                <SelectItem value="1">Tiktok Shop (1) By Dev Alvin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground" htmlFor="invoices-search">
              Invoice ID / Title
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="invoices-search"
                type="search"
                placeholder="Search by invoice number, title, buyer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Invoice Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ISSUED">Issued</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="VOID">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Filter"
          >
            <ListFilter />
          </Button>
        </div>
      </section>

      {/* Standard Table Container with Table Header Toolbar */}
      <div className="border border-border bg-card shadow-sm">
        {/* Table Selection / Action Bar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted-foreground">
          <span>{filteredInvoices.length} Invoices Found</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">{filteredInvoices.reduce((sum, i) => sum + i.orderCount, 0)} Total Aggregated Orders</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20 font-medium text-muted-foreground">
                <th className="px-4 py-3">INVOICE NO.</th>
                <th className="px-4 py-3">TITLE / BATCH</th>
                <th className="px-4 py-3">STORE</th>
                <th className="px-4 py-3">PERIOD</th>
                <th className="px-4 py-3 text-center">ORDERS</th>
                <th className="px-4 py-3 text-right">SUBTOTAL (EX-VAT)</th>
                <th className="px-4 py-3 text-right">VAT (7%)</th>
                <th className="px-4 py-3 text-right">GRAND TOTAL</th>
                <th className="px-4 py-3 text-center">STATUS</th>
                <th className="px-4 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                    No invoices found. Click "Create Invoice" to generate one.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => navigate(ROUTES.dashboard.invoiceDetail(inv.id))}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        to={ROUTES.dashboard.invoiceDetail(inv.id)}
                        className="font-mono font-medium text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{inv.title}</p>
                      {inv.orderRunTitle && (
                        <p className="text-[11px] text-muted-foreground">Batch: {inv.orderRunTitle}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate max-w-[160px]">{inv.storeName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {inv.startDate} → {inv.endDate}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono font-medium">
                      {formatNumber(inv.orderCount, locale)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono">
                      {formatCurrency(inv.subtotal, locale, inv.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-primary">
                      {formatCurrency(inv.vatAmount, locale, inv.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-foreground">
                      {formatCurrency(inv.grandTotal, locale, inv.currency)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge
                        status={getInvoiceStatusBadgeVariant(inv.status)}
                        label={inv.status}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          title="Print / PDF Tax Invoice"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewInvoice(inv)
                          }}
                        >
                          <Printer className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog Modal */}
      <CreateInvoiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Tax Invoice Printable Preview Modal */}
      {previewInvoice && (
        <InvoiceTaxPreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  )
}
export default InvoicesPage
