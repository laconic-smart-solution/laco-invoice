import { useMemo, useState } from "react"

import {
  MANUAL_INVOICE_STAGES,
  type ManualInvoiceQueueFilter,
  type ManualInvoiceStage,
} from "@/features/flow/data/flow-constants"
import {
  isManualInvoiceReadyToIssue,
  matchesManualInvoiceFilter,
} from "@/features/flow/util/manual-invoice"
import {
  useInvoiceDetailQuery,
  useInvoicesQuery,
} from "@/features/invoices/queries/invoice.query"
import {
  useVouchersByInvoiceQuery,
  useVouchersQuery,
} from "@/features/vouchers/queries/voucher.query"
import { useDebounce } from "@/shared/hooks/use-debounce"

export type { ManualInvoiceQueueFilter, ManualInvoiceStage }
export { MANUAL_INVOICE_STAGES }

export function useManualInvoiceWorkspace() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<ManualInvoiceQueueFilter>("all")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [stage, setStage] = useState<ManualInvoiceStage>("draft")
  const debouncedSearch = useDebounce(search)

  const request = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: 200,
      sortBy: "createdAt",
      sortOrder: "DESC" as const,
      filter: {
        sourceType: "MANUAL" as const,
        ...(debouncedSearch.trim() ? { title: debouncedSearch.trim() } : {}),
      },
    }),
    [debouncedSearch]
  )
  const invoicesQuery = useInvoicesQuery(request)
  const invoices = useMemo(
    () => invoicesQuery.data ?? [],
    [invoicesQuery.data]
  )
  const vouchersQuery = useVouchersQuery()
  const linkedVouchers = useMemo(
    () =>
      (vouchersQuery.data ?? []).filter(
        (voucher) => voucher.invoiceId != null && voucher.invoiceId > 0
      ),
    [vouchersQuery.data]
  )
  const voucherInvoiceIds = useMemo(
    () =>
      new Set(
        linkedVouchers
          .map((voucher) => voucher.invoiceId)
          .filter((id): id is number => id != null)
      ),
    [linkedVouchers]
  )
  const visibleInvoices = useMemo(
    () =>
      invoices.filter((invoice) =>
        matchesManualInvoiceFilter(invoice, filter, voucherInvoiceIds)
      ),
    [filter, invoices, voucherInvoiceIds]
  )
  const resolvedSelectedId = isCreatingNew
    ? null
    : selectedInvoiceId != null &&
        visibleInvoices.some((invoice) => invoice.id === selectedInvoiceId)
      ? selectedInvoiceId
      : (visibleInvoices[0]?.id ?? null)
  const detailQuery = useInvoiceDetailQuery(resolvedSelectedId)
  const selectedInvoice = detailQuery.data ?? null
  const selectedVouchersQuery = useVouchersByInvoiceQuery(resolvedSelectedId)
  const vouchers = useMemo(
    () => selectedVouchersQuery.data ?? [],
    [selectedVouchersQuery.data]
  )

  const counts = useMemo(() => {
    const drafts = invoices.filter((invoice) => invoice.status === "DRAFT")
    const ready = invoices.filter(isManualInvoiceReadyToIssue)
    const issued = invoices.filter((invoice) => invoice.status === "ISSUED")
    const withVoucher = invoices.filter((invoice) =>
      voucherInvoiceIds.has(invoice.id)
    )
    const invoiceValue = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.grandTotal || 0),
      0
    )
    const outstandingValue = invoices
      .filter(
        (invoice) =>
          invoice.status === "ISSUED" && !voucherInvoiceIds.has(invoice.id)
      )
      .reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0)
    return {
      total: invoices.length,
      draft: drafts.length,
      ready: ready.length,
      issued: issued.length,
      voucher: withVoucher.length,
      exportReady: withVoucher.length,
      invoiceValue,
      outstandingValue,
      currency: invoices[0]?.currency ?? "THB",
    }
  }, [invoices, voucherInvoiceIds])

  const selectInvoice = (id: number) => {
    setIsCreatingNew(false)
    setSelectedInvoiceId(id)
    const invoice = invoices.find((item) => item.id === id)
    const hasVoucher = voucherInvoiceIds.has(id)
    if (hasVoucher) setStage("export")
    else if (invoice?.status === "DRAFT") setStage("draft")
    else setStage("review")
  }

  return {
    search,
    setSearch,
    filter,
    setFilter,
    selectedInvoiceId: resolvedSelectedId,
    selectInvoice,
    selectedInvoice,
    invoices: visibleInvoices,
    vouchers,
    counts,
    stage,
    setStage,
    isLoading: invoicesQuery.isLoading,
    isFetching: invoicesQuery.isFetching,
    error: invoicesQuery.error,
    refetch: invoicesQuery.refetch,
    beginNewInvoice: () => {
      setIsCreatingNew(true)
      setSelectedInvoiceId(null)
      setStage("draft")
    },
  }
}
