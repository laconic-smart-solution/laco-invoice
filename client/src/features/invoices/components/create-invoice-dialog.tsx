import { useState, useEffect } from "react"
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
import { invoiceLocalService } from "../services/invoice-local.service"
import { formatCurrency } from "@/util/format"
import type { Locale } from "@/app/i18n"
import {
  AlertCircle,
  Calculator,
  Calendar,
  FileText,
  Layers,
  Loader2,
  Sparkles,
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
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [numberError, setNumberError] = useState("")
  const [title, setTitle] = useState("Yoik August")
  const [selectedRun, setSelectedRun] = useState("22")
  const [storeId] = useState("1")
  const [storeName] = useState("Tiktok Shop (1) By Dev Alvin")
  const [marketplaceCode] = useState("TIKTOK")
  const [startDate, setStartDate] = useState("2026-08-01")
  const [endDate, setEndDate] = useState("2026-08-31")

  const createMutation = useCreateInvoiceMutation()

  // Auto-fill invoice number upon opening dialog
  useEffect(() => {
    if (open) {
      const nextNo = invoiceLocalService.getNextInvoiceNumber()
      setInvoiceNumber(nextNo)
      setNumberError("")
    }
  }, [open])

  const handleInvoiceNumberChange = (value: string) => {
    setInvoiceNumber(value)
    if (value.trim()) {
      if (invoiceLocalService.isInvoiceNumberTaken(value.trim())) {
        setNumberError(`Invoice number "${value.trim()}" already exists.`)
      } else {
        setNumberError("")
      }
    } else {
      setNumberError("Invoice number is required.")
    }
  }

  // Estimated stats for live preview
  const isYoikBatch = mode === "run" && (selectedRun === "22" || title.toLowerCase().includes("yoik"))
  const estimatedOrderCount = isYoikBatch ? 441 : 120
  const estimatedGrandTotal = isYoikBatch ? 128540.0 : 34500.0
  const vatRate = 0.07
  const estimatedSubtotal = Number((estimatedGrandTotal / (1 + vatRate)).toFixed(2))
  const estimatedVat = Number((estimatedGrandTotal - estimatedSubtotal).toFixed(2))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const targetNo = invoiceNumber.trim()
    if (!targetNo) {
      setNumberError("Please enter an invoice number.")
      return
    }
    if (invoiceLocalService.isInvoiceNumberTaken(targetNo)) {
      setNumberError(`Invoice number "${targetNo}" already exists. Please choose a unique number.`)
      return
    }

    createMutation.mutate(
      {
        invoiceNumber: targetNo,
        title: title || (mode === "run" ? "Yoik August" : `Invoice ${startDate} - ${endDate}`),
        storeId,
        storeName,
        marketplaceCode,
        startDate,
        endDate,
        orderRunId: mode === "run" ? selectedRun : undefined,
        orderRunTitle: mode === "run" ? (selectedRun === "22" ? "Yoik August" : "Batch Run") : undefined,
        vatRate,
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
      <DialogContent className="max-w-4xl sm:max-w-4xl w-full overflow-hidden p-0 gap-0 border-border bg-card shadow-2xl rounded-none">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          {/* Header Banner */}
          <div className="border-b border-border/80 bg-muted/20 px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-none bg-primary/10 text-primary border border-primary/20">
                  <FileText className="size-5" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    Create Consolidated Invoice
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    สร้างใบแจ้งหนี้ / ใบกำกับภาษีรวมตามรอบคำสั่งซื้อ พร้อมคำนวณภาษีมูลค่าเพิ่ม 7%
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
              <div className="grid grid-cols-2 gap-2 border border-border bg-muted/40 p-1.5 rounded-none">
                <button
                  type="button"
                  onClick={() => {
                    setMode("run")
                    setTitle("Yoik August")
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all rounded-none ${
                    mode === "run"
                      ? "bg-primary text-primary-foreground shadow-xs border border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  <Layers className={`size-4 ${mode === "run" ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  From Order Input Run (e.g. Yoik August)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("date")
                    setTitle("August Settlement Batch")
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all rounded-none ${
                    mode === "date"
                      ? "bg-primary text-primary-foreground shadow-xs border border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  <Calendar className={`size-4 ${mode === "date" ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  From Date to Date Range
                </button>
              </div>
            </div>

            {/* Section 2: Source Controls with Invoice No. Input */}
            <div className="border border-border/80 bg-muted/10 p-5 space-y-4 rounded-none">
              {mode === "run" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-foreground">
                        Invoice No. <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground">Editable</span>
                    </div>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                      placeholder="e.g. INV-202608-003"
                      className={`h-10 text-xs font-mono font-bold rounded-none ${
                        numberError ? "border-destructive text-destructive focus-visible:ring-destructive" : "text-primary"
                      }`}
                      required
                    />
                    {numberError && (
                      <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                        <AlertCircle className="size-3 shrink-0" />
                        {numberError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Select Order Input Run <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={selectedRun}
                      onChange={(e) => {
                        setSelectedRun(e.target.value)
                        if (e.target.value === "22") setTitle("Yoik August")
                        else setTitle("July Settlement Batch 2")
                      }}
                      className="w-full h-10 border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring rounded-none"
                    >
                      <option value="22">Yoik August (441 Orders · TIKTOK)</option>
                      <option value="21">July Settlement Batch 2 (185 Orders · TIKTOK)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Invoice Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Yoik August Tax Invoice"
                      className="h-10 text-xs rounded-none"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-foreground">
                        Invoice No. <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground">Editable</span>
                    </div>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                      placeholder="e.g. INV-202608-003"
                      className={`h-10 text-xs font-mono font-bold rounded-none ${
                        numberError ? "border-destructive text-destructive focus-visible:ring-destructive" : "text-primary"
                      }`}
                      required
                    />
                    {numberError && (
                      <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                        <AlertCircle className="size-3 shrink-0" />
                        {numberError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 text-xs font-mono rounded-none"
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
                      className="h-10 text-xs font-mono rounded-none"
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
                      className="h-10 text-xs rounded-none"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Live 7% VAT & Aggregation Summary Box */}
            <div className="border border-primary/30 bg-primary/5 p-5 space-y-3 rounded-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-heading text-xs font-bold text-foreground">
                  <Calculator className="size-4 text-primary" />
                  <span>2. Aggregation & 7% VAT Calculation Preview</span>
                </div>
                <span className="inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary rounded-none">
                  <Sparkles className="size-3" /> Auto-computed
                </span>
              </div>

              {/* 4 Clean Stat Tiles */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
                {/* Tile 1: Orders */}
                <div className="border border-border/80 bg-background/80 p-3.5 shadow-xs rounded-none">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Orders Count
                  </p>
                  <p className="mt-1.5 font-mono text-xl font-bold text-foreground">
                    {estimatedOrderCount} <span className="text-xs font-normal text-muted-foreground">orders</span>
                  </p>
                </div>

                {/* Tile 2: Subtotal Ex-VAT */}
                <div className="border border-border/80 bg-background/80 p-3.5 shadow-xs rounded-none">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Subtotal (Ex-VAT)
                  </p>
                  <p className="mt-1.5 font-mono text-base font-semibold text-foreground">
                    {formatCurrency(estimatedSubtotal, locale, "THB")}
                  </p>
                </div>

                {/* Tile 3: VAT 7% */}
                <div className="border border-primary/30 bg-primary/10 p-3.5 shadow-xs rounded-none">
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    VAT (7%)
                  </p>
                  <p className="mt-1.5 font-mono text-base font-bold text-primary">
                    {formatCurrency(estimatedVat, locale, "THB")}
                  </p>
                </div>

                {/* Tile 4: Grand Total */}
                <div className="border border-primary/40 bg-card p-3.5 shadow-xs ring-1 ring-primary/20 rounded-none">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Grand Total
                  </p>
                  <p className="mt-1.5 font-mono text-base font-extrabold text-foreground">
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
                className="h-10 px-6 text-xs font-medium rounded-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || Boolean(numberError)}
                className="h-10 px-6 text-xs font-semibold rounded-none bg-primary text-primary-foreground disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating Invoice...
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