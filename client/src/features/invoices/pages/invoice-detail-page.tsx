import { useState, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Printer,
  FileText,
  Calendar,
  Layers,
  Receipt,
  Search,
  Check,
  CheckCircle2,
  X,
  Pencil,
  RotateCcw,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Store,
  HandCoins,
  ClipboardList,
  Scale,
  SlidersHorizontal,
  DollarSign,
  User,
  FilterX,
  CreditCard,
  Plus,
  Eye,
  } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge, type StatusBadgeVariant } from "@/components/common/status-badge"
import { formatCurrency, formatNumber } from "@/util/format"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { ROUTES } from "@/app/constants/routes"
import {
  useInvoiceDetailQuery,
  useUpdateInvoiceStatusMutation,
  useUpdateInvoiceNumberMutation,
} from "../queries/invoice.query"
import { useInvoiceVouchersQuery } from "../queries/voucher.query"
import { invoiceLocalService } from "../services/invoice-local.service"
import { voucherLocalService } from "../services/voucher-local.service"
import { InvoiceTaxPreview } from "../components/invoice-tax-preview"
import { RecordVoucherDialog } from "../components/record-voucher-dialog"
import { VoucherDetailDialog } from "../components/voucher-detail-dialog"
import type { PaymentVoucher } from "../types/voucher"

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

  const [activeTab, setActiveTab] = useState<"orders" | "items" | "vouchers">("orders")
  const [showTaxPreview, setShowTaxPreview] = useState(false)
  const [showRecordVoucher, setShowRecordVoucher] = useState(false)
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false)
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false)
  const [selectedVoucherForView, setSelectedVoucherForView] = useState<PaymentVoucher | null>(null)
  const [showVoucherDetail, setShowVoucherDetail] = useState(false)

  // Inline edit state for invoice number
  const [isEditingNumber, setIsEditingNumber] = useState(false)
  const [editNumberValue, setEditNumberValue] = useState("")
  const [editNumberError, setEditNumberError] = useState("")

  // Filter States
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [search, setSearch] = useState("")
  const [buyerQuery, setBuyerQuery] = useState("")
  const [buyerTaxStatus, setBuyerTaxStatus] = useState<"all" | "has_tax_id" | "no_tax_id">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  const invoiceQuery = useInvoiceDetailQuery(id)
  const vouchersQuery = useInvoiceVouchersQuery(id)
  const updateStatusMutation = useUpdateInvoiceStatusMutation()
  const updateNumberMutation = useUpdateInvoiceNumberMutation()

  const invoice = invoiceQuery.data
  const invoiceVouchers = vouchersQuery.data || []

  // Dynamic Payment & Voucher Calculations
  const paymentSummary = useMemo(() => {
    if (!invoice) return { totalPaidAmount: 0, remainingBalance: 0, paidPercentage: 0, status: "UNPAID" }
    return voucherLocalService.getInvoicePaymentSummary(invoice.id, invoice.grandTotal)
  }, [invoice, invoiceVouchers])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search.trim()) count++
    if (buyerQuery.trim()) count++
    if (buyerTaxStatus !== "all") count++
    if (startDate) count++
    if (endDate) count++
    if (minAmount !== "") count++
    if (maxAmount !== "") count++
    return count
  }, [search, buyerQuery, buyerTaxStatus, startDate, endDate, minAmount, maxAmount])

  const handleResetFilters = () => {
    setSearch("")
    setBuyerQuery("")
    setBuyerTaxStatus("all")
    setStartDate("")
    setEndDate("")
    setMinAmount("")
    setMaxAmount("")
  }

  // Filtered Orders Calculation with Payment summaries
  const filteredOrdersWithPayment = useMemo(() => {
    if (!invoice?.orders) return []
    return invoice.orders
      .map((o) => {
        const pSummary = voucherLocalService.getOrderPaymentSummary(o.orderId, o.totalAmount)
        return {
          ...o,
          payment: pSummary,
        }
      })
      .filter((o) => {
        // Search Order ID
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const match =
            o.externalOrderId.toLowerCase().includes(q) ||
            o.orderId.toLowerCase().includes(q)
          if (!match) return false
        }

        // Buyer Query
        if (buyerQuery.trim()) {
          const q = buyerQuery.trim().toLowerCase()
          const match =
            (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
            (o.buyerTaxId && o.buyerTaxId.toLowerCase().includes(q))
          if (!match) return false
        }

        // Buyer Tax ID registered status
        if (buyerTaxStatus === "has_tax_id" && !o.buyerTaxId) return false
        if (buyerTaxStatus === "no_tax_id" && o.buyerTaxId) return false

        // Date Range
        if (startDate && o.orderDate < startDate) return false
        if (endDate && o.orderDate > endDate) return false

        // Amount Range
        const min = parseFloat(minAmount)
        if (!isNaN(min) && o.totalAmount < min) return false

        const max = parseFloat(maxAmount)
        if (!isNaN(max) && o.totalAmount > max) return false

        return true
      })
  }, [
    invoice?.orders,
    invoiceVouchers,
    search,
    buyerQuery,
    buyerTaxStatus,
    startDate,
    endDate,
    minAmount,
    maxAmount,
  ])

  // Filtered Items Calculation
  const filteredItems = useMemo(() => {
    if (!invoice?.items) return []
    return invoice.items.filter((item) => {
      // General search
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const match =
          item.externalOrderId.toLowerCase().includes(q) ||
          item.sellerSku.toLowerCase().includes(q) ||
          item.platformSkuId.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q)
        if (!match) return false
      }

      // Date Range
      if (startDate && item.orderDate < startDate) return false
      if (endDate && item.orderDate > endDate) return false

      // Amount Range
      const min = parseFloat(minAmount)
      if (!isNaN(min) && item.totalAmount < min) return false

      const max = parseFloat(maxAmount)
      if (!isNaN(max) && item.totalAmount > max) return false

      return true
    })
  }, [invoice?.items, search, startDate, endDate, minAmount, maxAmount])

  // Filtered Total Stats
  const filteredSummary = useMemo(() => {
    const totalAmount = filteredOrdersWithPayment.reduce((sum, o) => sum + o.totalAmount, 0)
    const vatAmount = filteredOrdersWithPayment.reduce((sum, o) => sum + o.vatAmount, 0)
    const exVat = filteredOrdersWithPayment.reduce((sum, o) => sum + o.amountExVat, 0)
    const totalPaid = filteredOrdersWithPayment.reduce((sum, o) => sum + o.payment.totalPaidAmount, 0)
    return { totalAmount, vatAmount, exVat, totalPaid }
  }, [filteredOrdersWithPayment])

  if (invoiceQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-muted-foreground">
        Loading invoice details...
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

  const handleConfirmMarkPaid = () => {
    updateStatusMutation.mutate(
      { id: invoice.id, status: "PAID" },
      {
        onSuccess: () => {
          setShowMarkPaidConfirm(false)
        },
      }
    )
  }

  const handleConfirmRollback = () => {
    updateStatusMutation.mutate(
      { id: invoice.id, status: "ISSUED" },
      {
        onSuccess: () => {
          setShowRollbackConfirm(false)
        },
      }
    )
  }

  const handleSaveInvoiceNumber = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = editNumberValue.trim()
    if (!trimmed) {
      setEditNumberError("Invoice number is required.")
      return
    }
    if (invoiceLocalService.isInvoiceNumberTaken(trimmed, invoice.id)) {
      setEditNumberError(`Invoice number "${trimmed}" is already in use.`)
      return
    }
    updateNumberMutation.mutate(
      { id: invoice.id, invoiceNumber: trimmed },
      {
        onSuccess: () => {
          setIsEditingNumber(false)
          setEditNumberError("")
        },
        onError: (err: any) => {
          setEditNumberError(err.message || "Failed to update invoice number.")
        },
      }
    )
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
              {/* Payment Settlement Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-none border ${
                  paymentSummary.status === "PAID"
                    ? "bg-success/10 text-success border-success/30"
                    : paymentSummary.status === "PARTIAL"
                    ? "bg-warning/10 text-warning border-warning/30"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <CreditCard className="size-3" />
                {paymentSummary.status === "PAID"
                  ? "Fully Settled (100%)"
                  : paymentSummary.status === "PARTIAL"
                  ? `Partially Paid (${paymentSummary.paidPercentage}%)`
                  : "Unpaid (0%)"}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {/* Editable Invoice Number with Duplicate Validation */}
              {isEditingNumber ? (
                <form onSubmit={handleSaveInvoiceNumber} className="flex items-center gap-1.5">
                  <Input
                    value={editNumberValue}
                    onChange={(e) => {
                      setEditNumberValue(e.target.value)
                      setEditNumberError("")
                    }}
                    placeholder="e.g. INV-202608-001"
                    className={`h-7 w-48 font-mono font-bold text-xs rounded-none ${
                      editNumberError
                        ? "border-destructive text-destructive focus-visible:ring-destructive"
                        : "text-primary"
                    }`}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateNumberMutation.isPending}
                    className="h-7 px-2 text-xs rounded-none bg-primary text-primary-foreground"
                    title="Save"
                  >
                    {updateNumberMutation.isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Check className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs rounded-none"
                    onClick={() => {
                      setIsEditingNumber(false)
                      setEditNumberError("")
                    }}
                    title="Cancel"
                  >
                    <X className="size-3.5" />
                  </Button>
                  {editNumberError && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                      <AlertCircle className="size-3 shrink-0" />
                      {editNumberError}
                    </span>
                  )}
                </form>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-foreground">
                    {invoice.invoiceNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNumber(true)
                      setEditNumberValue(invoice.invoiceNumber)
                      setEditNumberError("")
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Edit Invoice Number"
                  >
                    <Pencil className="size-3" />
                    <span className="underline decoration-dotted">Edit</span>
                  </button>
                </div>
              )}

              <span>•</span>
              <span className="flex items-center gap-1">
                <Store className="size-3.5" /> {invoice.storeName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" /> {invoice.startDate} → {invoice.endDate}
              </span>
              {invoice.orderRunTitle && (
                <>
                  <span>•</span>
                  <span className="rounded-none bg-primary/10 px-1.5 py-0.5 text-primary font-medium">
                    Batch: {invoice.orderRunTitle}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Record Payment Voucher Action */}
            <Button
              type="button"
              onClick={() => setShowRecordVoucher(true)}
              className="rounded-none bg-primary text-primary-foreground font-semibold gap-1.5 text-xs shadow-xs"
            >
              <Receipt className="size-4" />
              Record Payment Voucher
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTaxPreview(true)}
              className="rounded-none text-xs"
            >
              <Printer className="size-4" />
              Tax Invoice PDF
            </Button>

            {invoice.status !== "PAID" ? (
              <Button
                type="button"
                className="border-primary text-primary rounded-none hover:bg-primary/10 text-xs"
                variant="outline"
                onClick={() => setShowMarkPaidConfirm(true)}
                disabled={updateStatusMutation.isPending}
              >
                <Check className="size-4" />
                Mark as Paid
              </Button>
            ) : (
              <Button
                type="button"
                className="border-warning/80 text-warning hover:bg-warning/10 rounded-none transition-colors text-xs"
                variant="outline"
                onClick={() => setShowRollbackConfirm(true)}
                disabled={updateStatusMutation.isPending}
                title="Rollback status from PAID to ISSUED"
              >
                <RotateCcw className="size-4" />
                Rollback to Issued
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards & Payment Summary Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          iconWrapperClassName="bg-card text-foreground"
        />
        {/* Paid & Remaining Tile */}
        <div className="border border-border bg-card p-4 rounded-none shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              VOUCHERS COLLECTED
            </span>
            <span className="font-mono text-xs font-bold text-primary">
              {paymentSummary.paidPercentage}%
            </span>
          </div>
          <p className="font-mono text-lg font-bold text-success">
            {formatCurrency(paymentSummary.totalPaidAmount, locale, invoice.currency)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
            <span>Outstanding:</span>
            <span className="font-mono font-semibold text-foreground">
              {formatCurrency(paymentSummary.remainingBalance, locale, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-border text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors rounded-none ${
              activeTab === "orders"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="size-4" />
            Orders Listing ({filteredOrdersWithPayment.length} / {invoice.orderCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors rounded-none ${
              activeTab === "items"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="size-4" />
            Order Line Items ({filteredItems.length} / {invoice.items?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vouchers")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors rounded-none ${
              activeTab === "vouchers"
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard className="size-4" />
            Payment Vouchers & Allocations ({invoiceVouchers.length})
          </button>
        </div>

        {/* Tab 1 & Tab 2: Filters Toolbar */}
        {activeTab !== "vouchers" && (
          <div className="border border-border bg-card shadow-sm rounded-none">
            {/* Main Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={
                      activeTab === "orders"
                        ? "Search Order ID..."
                        : "Search Order ID, SKU, product..."
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-8 text-xs rounded-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Buyer Query */}
                {activeTab === "orders" && (
                  <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                    <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search Buyer Name, Tax ID..."
                      value={buyerQuery}
                      onChange={(e) => setBuyerQuery(e.target.value)}
                      className="h-9 pl-8 text-xs rounded-none"
                    />
                    {buyerQuery && (
                      <button
                        type="button"
                        onClick={() => setBuyerQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Toggle Filter Button */}
                <Button
                  type="button"
                  variant={isFilterExpanded ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={`h-9 text-xs rounded-none font-medium gap-1.5 ${
                    isFilterExpanded ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-background text-foreground rounded-none">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>

                {/* Reset Filters */}
                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-9 text-xs rounded-none text-muted-foreground hover:text-destructive gap-1.5"
                  >
                    <FilterX className="size-3.5" />
                    <span>Reset All</span>
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground font-medium">
                Showing{" "}
                <strong className="font-mono text-foreground">
                  {activeTab === "orders"
                    ? filteredOrdersWithPayment.length
                    : filteredItems.length}
                </strong>{" "}
                of{" "}
                <span className="font-mono">
                  {activeTab === "orders" ? invoice.orderCount : invoice.items?.length || 0}
                </span>{" "}
                records
              </div>
            </div>

            {/* Expandable Advanced Drawer */}
            {isFilterExpanded && (
              <div className="p-4 border-b border-border bg-muted/5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    Order Date From
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8.5 text-xs font-mono rounded-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-primary" />
                    Order Date To
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8.5 text-xs font-mono rounded-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="size-3.5 text-primary" />
                    Total Amount Range (THB)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="h-8.5 text-xs font-mono rounded-none w-1/2"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="h-8.5 text-xs font-mono rounded-none w-1/2"
                    />
                  </div>
                </div>

                {activeTab === "orders" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-primary" />
                      Buyer Tax ID Status
                    </Label>
                    <select
                      value={buyerTaxStatus}
                      onChange={(e) => setBuyerTaxStatus(e.target.value as any)}
                      className="w-full h-8.5 border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring rounded-none"
                    >
                      <option value="all">All Buyers (With or Without Tax ID)</option>
                      <option value="has_tax_id">Registered Tax ID Only</option>
                      <option value="no_tax_id">No Tax ID (Standard Retail)</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      disabled={activeFilterCount === 0}
                      className="h-8.5 text-xs rounded-none w-full text-muted-foreground"
                    >
                      Clear Filter Inputs
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Filtered Dynamic Total Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-primary/5 text-xs border-b border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-semibold text-foreground">Filtered Results Total:</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(filteredSummary.totalAmount, locale, invoice.currency)}
                  </span>
                  <span>
                    (Ex-VAT:{" "}
                    <strong className="font-mono text-foreground">
                      {formatCurrency(filteredSummary.exVat, locale, invoice.currency)}
                    </strong>
                    , VAT 7%:{" "}
                    <strong className="font-mono text-primary">
                      {formatCurrency(filteredSummary.vatAmount, locale, invoice.currency)}
                    </strong>
                    )
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Tab 1: Orders Listing Table */}
            {activeTab === "orders" && (
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted/95 backdrop-blur font-medium text-muted-foreground border-b border-border z-10">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">ORDER ID</th>
                      <th className="px-4 py-3">DATE</th>
                      <th className="px-4 py-3">BUYER NAME</th>
                      <th className="px-4 py-3">BUYER TAX ID</th>
                      <th className="px-4 py-3 text-center">ITEMS</th>
                      <th className="px-4 py-3 text-right">TOTAL AMOUNT</th>
                      <th className="px-4 py-3 text-center">PAYMENT STATUS</th>
                      <th className="px-4 py-3 text-right">REMAINING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {filteredOrdersWithPayment.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-12 text-center text-xs text-muted-foreground font-sans"
                        >
                          No orders match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrdersWithPayment.map((ord, idx) => {
                        const p = ord.payment
                        return (
                          <tr key={ord.orderId} className="transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 text-muted-foreground font-sans">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-foreground">
                              {ord.externalOrderId}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-sans">
                              {ord.orderDate}
                            </td>
                            <td className="px-4 py-3 font-sans">{ord.buyerName || "-"}</td>
                            <td className="px-4 py-3 text-[11px] text-muted-foreground">
                              {ord.buyerTaxId ? (
                                <span className="font-semibold text-foreground">
                                  {ord.buyerTaxId}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">{ord.itemCount}</td>
                            <td className="px-4 py-3 text-right font-bold text-foreground">
                              {formatCurrency(ord.totalAmount, locale, invoice.currency)}
                            </td>
                            {/* Payment Status Badge */}
                            <td className="px-4 py-3 text-center font-sans">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-none border ${
                                  p.status === "PAID"
                                    ? "bg-success/10 text-success border-success/30"
                                    : p.status === "PARTIAL"
                                    ? "bg-warning/10 text-warning border-warning/30"
                                    : "bg-muted text-muted-foreground border-border"
                                }`}
                              >
                                {p.status === "PAID"
                                  ? "PAID"
                                  : p.status === "PARTIAL"
                                  ? `PARTIAL (${formatCurrency(p.totalPaidAmount, locale, "THB")})`
                                  : "UNPAID"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold">
                              {p.remainingBalance > 0 ? (
                                <span className="text-warning">
                                  {formatCurrency(p.remainingBalance, locale, invoice.currency)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-normal">THB 0.00</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Line Items Breakdown Table */}
            {activeTab === "items" && (
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted/95 backdrop-blur font-medium text-muted-foreground border-b border-border z-10">
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
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-xs text-muted-foreground">
                          No item lines match the selected filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item, idx) => (
                        <tr key={item.id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                            {item.externalOrderId}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {item.sellerSku}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {item.variation || "-"}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium">
                            {item.quantity}
                          </td>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payment Vouchers & Allocations Listing */}
        {activeTab === "vouchers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border border-border bg-card p-4 rounded-none shadow-sm">
              <div>
                <h3 className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="size-4 text-primary" />
                  Payment Vouchers Linked to this Invoice ({invoiceVouchers.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  รายการใบสำคัญรับเงินทั้งหมดที่มีการตัดยอดชำระให้กับคำสั่งซื้อในรอบใบแจ้งหนี้นี้
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setShowRecordVoucher(true)}
                className="h-8 text-xs rounded-none bg-primary text-primary-foreground font-semibold gap-1.5"
              >
                <Plus className="size-3.5" />
                Record New Voucher
              </Button>
            </div>

            <div className="border border-border bg-card shadow-sm rounded-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted font-medium text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">VOUCHER NO.</th>
                      <th className="px-4 py-3">DATE</th>
                      <th className="px-4 py-3">PAYER NAME</th>
                      <th className="px-4 py-3">METHOD / SLIP</th>
                      <th className="px-4 py-3 text-center">ALLOCATED ORDERS</th>
                      <th className="px-4 py-3 text-right">VOUCHER TOTAL</th>
                      <th className="px-4 py-3 text-right text-primary">ALLOCATED THIS INVOICE</th>
                      <th className="px-4 py-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {invoiceVouchers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-12 text-center text-muted-foreground font-sans text-xs"
                        >
                          No payment vouchers recorded for this invoice yet. Click &quot;Record
                          Payment Voucher&quot; to add one.
                        </td>
                      </tr>
                    ) : (
                      invoiceVouchers.map((v, idx) => {
                        const thisInvAllocated = v.allocations
                          .filter(
                            (a) =>
                              a.invoiceId === invoice.id || a.invoiceNumber === invoice.invoiceNumber
                          )
                          .reduce((sum, a) => sum + a.allocatedAmount, 0)

                        return (
                          <tr key={v.id} className="transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 text-muted-foreground font-sans">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-foreground">
                              {v.voucherNumber}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{v.date}</td>
                            <td className="px-4 py-3 font-sans">{v.customerName}</td>
                            <td className="px-4 py-3 font-sans text-[11px]">
                              {v.paymentMethod}{" "}
                              {v.bankReference && (
                                <span className="font-mono text-muted-foreground">
                                  ({v.bankReference})
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-sans">
                              <span className="px-2 py-0.5 text-[11px] bg-muted rounded-none border border-border">
                                {v.allocations.length} orders
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatCurrency(v.totalAmount, locale, "THB")}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              {formatCurrency(thisInvAllocated, locale, "THB")}
                            </td>
                            <td className="px-4 py-3 text-center font-sans">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedVoucherForView(v)
                                  setShowVoucherDetail(true)
                                }}
                                className="h-7 px-2.5 text-xs rounded-none hover:bg-primary/10 hover:text-primary gap-1"
                              >
                                <Eye className="size-3.5" />
                                <span>View</span>
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Voucher Dialog */}
      <RecordVoucherDialog
        open={showRecordVoucher}
        onOpenChange={setShowRecordVoucher}
        invoice={invoice}
        onSuccess={() => {
          vouchersQuery.refetch()
          invoiceQuery.refetch()
        }}
      />

      {/* Voucher Detail View Dialog */}
      <VoucherDetailDialog
        voucher={selectedVoucherForView}
        open={showVoucherDetail}
        onOpenChange={setShowVoucherDetail}
      />

      {/* Mark as Paid Confirmation Modal */}
      <Dialog open={showMarkPaidConfirm} onOpenChange={setShowMarkPaidConfirm}>
        <DialogContent className="max-w-md w-full rounded-none border-border bg-card shadow-2xl p-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex size-9 items-center justify-center rounded-none bg-primary/10 text-primary border border-primary/20">
              <CheckCircle2 className="size-5" />
            </div>
            <DialogTitle className="font-heading text-base font-bold text-foreground">
              Confirm Payment Settlement
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to mark invoice{" "}
              <strong className="font-mono text-foreground">{invoice.invoiceNumber}</strong> as{" "}
              <strong className="text-success font-semibold">PAID</strong>? This will record the
              payment settlement date and update the status.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMarkPaidConfirm(false)}
              disabled={updateStatusMutation.isPending}
              className="rounded-none text-xs h-9 px-4 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMarkPaid}
              disabled={updateStatusMutation.isPending}
              className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-9 px-4 font-semibold"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="mr-1.5 size-3.5" />
                  Confirm Mark as Paid
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Status Confirmation Modal */}
      <Dialog open={showRollbackConfirm} onOpenChange={setShowRollbackConfirm}>
        <DialogContent className="max-w-md w-full rounded-none border-border bg-card shadow-2xl p-6">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex size-9 items-center justify-center rounded-none bg-warning/10 text-warning border border-warning/20">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle className="font-heading text-base font-bold text-foreground">
              Confirm Status Rollback
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to revert invoice{" "}
              <strong className="font-mono text-foreground">{invoice.invoiceNumber}</strong> status
              from <strong className="text-success font-semibold">PAID</strong> back to{" "}
              <strong className="text-primary font-semibold">ISSUED</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRollbackConfirm(false)}
              disabled={updateStatusMutation.isPending}
              className="rounded-none text-xs h-9 px-4 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRollback}
              disabled={updateStatusMutation.isPending}
              className="rounded-none bg-warning text-warning-foreground hover:bg-warning/90 text-xs h-9 px-4 font-semibold"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Rolling back...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Confirm Rollback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tax Invoice Printable Preview Modal */}
      {showTaxPreview && (
        <InvoiceTaxPreview invoice={invoice} onClose={() => setShowTaxPreview(false)} />
      )}
    </div>
  )
}
export default InvoiceDetailPage
