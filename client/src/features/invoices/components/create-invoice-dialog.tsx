import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  Calculator,
  Calendar,
  CheckCircle2,
  FileText,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react"

import { ROUTES } from "@/app/constants/routes"
import type { Locale } from "@/app/i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateInvoiceMutation,
  useInvoicePreviewQuery,
  useNextInvoiceNumberQuery,
} from "@/features/invoices/queries/invoice.query"
import type { CreateInvoiceRequest } from "@/features/invoices/types/invoice"
import type { MarketplaceCode } from "@/features/stores/types/store"
import { extractApiErrorMessage } from "@/shared/api/extract-api-error-message"
import { useOrderInputRunsPageQuery } from "@/shared/queries/order-input-run.query"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import { invoiceService } from "@/shared/services/invoice.service"
import { formatCurrency } from "@/util/format"

const MARKETPLACE_OPTIONS: MarketplaceCode[] = ["TIKTOK", "SHOPEE", "LAZADA"]

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function firstDayOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
}: CreateInvoiceDialogProps) {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = i18n.language as Locale

  const [mode, setMode] = useState<"run" | "date">("run")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [numberError, setNumberError] = useState("")
  const [title, setTitle] = useState("")
  const [storeId, setStoreId] = useState<number | null>(null)
  const [marketplaceCode, setMarketplaceCode] = useState<MarketplaceCode>("TIKTOK")
  const [orderRunId, setOrderRunId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [submitError, setSubmitError] = useState("")

  const storesQuery = useStoresPageQuery({ pageNumber: 1, pageSize: 200 })
  const stores = useMemo(() => storesQuery.data?.data ?? [], [storesQuery.data])

  const runsQuery = useOrderInputRunsPageQuery({
    pageNumber: 1,
    pageSize: 200,
    sortBy: "createdAt",
    sortOrder: "DESC",
    filter: {
      status: "COMPLETED",
      ...(storeId ? { storeId } : {}),
    },
  })
  const completedRuns = useMemo(
    () => (runsQuery.data?.data ?? []).filter((run) => run.orderDetailImportFileId),
    [runsQuery.data]
  )

  const nextNumberQuery = useNextInvoiceNumberQuery(open)
  const createMutation = useCreateInvoiceMutation()

  useEffect(() => {
    if (!open) {
      return
    }
    setSubmitError("")
    setNumberError("")
    setMode("run")
    setOrderRunId(null)
    setTitle("")
    setStartDate(firstDayOfMonth())
    setEndDate(today())
  }, [open])

  useEffect(() => {
    if (open && nextNumberQuery.data) {
      setInvoiceNumber(nextNumberQuery.data.number)
    }
  }, [open, nextNumberQuery.data])

  useEffect(() => {
    if (storeId == null && stores.length > 0) {
      setStoreId(stores[0].id)
    }
  }, [stores, storeId])

  const selectedRun = completedRuns.find((run) => run.id === orderRunId) ?? null

  useEffect(() => {
    if (mode === "run" && selectedRun && !title) {
      setTitle(selectedRun.title)
    }
  }, [mode, selectedRun, title])

  const previewRequest: CreateInvoiceRequest | null = useMemo(() => {
    if (storeId == null) {
      return null
    }
    if (mode === "run" && orderRunId == null) {
      return null
    }
    if (mode === "date" && (!startDate || !endDate)) {
      return null
    }
    return {
      title: title || "Invoice",
      storeId,
      marketplaceCode: mode === "run" ? selectedRun?.marketplaceCode ?? marketplaceCode : marketplaceCode,
      startDate,
      endDate,
      orderRunId: mode === "run" ? orderRunId ?? undefined : undefined,
    }
  }, [
    mode,
    storeId,
    orderRunId,
    selectedRun,
    marketplaceCode,
    startDate,
    endDate,
    title,
  ])

  const previewQuery = useInvoicePreviewQuery(open ? previewRequest : null)
  const preview = previewQuery.data

  const handleInvoiceNumberChange = async (value: string) => {
    setInvoiceNumber(value)
    const trimmed = value.trim()
    if (!trimmed) {
      setNumberError("Invoice number is required.")
      return
    }
    setNumberError("")
    const result = await invoiceService.checkNumberAvailability(trimmed)
    if (!result.available) {
      setNumberError(`Invoice number "${trimmed}" already exists.`)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError("")

    const trimmedNumber = invoiceNumber.trim()
    if (!trimmedNumber) {
      setNumberError("Please enter an invoice number.")
      return
    }
    if (!previewRequest) {
      setSubmitError("Select a store and an order set or date range first.")
      return
    }

    createMutation.mutate(
      {
        ...previewRequest,
        invoiceNumber: trimmedNumber,
        title:
          title ||
          (mode === "run"
            ? selectedRun?.title ?? "Invoice"
            : `Invoice ${startDate} - ${endDate}`),
      },
      {
        onSuccess: (created) => {
          onOpenChange(false)
          navigate(ROUTES.dashboard.invoiceDetail(created.id))
        },
        onError: (error) => {
          setSubmitError(
            extractApiErrorMessage(error, "Failed to create the invoice.")
          )
        },
      }
    )
  }

  const canSubmit =
    !createMutation.isPending &&
    !numberError &&
    previewRequest != null &&
    (preview?.orderCount ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-4xl w-full overflow-hidden p-0 gap-0 border-border bg-card shadow-2xl rounded-none">
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
          <div className="border-b border-border/80 bg-muted/20 px-6 py-5">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-none bg-primary/10 text-primary border border-primary/20">
                  <FileText className="size-5" />
                </div>
                <div>
                  <DialogTitle className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    Create Invoice
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    สร้างใบแจ้งหนี้ / ใบกำกับภาษีรวมตามรอบคำสั่งซื้อ พร้อมคำนวณภาษีมูลค่าเพิ่ม 7%
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto px-6 py-5 space-y-6 text-sm">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Invoice Generation Source
              </Label>
              <div className="grid grid-cols-2 gap-2 border border-border bg-muted/40 p-1.5 rounded-none">
                <button
                  type="button"
                  onClick={() => setMode("run")}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all rounded-none ${
                    mode === "run"
                      ? "bg-primary text-primary-foreground shadow-xs border border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  <Layers className="size-4" />
                  From Order Set
                </button>
                <button
                  type="button"
                  onClick={() => setMode("date")}
                  className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-all rounded-none ${
                    mode === "date"
                      ? "bg-primary text-primary-foreground shadow-xs border border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  <Calendar className="size-4" />
                  From Date Range
                </button>
              </div>
            </div>

            <div className="border border-border/80 bg-muted/10 p-5 space-y-4 rounded-none">
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
                    onChange={(event) => void handleInvoiceNumberChange(event.target.value)}
                    placeholder="e.g. INV-202608-003"
                    className={`h-10 text-xs font-mono font-bold rounded-none ${
                      numberError
                        ? "border-destructive text-destructive focus-visible:ring-destructive"
                        : "text-primary"
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
                    Store <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={storeId ?? ""}
                    onChange={(event) => {
                      setStoreId(Number(event.target.value) || null)
                      setOrderRunId(null)
                    }}
                    className="w-full h-10 border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring rounded-none"
                    required
                  >
                    <option value="" disabled>
                      {storesQuery.isLoading ? "Loading stores..." : "Select a store"}
                    </option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">
                    Invoice Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. August Tax Invoice"
                    className="h-10 text-xs rounded-none"
                    required
                  />
                </div>
              </div>

              {mode === "run" ? (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-foreground">
                    Select Order Set <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={orderRunId ?? ""}
                    onChange={(event) => {
                      const nextId = Number(event.target.value) || null
                      setOrderRunId(nextId)
                      const run = completedRuns.find((item) => item.id === nextId)
                      if (run) {
                        setTitle(run.title)
                      }
                    }}
                    className="w-full h-10 border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring rounded-none"
                    required
                  >
                    <option value="" disabled>
                      {runsQuery.isLoading
                        ? "Loading order sets..."
                        : completedRuns.length === 0
                          ? "No completed order sets for this store"
                          : "Select an order set"}
                    </option>
                    {completedRuns.map((run) => (
                      <option key={run.id} value={run.id}>
                        {run.title} ({run.orderCount ?? 0} Orders · {run.marketplaceCode})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Marketplace <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={marketplaceCode}
                      onChange={(event) =>
                        setMarketplaceCode(event.target.value as MarketplaceCode)
                      }
                      className="w-full h-10 border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring rounded-none"
                    >
                      {MARKETPLACE_OPTIONS.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-foreground">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
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
                      onChange={(event) => setEndDate(event.target.value)}
                      className="h-10 text-xs font-mono rounded-none"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border border-primary/30 bg-primary/5 p-5 space-y-3 rounded-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-heading text-xs font-bold text-foreground">
                  <Calculator className="size-4 text-primary" />
                  <span>2. Aggregation &amp; 7% VAT Calculation Preview</span>
                </div>
                <span className="inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary rounded-none">
                  {previewQuery.isFetching ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Sparkles className="size-3" />
                  )}
                  Computed from real orders
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
                <div className="border border-border/80 bg-background/80 p-3.5 shadow-xs rounded-none">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Orders Count
                  </p>
                  <p className="mt-1.5 font-mono text-xl font-bold text-foreground">
                    {preview?.orderCount ?? 0}{" "}
                    <span className="text-xs font-normal text-muted-foreground">orders</span>
                  </p>
                </div>

                <div className="border border-border/80 bg-background/80 p-3.5 shadow-xs rounded-none">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Subtotal (Ex-VAT)
                  </p>
                  <p className="mt-1.5 font-mono text-base font-semibold text-foreground">
                    {formatCurrency(preview?.subtotal ?? 0, locale, preview?.currency ?? "THB")}
                  </p>
                </div>

                <div className="border border-primary/30 bg-primary/10 p-3.5 shadow-xs rounded-none">
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    VAT (7%)
                  </p>
                  <p className="mt-1.5 font-mono text-base font-bold text-primary">
                    {formatCurrency(preview?.vatAmount ?? 0, locale, preview?.currency ?? "THB")}
                  </p>
                </div>

                <div className="border border-primary/40 bg-card p-3.5 shadow-xs ring-1 ring-primary/20 rounded-none">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Grand Total
                  </p>
                  <p className="mt-1.5 font-mono text-base font-extrabold text-foreground">
                    {formatCurrency(preview?.grandTotal ?? 0, locale, preview?.currency ?? "THB")}
                  </p>
                </div>
              </div>

              {preview && preview.skippedAlreadyBilledCount > 0 && (
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AlertCircle className="size-3 shrink-0" />
                  {preview.skippedAlreadyBilledCount} order(s) are already billed on another
                  invoice and were excluded.
                </p>
              )}

              {previewRequest && !previewQuery.isFetching && preview?.orderCount === 0 && (
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-destructive">
                  <AlertCircle className="size-3 shrink-0" />
                  No billable orders found for this selection.
                </p>
              )}
            </div>

            {submitError && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {submitError}
              </p>
            )}
          </div>

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
                disabled={!canSubmit}
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
                    Generate Invoice &amp; View Listing
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
