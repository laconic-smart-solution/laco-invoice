import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  ClipboardList,
  HandCoins,
  Plus,
  Printer,
  Receipt,
  Scale,
  Search,
  Store,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useStoresPageQuery } from "@/shared/queries/store.query"
import { useInvoicesQuery } from "../queries/invoice.query"
import { CreateInvoiceDialog } from "../components/create-invoice-dialog"
import { InvoiceTaxPreview } from "../components/invoice-tax-preview"
import type { Invoice } from "../types/invoice"

const EMPTY_INVOICES: Invoice[] = []

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
  const storesQuery = useStoresPageQuery({ pageNumber: 1, pageSize: 200 })

  const invoices = invoicesQuery.data ?? EMPTY_INVOICES
  const stores = storesQuery.data?.data ?? []

  const totalInvoicesCount = invoices.length
  const totalOrdersCount = invoices.reduce((sum, inv) => sum + inv.orderCount, 0)
  const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0)
  const totalVat = invoices.reduce((sum, inv) => sum + inv.vatAmount, 0)
  const grandTotal = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const keyword = search.trim().toLowerCase()
      const matchSearch =
        !keyword ||
        inv.invoiceNumber.toLowerCase().includes(keyword) ||
        inv.title.toLowerCase().includes(keyword) ||
        (inv.storeName?.toLowerCase().includes(keyword) ?? false)

      const matchStatus = statusFilter === "all" || inv.status === statusFilter
      const matchStore = storeFilter === "all" || String(inv.storeId) === storeFilter

      return matchSearch && matchStatus && matchStore
    })
  }, [invoices, search, statusFilter, storeFilter])

  return (
    <div className="space-y-6 p-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage consolidated invoices by store, period, and order batch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-none text-xs h-9 font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="size-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="TOTAL INVOICES"
          value={`${totalInvoicesCount} (${formatNumber(totalOrdersCount, locale)} Orders)`}
          icon={ClipboardList}
          iconWrapperClassName="bg-info/10 text-info"
        />
        <StatCard
          title="SUBTOTAL (EX-VAT)"
          value={formatCurrency(totalSubtotal, locale, "THB")}
          icon={HandCoins}
          iconWrapperClassName="bg-muted text-foreground"
        />
        <StatCard
          title="VAT (7%)"
          value={formatCurrency(totalVat, locale, "THB")}
          icon={Receipt}
          iconWrapperClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="GRAND TOTAL"
          value={formatCurrency(grandTotal, locale, "THB")}
          icon={Scale}
          iconWrapperClassName="bg-success/10 text-success"
        />
      </div>

      {/* Invoices Table */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="border border-border bg-card p-4 shadow-sm rounded-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search invoice number, title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-8 text-xs rounded-none"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-36 text-xs rounded-none">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ISSUED">Issued</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="VOID">Void</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="h-9 w-52 text-xs rounded-none">
                    <SelectValue placeholder="Store" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={String(store.id)}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground">
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="border border-border bg-card shadow-sm rounded-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted font-medium text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3">INVOICE NO.</th>
                    <th className="px-4 py-3">TITLE & BATCH</th>
                    <th className="px-4 py-3">STORE / CHANNEL</th>
                    <th className="px-4 py-3">PERIOD</th>
                    <th className="px-4 py-3 text-center">ORDERS</th>
                    <th className="px-4 py-3 text-right">SUBTOTAL (EX-VAT)</th>
                    <th className="px-4 py-3 text-right">VAT (7%)</th>
                    <th className="px-4 py-3 text-right">GRAND TOTAL</th>
                    <th className="px-4 py-3 text-center">STATUS</th>
                    <th className="px-4 py-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono">
                  {invoicesQuery.isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-muted-foreground font-sans">
                        Loading invoices...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-muted-foreground font-sans">
                        No invoices match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(ROUTES.dashboard.invoiceDetail(inv.id))}
                        className="transition-colors hover:bg-muted/30 cursor-pointer"
                      >
                        <td className="px-4 py-3 font-bold text-foreground hover:text-primary transition-colors">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{inv.title}</span>
                            {inv.orderRunTitle && (
                              <span className="text-[10px] text-muted-foreground">
                                Batch: {inv.orderRunTitle}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Store className="size-3.5 shrink-0" />
                            <span className="truncate max-w-[140px]">{inv.storeName ?? "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[11px]">
                          {inv.startDate} → {inv.endDate}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {inv.orderCount}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(inv.subtotal, locale, inv.currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-primary">
                          {formatCurrency(inv.vatAmount, locale, inv.currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          {formatCurrency(inv.grandTotal, locale, inv.currency)}
                        </td>
                        <td className="px-4 py-3 text-center font-sans">
                          <StatusBadge
                            status={getInvoiceStatusBadgeVariant(inv.status)}
                            label={inv.status}
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewInvoice(inv)}
                              className="h-7 px-2 text-xs rounded-none gap-1"
                            >
                              <Printer className="size-3" />
                              <span>Print</span>
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
        </div>

      {/* Create Consolidated Invoice Dialog */}
      <CreateInvoiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Printable Preview Dialog */}
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
