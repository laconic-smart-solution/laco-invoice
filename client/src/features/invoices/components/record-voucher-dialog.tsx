import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Layers,
  Loader2,
  Receipt,
  Sparkles,
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

  const [orderRows, setOrderRows] = useState<OrderAllocationRow[]>([])
  const createVoucherMutation = useCreateVoucherMutation()

  // Initialize form when opening
  useEffect(() => {
    if (open) {
      const nextNo = voucherLocalService.getNextVoucherNumber()
      setVoucherNumber(nextNo)
      setVoucherNumberError("")
      setBankReference(`TRF-${Math.floor(100000 + Math.random() * 900000)}`)

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
          isIncluded: summary.remainingBalance > 0.01,
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

  const unallocatedCredit = useMemo(() => {
    return Math.max(0, Number((numReceived - totalAllocated).toFixed(2)))
  }, [numReceived, totalAllocated])

  const isOverAllocated = totalAllocated > numReceived + 0.001

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

  // FIFO Auto-allocation algorithm
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

  // Set single row allocation
  const handleRowAllocationChange = (orderId: string, val: string) => {
    const amount = parseFloat(val) || 0
    setOrderRows((prev) =>
      prev.map((row) => {
        if (row.orderId !== orderId) return row
        const capped = Math.min(amount, row.remainingBalance)
        return { ...row, allocatedAmount: Math.max(0, capped) }
      })
    )
  }

  // Allocate full remaining for single row
  const handlePayFullRow = (orderId: string) => {
    setOrderRows((prev) =>
      prev.map((row) => {
        if (row.orderId !== orderId) return row
        return { ...row, allocatedAmount: row.remainingBalance }
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
                    บันทึกใบสำคัญรับเงิน / รับชำระเงินจากลูกค้า พร้อมตัดยอดชำระแบบบางส่วน (Partial) หลายรายการคำสั่งซื้อ
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Form Scrollable Body */}
          <div className="overflow-y-auto px-6 py-5 space-y-6 text-xs">
            {/* Section 1: Voucher Header Details */}
            <div className="border border-border/80 bg-muted/10 p-4 space-y-4 rounded-none">
              <div className="flex items-center gap-2 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
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
                    <option value="PLATFORM_PAYOUT">Platform Settlement (ตัดจ่ายผ่านแพลตฟอร์ม)</option>
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
                </div>

                {/* Auto Allocation Button */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoAllocateFIFO}
                    disabled={numReceived <= 0}
                    className="h-7.5 text-xs rounded-none border-primary text-primary hover:bg-primary/10 gap-1.5"
                  >
                    <Sparkles className="size-3.5" />
                    Auto-Allocate FIFO (จัดสรรยอดอัตโนมัติ)
                  </Button>
                </div>
              </div>

              {/* Order Allocation Table */}
              <div className="overflow-x-auto max-h-[320px] overflow-y-auto border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-muted/95 backdrop-blur font-medium text-muted-foreground border-b border-border z-10">
                    <tr>
                      <th className="px-3 py-2">#</th>
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
                    {orderRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground font-sans">
                          No orders available for allocation.
                        </td>
                      </tr>
                    ) : (
                      orderRows.map((row, idx) => (
                        <tr key={row.orderId} className="transition-colors hover:bg-muted/30">
                          <td className="px-3 py-2 text-muted-foreground font-sans">{idx + 1}</td>
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
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              value={row.allocatedAmount === 0 ? "" : row.allocatedAmount}
                              onChange={(e) =>
                                handleRowAllocationChange(row.orderId, e.target.value)
                              }
                              placeholder="0.00"
                              className="h-7 text-right text-xs font-mono font-bold text-primary rounded-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-center font-sans">
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
                    Total Allocated to Orders
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
                    Unallocated Credit Balance (ยอดคงเหลือ)
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {isOverAllocated
                      ? "Over-Allocated!"
                      : formatCurrency(unallocatedCredit, locale, "THB")}
                  </span>
                </div>
              </div>

              {isOverAllocated && (
                <div className="flex items-center gap-1.5 p-2 bg-destructive/10 text-destructive text-xs border border-destructive/30">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    The total allocated amount ({formatCurrency(totalAllocated, locale, "THB")}) exceeds
                    the received voucher amount ({formatCurrency(numReceived, locale, "THB")}).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border/80 bg-muted/20 px-6 py-3.5">
            <DialogFooter className="flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createVoucherMutation.isPending}
                className="h-9 px-5 text-xs rounded-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createVoucherMutation.isPending || isOverAllocated || numReceived <= 0}
                className="h-9 px-6 text-xs font-semibold rounded-none bg-primary text-primary-foreground disabled:opacity-50"
              >
                {createVoucherMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Recording Voucher...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-3.5" />
                    Record Voucher & Apply Allocations
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
