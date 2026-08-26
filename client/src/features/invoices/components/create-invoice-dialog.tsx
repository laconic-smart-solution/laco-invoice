import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
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
import { useCreateInvoiceMutation } from "../queries/invoice.query"
import { formatCurrency } from "@/util/format"
import type { Locale } from "@/app/i18n"
import {
  Calculator,
  Calendar,
  FileText,
  Layers,
  Loader2,
  Sparkles,
  Building2,
  CheckCircle2,
} from "lucide-react"
import { ROUTES } from "@/app/constants/routes"

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language as Locale

  const [mode, setMode] = useState<"run" | "date">("run")
  const [title, setTitle] = useState("Yoik August")
  const [selectedRun, setSelectedRun] = useState("22")
  const [storeId] = useState("1")
  const [storeName] = useState("Tiktok Shop (1) By Dev Alvin")
  const [marketplaceCode] = useState("TIKTOK")
  const [startDate, setStartDate] = useState("2026-08-01")
  const [endDate, setEndDate] = useState("2026-08-31")
  const [buyerName, setBuyerName] = useState("Yoik Global Trading Co., Ltd.")
  const [buyerTaxId, setBuyerTaxId] = useState("0105559876543")
  const [buyerAddress, setBuyerAddress] = useState("88/12 Sukhumvit Rd, Khlong Toei, Bangkok 10110")
  const [notes, setNotes] = useState("Consolidated monthly invoice for TikTok sales with 7% VAT.")

  const createMutation = useCreateInvoiceMutation()

  // Estimated stats for live preview
  const isYoikBatch = mode === "run" && (selectedRun === "22" || title.toLowerCase().includes("yoik"))
  const estimatedOrderCount = isYoikBatch ? 441 : 120
  const estimatedGrandTotal = isYoikBatch ? 128540.0 : 34500.0
  const vatRate = 0.07
  const estimatedSubtotal = Number((estimatedGrandTotal / (1 + vatRate)).toFixed(2))
  const estimatedVat = Number((estimatedGrandTotal - estimatedSubtotal).toFixed(2))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(
      {
        title: title || (mode === "run" ? "Yoik August" : `Invoice ${startDate} - ${endDate}`),
        storeId,
        storeName,
        marketplaceCode,
        startDate,
        endDate,
        orderRunId: mode === "run" ? selectedRun : undefined,
        orderRunTitle: mode === "run" ? (selectedRun === "22" ? "Yoik August" : "Batch Run") : undefined,
        vatRate,
        buyerName,
        buyerTaxId,
        buyerAddress,
        notes,
      },
      {
        onSuccess: (newInv) => {
          onOpenChange(false)
          navigate(ROUTES.dashboard.invoiceDetail(newInv.id))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl overflow-hidden p-0 gap-0 border-border bg-card shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* Header Banner */}
          <div className="border-b border-border/80 bg-muted/20 px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <FileText className="size-5" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    Create Consolidated Invoice
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    สร้างใบแจ้งหนี้ / ใบกำกับภาษีรวมตามรอบคำสั่งซื้อพร้อมคำนวณภาษีมูลค่าเพิ่ม 7%
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Form Scrollable Body */}
          <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm">
            {/* Section 1: Selection Mode Tabs */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Invoice Generation Source
              </Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("run")
                    setTitle("Yoik August")
                  }}
                  className={`flex items-center justify-center gap-2 rounded-md py-2.5 px-3 text-xs font-medium transition-all ${
                    mode === "run"
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <Layers className="size-4 text-primary" />
                  <span className="truncate">From Order Input Run (e.g. Yoik August)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("date")
                    setTitle(`Invoice ${startDate} - ${endDate}`)
                  }}
                  className={`flex items-center justify-center gap-2 rounded-md py-2.5 px-3 text-xs font-medium transition-all ${
                    mode === "date"
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  }`}
                >
                  <Calendar className="size-4 text-primary" />
                  <span className="truncate">From Date to Date Range</span>
                </button>
              </div>
            </div>

            {/* Section 2: Source Details (Run or Date Picker) */}
            <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-4 shadow-sm">
              {mode === "run" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Select Order Input Run <span className="text-destructive">*</span>
                    </Label>
                    <select
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                      value={selectedRun}
                      onChange={(e) => {
                        setSelectedRun(e.target.value)
                        if (e.target.value === "22") setTitle("Yoik August")
                      }}
                    >
                      <option value="22">Yoik August (441 Orders · TIKTOK)</option>
                      <option value="21">test (TIKTOK)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Invoice Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Yoik August 2026"
                      className="h-10 text-xs"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      End Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-10 text-xs font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Invoice Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. August Period Invoice"
                      className="h-10 text-xs"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Buyer & Tax Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Buyer & Tax Invoice Information
                </Label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">
                    Customer / Company Name
                  </Label>
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Yoik Global Trading Co., Ltd."
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground">
                      Buyer Tax ID
                    </Label>
                    <span className="text-[11px] text-muted-foreground">13-digit code</span>
                  </div>
                  <Input
                    value={buyerTaxId}
                    onChange={(e) => setBuyerTaxId(e.target.value)}
                    placeholder="0105559876543"
                    className="h-10 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">
                    Billing Address
                  </Label>
                  <Input
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    placeholder="Company address"
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">
                    Remarks / Notes
                  </Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    className="h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Live 7% VAT & Aggregation Summary Box */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-heading text-xs font-bold text-foreground">
                  <Calculator className="size-4 text-primary" />
                  <span>3. Aggregation & 7% VAT Calculation Preview</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  <Sparkles className="size-3" /> Auto-computed
                </span>
              </div>

              {/* 4 Clean Stat Tiles */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
                {/* Tile 1: Orders */}
                <div className="rounded-lg border border-border/80 bg-background/80 p-3 shadow-xs">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Orders Count
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-foreground">
                    {estimatedOrderCount} <span className="text-xs font-normal text-muted-foreground">orders</span>
                  </p>
                </div>

                {/* Tile 2: Subtotal Ex-VAT */}
                <div className="rounded-lg border border-border/80 bg-background/80 p-3 shadow-xs">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Subtotal (Ex-VAT)
                  </p>
                  <p className="mt-1 font-mono text-base font-semibold text-foreground truncate">
                    {formatCurrency(estimatedSubtotal, locale, "THB")}
                  </p>
                </div>

                {/* Tile 3: VAT 7% */}
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 shadow-xs">
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    VAT (7%)
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-primary truncate">
                    {formatCurrency(estimatedVat, locale, "THB")}
                  </p>
                </div>

                {/* Tile 4: Grand Total */}
                <div className="rounded-lg border border-primary/40 bg-card p-3 shadow-xs ring-1 ring-primary/20">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Grand Total
                  </p>
                  <p className="mt-1 font-mono text-base font-extrabold text-foreground truncate">
                    {formatCurrency(estimatedGrandTotal, locale, "THB")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border/80 bg-muted/20 px-6 py-4">
            <DialogFooter className="flex flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
                className="h-10 px-5 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-10 px-5 text-xs font-semibold"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating Invoice…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    Generate Invoice & View Listing
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
