import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Layers,
  Loader2,
  Receipt,
  Search,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/util/format"
import type { Locale } from "@/app/i18n"
import type { Invoice, InvoiceOrderSummary } from "../types/invoice"
import type { PaymentMethod } from "../types/voucher"
import { voucherLocalService } from "../services/voucher-local.service"
import { invoiceLocalService } from "../services/invoice-local.service"
import { useCreateVoucherMutation } from "../queries/voucher.query"

interface RecordVoucherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice?: Invoice | null
  preselectedOrders?: InvoiceOrderSummary[]
  onSuccess?: () => void
}

interface OrderAllocationRow {
  orderId: string
  externalOrderId: string
  buyerName?: string
  buyerTaxId?: string
  orderTotalAmount: number
  previousPaidAmount: number
  remainingBalance: number
  allocatedAmount: number
  isIncluded: boolean
  notes?: string
}

export function RecordVoucherDialog({
  open,
  onOpenChange,
  invoice,
  preselectedOrders,
  onSuccess,
}: RecordVoucherDialogProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language as Locale

  const [voucherNumber, setVoucherNumber] = useState("")
  const [voucherNumberError, setVoucherNumberError] = useState("")
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0])
  const [storeId] = useState(invoice?.storeId || "1")
  const [storeName] = useState(invoice?.storeName || "Tiktok Shop (1) By Dev Alvin")
  const [customerName, setCustomerName] = useState(
    invoice?.buyerName || "Yoik Global Trading Co., Ltd."
  )
  const [customerTaxId, setCustomerTaxId] = useState(invoice?.buyerTaxId || "0105559876543")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER")
  const [bankReference, setBankReference] = useState("")
  const [totalReceivedAmount, setTotalReceivedAmount] = useState<string>("")
  const [notes, setNotes] = useState("")

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMode, setFilterMode] = useState<"all" | "selected" | "unselected" | "unpaid">("all")

  const [orderRows, setOrderRows] = useState<OrderAllocationRow[]>([])
  const createVoucherMutation = useCreateVoucherMutation()

  // Initialize form when opening
  useEffect(() => {
    if (open) {
      const nextNo = voucherLocalService.getNextVoucherNumber()
      setVoucherNumber(nextNo)
      setVoucherNumberError("")
      setBankReference(`TRF-${Math.floor(100000 + Math.random() * 900000)}`)
      setSearchQuery("")
      setFilterMode("all")

      // Collect available orders from invoice or fallback to all existing invoices
      let targetOrders = preselectedOrders || invoice?.orders || []
      if (targetOrders.length === 0) {
        const allInvoices = invoiceLocalService.getAll()
        targetOrders = allInvoices.flatMap((inv) => inv.orders || [])
      }

      const rows: OrderAllocationRow[] = targetOrders.map((ord) => {
        const summary = voucherLocalService.getOrderPaymentSummary(ord.orderId, ord.totalAmount)
        return {
          orderId: ord.orderId,
          externalOrderId: ord.externalOrderId,
          buyerName: ord.buyerName,
          buyerTaxId: ord.buyerTaxId,
          orderTotalAmount: ord.totalAmount,
          previousPaidAmount: summary.totalPaidAmount,
          remainingBalance: summary.remainingBalance,
          allocatedAmount: 0,
          isIncluded: true,
        }
      })
      setOrderRows(rows)

      // Set default received amount to sum of remaining balances
      const totalRemaining = rows.reduce((sum, r) => sum + r.remainingBalance, 0)
      if (totalRemaining > 0) {
        setTotalReceivedAmount(totalRemaining.toFixed(2))
      }
    }
  }, [open, invoice, preselectedOrders])

  // Calculation Math
  const numReceived = parseFloat(totalReceivedAmount) || 0

  const totalAllocated = useMemo(() => {
    return orderRows.reduce((sum, r) => (r.isIncluded ? sum + (r.allocatedAmount || 0) : sum), 0)
  }, [orderRows])

  const selectedOrdersCount = useMemo(() => {
    return orderRows.filter((r) => r.isIncluded).length
  }, [orderRows])

  const selectedOrdersTotal = useMemo(() => {
    return orderRows.filter((r) => r.isIncluded).reduce((sum, r) => sum + r.remainingBalance, 0)
  }, [orderRows])

  const unallocatedCredit = useMemo(() => {
    return Math.max(0, Number((numReceived - totalAllocated).toFixed(2)))
  }, [numReceived, totalAllocated])

  const isOverAllocated = totalAllocated > numReceived + 0.001

  // Filtered rows for the view
  const visibleRows = useMemo(() => {
    return orderRows.filter((row) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchId = row.externalOrderId.toLowerCase().includes(q)
        const matchBuyer = (row.buyerName || "").toLowerCase().includes(q)
        const matchTax = (row.buyerTaxId || "").toLowerCase().includes(q)
        if (!matchId && !matchBuyer && !matchTax) return false
      }
      // Mode filter
      if (filterMode === "selected") return row.isIncluded
      if (filterMode === "unselected") return !row.isIncluded
      if (filterMode === "unpaid") return row.remainingBalance > 0.01
      return true
    })
  }, [orderRows, searchQuery, filterMode])

  // Select all / deselect all helpers
  const isAllVisibleSelected = visibleRows.length > 0 && visibleRows.every((r) => r.isIncluded)

  const handleToggleSelectAllVisible = (checked: boolean) => {
    const visibleIds = new Set(visibleRows.map((r) => r.orderId))
    setOrderRows((prev) =>
      prev.map((row) => {
        if (!visibleIds.has(row.orderId)) return row
        return {
          ...row,
          isIncluded: checked,
          allocatedAmount: checked ? row.allocatedAmount : 0,
        }
      })
    )
  }

  const handleSelectAll = () => {
    setOrderRows((prev) => prev.map((r) => ({ ...r, isIncluded: true })))
  }

  const handleDeselectAll = () => {
    setOrderRows((prev) => prev.map((r) => ({ ...r, isIncluded: false, allocatedAmount: 0 })))
  }

  const handleSelectUnpaidOnly = () => {
    setOrderRows((prev) =>
      prev.map((r) => ({
        ...r,
        isIncluded: r.remainingBalance > 0.01,
        allocatedAmount: r.remainingBalance > 0.01 ? r.allocatedAmount : 0,
      }))
    )
  }

  const handleToggleRowSelect = (orderId: string) => {
    setOrderRows((prev) =>
      prev.map((row) => {
        if (row.orderId !== orderId) return row
        const nextIncluded = !row.isIncluded
        return {
          ...row,
          isIncluded: nextIncluded,
          allocatedAmount: nextIncluded ? row.allocatedAmount : 0,
        }
      })
    )
  }

  // Handle Voucher No. validation
  const handleVoucherNumberChange = (value: string) => {
    setVoucherNumber(value)
    if (value.trim()) {
      if (voucherLocalService.isVoucherNumberTaken(value.trim())) {
        setVoucherNumberError(`Voucher number "${value.trim()}" already exists.`)
      } else {
        setVoucherNumberError("")
      }
    } else {
      setVoucherNumberError("Voucher number is required.")
    }
  }

  // FIFO Auto-allocation algorithm (across SELECTED rows only)
  const handleAutoAllocateFIFO = () => {
    let pool = numReceived
    const updated = orderRows.map((row) => {
      if (pool <= 0 || !row.isIncluded) {
        return { ...row, allocatedAmount: 0 }
      }
      const canPay = Math.min(pool, row.remainingBalance)
      const allocated = Number(canPay.toFixed(2))
      pool = Number((pool - allocated).toFixed(2))
      return {
        ...row,
        allocatedAmount: allocated,
      }
    })
    setOrderRows(updated)
  }

  // Set single row allocation (auto checks the row)
  const handleRowAllocationChange = (orderId: string, val: string) => {
    const amount = parseFloat(val) || 0
    setOrderRows((prev) =>
      prev.map((row) => {
        if (row.orderId !== orderId) return row
        const capped = Math.min(amount, row.remainingBalance)
        return {
          ...row,
          isIncluded: true,
          allocatedAmount: Math.max(0, capped),
        }
      })
    )
  }

  // Allocate full remaining for single row
  const handlePayFullRow = (orderId: string) => {
    setOrderRows((prev) =>
      prev.map((row) => {
        if (row.orderId !== orderId) return row
        return { ...row, isIncluded: true, allocatedAmount: row.remainingBalance }
      })
    )
  }

  // Clear single row allocation
  const handleClearRow = (orderId: string) => {
    setOrderRows((prev) =>
      prev.map((row) => {
        if (row.orderId !== orderId) return row
        return { ...row, allocatedAmount: 0 }
      })
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetNo = voucherNumber.trim()
    if (!targetNo) {
      setVoucherNumberError("Please enter a voucher number.")
      return
    }
    if (voucherLocalService.isVoucherNumberTaken(targetNo)) {
      setVoucherNumberError(`Voucher number "${targetNo}" is already taken.`)
      return
    }

    if (numReceived <= 0) {
      alert("Please enter a valid received amount greater than 0.")
      return
    }

    if (isOverAllocated) {
      alert("Total allocated amount cannot exceed received voucher amount.")
      return
    }

    const allocations = orderRows
      .filter((r) => r.isIncluded && r.allocatedAmount > 0)
      .map((r) => ({
        orderId: r.orderId,
        externalOrderId: r.externalOrderId,
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoiceNumber,
        orderTotalAmount: r.orderTotalAmount,
        allocatedAmount: r.allocatedAmount,
        previousPaidAmount: r.previousPaidAmount,
        buyerName: r.buyerName,
        notes: r.notes,
      }))

    createVoucherMutation.mutate(
      {
        voucherNumber: targetNo,
        date: paymentDate,
        storeId,
        storeName,
        customerName: customerName.trim() || "Retail Customer",
        customerTaxId: customerTaxId.trim() || undefined,
        totalAmount: numReceived,
        paymentMethod,
        bankReference: bankReference.trim() || undefined,
        notes: notes.trim() || undefined,
        allocations,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl w-full overflow-hidden p-0 gap-0 border-border bg-card shadow-2xl rounded-none">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="border-b border-border/80 bg-muted/20 px-6 py-4">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-none bg-primary/10 text-primary border border-primary/20">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-lg font-bold tracking-tight text-foreground">
                    Record Payment Voucher & Partial Allocation
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    บันทึกใบสำคัญรับเงิน / รับชำระเงินจากลูกค้าและจัดสรรยอดชำระแบบบางส่วน (Partial) หลายรายการคำสั่งซื้อ
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Form Scrollable Body */}
          <div className="overflow-y-auto px-6 py-5 space-y-6 text-xs">
            {/* Section 1: Voucher Header Details */}
            <div className="border border-border bg-muted/10 p-4 space-y-4 rounded-none">
              <div className="flex items-center gap-2 font-heading font-semibold text-foreground text-xs border-b border-border/60 pb-2">
                <FileCheck2 className="size-3.5 text-primary" />
                <span>1. Payment Voucher Details (ข้อมูลใบสำคัญรับเงิน)</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Voucher Number */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Voucher No. <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={voucherNumber}
                    onChange={(e) => handleVoucherNumberChange(e.target.value)}
                    placeholder="e.g. VCH-202608-001"
                    className={`h-8.5 font-mono font-bold text-xs rounded-none ${
                      voucherNumberError ? "border-destructive text-destructive" : "text-primary"
                    }`}
                    required
                  />
                  {voucherNumberError && (
                    <p className="text-[10px] text-destructive font-medium">{voucherNumberError}</p>
                  )}
                </div>

                {/* Payment Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Payment Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="h-8.5 font-mono text-xs rounded-none"
                    required
                  />
                </div>

                {/* Total Received Amount */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Total Received Amount (THB) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={totalReceivedAmount}
                    onChange={(e) => setTotalReceivedAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-8.5 font-mono font-bold text-xs rounded-none text-foreground"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full h-8.5 border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring rounded-none font-medium"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (โอนเงินผ่านธนาคาร)</option>
                    <option value="PROMPTPAY">PromptPay (พร้อมเพย์)</option>
                    <option value="CREDIT_CARD">Credit Card / Gateway (บัตรเครดิต)</option>
                    <option value="PLATFORM_PAYOUT">Platform Settlement (ยอดโอนจากแพลตฟอร์ม)</option>
                    <option value="CASH">Cash (เงินสด)</option>
                    <option value="CHEQUE">Cheque (เช็คเงินสด)</option>
                  </select>
                </div>

                {/* Customer Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Payer / Customer Name
                  </Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Yoik Global Trading Co., Ltd."
                    className="h-8.5 text-xs rounded-none"
                  />
                </div>

                {/* Customer Tax ID */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Customer Tax ID</Label>
                  <Input
                    value={customerTaxId}
                    onChange={(e) => setCustomerTaxId(e.target.value)}
                    placeholder="0105559876543"
                    className="h-8.5 font-mono text-xs rounded-none"
                  />
                </div>

                {/* Bank Reference */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    Bank Reference / Slip No.
                  </Label>
                  <Input
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="e.g. KBANK-TRF-982314"
                    className="h-8.5 font-mono text-xs rounded-none"
                  />
                </div>

                {/* Remarks / Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Notes / Remarks</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional remarks"
                    className="h-8.5 text-xs rounded-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Order Allocation Matrix */}
            <div className="border border-border bg-card shadow-sm space-y-3 p-4 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  <span className="font-heading font-semibold text-foreground text-xs">
                    2. Order Lines Allocation Matrix ({orderRows.length} Orders)
                  </span>
                  <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    Selected: {selectedOrdersCount} / {orderRows.length} ({formatCurrency(selectedOrdersTotal, locale, "THB")})
                  </span>
                </div>

                {/* Auto Allocation Button */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoAllocateFIFO}
                    disabled={numReceived <= 0 || selectedOrdersCount === 0}
                    className="h-7.5 text-xs rounded-none border-primary text-primary hover:bg-primary/10 gap-1.5 font-semibold"
                  >
                    <Sparkles className="size-3.5" />
                    Auto-Allocate FIFO ({selectedOrdersCount} Selected)
                  </Button>
                </div>
              </div>

              {/* Search & Quick Selection Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-border/60">
                <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Order ID, Buyer, Tax ID..."
                      className="h-7.5 pl-8 pr-7 text-xs rounded-none bg-background"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-7 px-2 text-[11px] font-medium text-foreground hover:bg-muted rounded-none"
                  >
                    Select All ({orderRows.length})
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none"
                  >
                    Deselect All
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectUnpaidOnly}
                    className="h-7 px-2 text-[11px] font-medium text-primary hover:bg-primary/10 rounded-none"
                  >
                    Select Unpaid Only
                  </Button>

                  {/* Filter chips */}
                  <div className="inline-flex border border-border p-0.5 bg-muted/40 rounded-none text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFilterMode("all")}
                      className={`px-2 py-0.5 font-medium transition-colors ${
                        filterMode === "all"
                          ? "bg-background text-foreground shadow-sm font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All ({orderRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("selected")}
                      className={`px-2 py-0.5 font-medium transition-colors ${
                        filterMode === "selected"
                          ? "bg-background text-primary shadow-sm font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Selected ({selectedOrdersCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("unselected")}
                      className={`px-2 py-0.5 font-medium transition-colors ${
                        filterMode === "unselected"
                          ? "bg-background text-muted-foreground shadow-sm font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Unselected ({orderRows.length - selectedOrdersCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Allocation Table with Checkboxes */}
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-muted/95 backdrop-blur font-medium text-muted-foreground border-b border-border z-10">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">
                        <Checkbox
                          checked={isAllVisibleSelected}
                          onCheckedChange={(checked) => handleToggleSelectAllVisible(!!checked)}
                          aria-label="Select all visible orders"
                          className="rounded-none"
                        />
                      </th>
                      <th className="px-2 py-2">#</th>
                      <th className="px-3 py-2">ORDER ID</th>
                      <th className="px-3 py-2">BUYER</th>
                      <th className="px-3 py-2 text-right">TOTAL AMOUNT</th>
                      <th className="px-3 py-2 text-right">PREV. PAID</th>
                      <th className="px-3 py-2 text-right">REMAINING</th>
                      <th className="px-3 py-2 text-right w-36">ALLOCATE THIS VOUCHER</th>
                      <th className="px-3 py-2 text-center">QUICK ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-muted-foreground font-sans">
                          No orders match the current filter or search criteria.
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row, idx) => (
                        <tr
                          key={row.orderId}
                          onClick={() => handleToggleRowSelect(row.orderId)}
                          className={`transition-colors cursor-pointer select-none ${
                            row.isIncluded
                              ? "bg-primary/[0.03] hover:bg-primary/[0.07]"
                              : "opacity-60 bg-muted/10 hover:bg-muted/30"
                          }`}
                        >
                          <td
                            className="px-3 py-2 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={row.isIncluded}
                              onCheckedChange={() => handleToggleRowSelect(row.orderId)}
                              aria-label={`Select order ${row.externalOrderId}`}
                              className="rounded-none"
                            />
                          </td>
                          <td className="px-2 py-2 text-muted-foreground font-sans">{idx + 1}</td>
                          <td className="px-3 py-2 font-semibold text-foreground">
                            {row.externalOrderId}
                          </td>
                          <td className="px-3 py-2 font-sans">{row.buyerName || "-"}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrency(row.orderTotalAmount, locale, "THB")}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {formatCurrency(row.previousPaidAmount, locale, "THB")}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-foreground">
                            {formatCurrency(row.remainingBalance, locale, "THB")}
                          </td>
                          <td
                            className="px-3 py-2 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Input
                              type="number"
                              step="0.01"
                              value={row.allocatedAmount === 0 ? "" : row.allocatedAmount}
                              onChange={(e) =>
                                handleRowAllocationChange(row.orderId, e.target.value)
                              }
                              placeholder="0.00"
                              disabled={!row.isIncluded}
                              className="h-7 text-right text-xs font-mono font-bold text-primary rounded-none disabled:opacity-40"
                            />
                          </td>
                          <td
                            className="px-3 py-2 text-center font-sans"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePayFullRow(row.orderId)}
                                disabled={row.remainingBalance <= 0}
                                className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40 rounded-none border border-border"
                              >
                                Max
                              </button>
                              <button
                                type="button"
                                onClick={() => handleClearRow(row.orderId)}
                                className="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-destructive transition-colors rounded-none"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section 3: Live Voucher Allocation Summary Bar */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2 font-mono">
                <div className="border border-border p-2.5 bg-background text-xs rounded-none">
                  <span className="text-[10px] uppercase text-muted-foreground block font-sans">
                    Total Received Voucher Amount
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(numReceived, locale, "THB")}
                  </span>
                </div>

                <div className="border border-border p-2.5 bg-background text-xs rounded-none">
                  <span className="text-[10px] uppercase text-muted-foreground block font-sans">
                    Total Allocated to Selected Orders
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      isOverAllocated ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {formatCurrency(totalAllocated, locale, "THB")}
                  </span>
                </div>

                <div
                  className={`border p-2.5 text-xs rounded-none ${
                    isOverAllocated
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border bg-background"
                  }`}
                >
                  <span className="text-[10px] uppercase text-muted-foreground block font-sans">
                    {isOverAllocated ? "Over-Allocated Excess (Error)" : "Unallocated Credit Balance"}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      isOverAllocated ? "text-destructive" : "text-success"
                    }`}
                  >
                    {isOverAllocated
                      ? `-${formatCurrency(totalAllocated - numReceived, locale, "THB")}`
                      : formatCurrency(unallocatedCredit, locale, "THB")}
                  </span>
                </div>
              </div>

              {isOverAllocated && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 text-destructive text-[11px] rounded-none">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    Total allocated amount exceeds the received payment amount by{" "}
                    <strong>
                      {formatCurrency(totalAllocated - numReceived, locale, "THB")}
                    </strong>
                    . Please reduce row allocations.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="border-t border-border/80 bg-muted/20 px-6 py-3 flex items-center justify-between sm:justify-between">
            <div className="text-[11px] text-muted-foreground">
              {orderRows.filter((r) => r.isIncluded && r.allocatedAmount > 0).length} order(s) will be updated with this payment voucher.
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs rounded-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createVoucherMutation.isPending ||
                  numReceived <= 0 ||
                  isOverAllocated ||
                  orderRows.filter((r) => r.isIncluded && r.allocatedAmount > 0).length === 0
                }
                className="h-8 text-xs rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              >
                {createVoucherMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    Record Voucher & Apply Allocations
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
