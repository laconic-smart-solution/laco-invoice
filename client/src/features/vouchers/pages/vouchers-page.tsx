import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  BookText,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Scale,
  Search,
  Store,
} from "lucide-react"

import { ROUTES } from "@/app/constants/routes"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { StatCard } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import { ManualColumnControls, type ManualColumnItem } from "@/components/common/data-table/manual-column-controls"
import { useTableDensityStore } from "@/shared/stores/table-density-store"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GenerateVoucherDialog } from "@/features/vouchers/components/generate-voucher-dialog"
import { VoucherRowActions } from "@/features/vouchers/components/voucher-row-actions"
import {
  voucherStatusTooltip,
  VoucherStatusBadge,
} from "@/features/vouchers/components/voucher-status-badge"
import {
  erpLookupLabel,
  useErpItemsQuery,
  useErpVendorsQuery,
} from "@/features/vouchers/queries/erp-lookup.query"
import {
  useExportVouchersCsvMutation,
  useExportVouchersExcelMutation,
  useExportVouchersPdfMutation,
  usePostVoucherToErpMutation,
  useVouchersQuery,
} from "@/features/vouchers/queries/voucher.query"
import type {
  Voucher,
  VoucherExportRequest,
  VoucherStatus,
} from "@/features/vouchers/types/voucher"
import { extractApiErrorMessage } from "@/shared/api/extract-api-error-message"
import { useStoresPageQuery } from "@/shared/queries/store.query"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency, formatNumber } from "@/util/format"

const EMPTY_VOUCHERS: Voucher[] = []

type VoucherColumnKey =
  | "voucherNo"
  | "category"
  | "brief"
  | "item"
  | "vendor"
  | "store"
  | "date"
  | "debit"
  | "credit"
  | "status"
  | "actions"

const DEFAULT_VOUCHER_COLUMNS: Record<VoucherColumnKey, boolean> = {
  voucherNo: true,
  category: true,
  brief: true,
  item: true,
  vendor: true,
  store: true,
  date: true,
  debit: true,
  credit: true,
  status: true,
  actions: true,
}

export function VouchersPage() {
  const { t } = useTranslation("vouchers")
  const navigate = useNavigate()
  const locale = useLocaleStore((state) => state.locale)
  const density = useTableDensityStore((state) => state.density)
  const isCompact = density === "compact"

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [storeFilter, setStoreFilter] = useState("all")
  const [generateOpen, setGenerateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [postingVoucher, setPostingVoucher] = useState<Voucher | null>(null)
  const [postError, setPostError] = useState<string | null>(null)
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VOUCHER_COLUMNS)

  const handleToggleColumn = (id: string, isVisible: boolean) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [id as VoucherColumnKey]: isVisible,
    }))
  }

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VOUCHER_COLUMNS)
  }

  const columnOptions: ManualColumnItem[] = [
    { id: "voucherNo", label: t("table.voucher_no"), isVisible: visibleColumns.voucherNo },
    { id: "category", label: t("table.category"), isVisible: visibleColumns.category },
    { id: "brief", label: t("table.brief"), isVisible: visibleColumns.brief },
    { id: "item", label: t("table.item"), isVisible: visibleColumns.item },
    { id: "vendor", label: t("table.vendor"), isVisible: visibleColumns.vendor },
    { id: "store", label: t("table.store"), isVisible: visibleColumns.store },
    { id: "date", label: t("table.date"), isVisible: visibleColumns.date },
    { id: "debit", label: t("table.debit"), isVisible: visibleColumns.debit },
    { id: "credit", label: t("table.credit"), isVisible: visibleColumns.credit },
    { id: "status", label: t("table.status"), isVisible: visibleColumns.status },
    { id: "actions", label: t("table.actions"), isVisible: visibleColumns.actions },
  ]

  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length

  const vouchersQuery = useVouchersQuery()
  const postMutation = usePostVoucherToErpMutation()
  const exportExcelMutation = useExportVouchersExcelMutation()
  const exportCsvMutation = useExportVouchersCsvMutation()
  const exportPdfMutation = useExportVouchersPdfMutation()
  const storesQuery = useStoresPageQuery({ pageNumber: 1, pageSize: 200 })
  const itemsQuery = useErpItemsQuery()
  const vendorsQuery = useErpVendorsQuery()

  const isExporting =
    exportExcelMutation.isPending ||
    exportCsvMutation.isPending ||
    exportPdfMutation.isPending

  const vouchers = vouchersQuery.data ?? EMPTY_VOUCHERS
  const stores = storesQuery.data?.data ?? []

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const keyword = search.trim().toLowerCase()
      const itemLabel = erpLookupLabel(itemsQuery.data, voucher.externalErpItemId)
      const vendorLabel = erpLookupLabel(vendorsQuery.data, voucher.externalErpVendorId)
      const matchSearch =
        !keyword ||
        voucher.voucherNumber.toLowerCase().includes(keyword) ||
        (voucher.erpVoucherNo?.toLowerCase().includes(keyword) ?? false) ||
        (voucher.voucherBrief?.toLowerCase().includes(keyword) ?? false) ||
        itemLabel.toLowerCase().includes(keyword) ||
        vendorLabel.toLowerCase().includes(keyword)
      const matchStatus = statusFilter === "all" || voucher.status === statusFilter
      const matchStore =
        storeFilter === "all" || String(voucher.storeId) === storeFilter
      return matchSearch && matchStatus && matchStore
    })
  }, [itemsQuery.data, search, statusFilter, storeFilter, vendorsQuery.data, vouchers])

  const buildExportPayload = (): VoucherExportRequest => {
    const ids = filteredVouchers.map((v) => v.id)
    return {
      ids: ids.length > 0 ? ids : undefined,
      exportAll: ids.length === 0,
      filter: {
        storeId: storeFilter !== "all" ? Number(storeFilter) : undefined,
        status: statusFilter !== "all" ? (statusFilter as VoucherStatus) : undefined,
      },
    }
  }

  const handleExportExcel = async () => {
    try {
      await exportExcelMutation.mutateAsync(buildExportPayload())
    } catch (error) {
      console.error("Export Excel error", error)
    }
  }

  const handleExportCsv = async () => {
    try {
      await exportCsvMutation.mutateAsync(buildExportPayload())
    } catch (error) {
      console.error("Export CSV error", error)
    }
  }

  const handleExportPdf = async () => {
    try {
      await exportPdfMutation.mutateAsync(buildExportPayload())
    } catch (error) {
      console.error("Export PDF error", error)
    }
  }

  const debitTotal = filteredVouchers.reduce((sum, voucher) => sum + voucher.debitTotal, 0)
  const creditTotal = filteredVouchers.reduce(
    (sum, voucher) => sum + voucher.creditTotal,
    0
  )
  const generatedCount = filteredVouchers.filter(
    (voucher) => voucher.status === "GENERATED" || voucher.status === "POSTED"
  ).length

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isExporting || filteredVouchers.length === 0}
                className="h-9 gap-1.5 rounded-none text-xs font-semibold shadow-xs"
              >
                {isExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {isExporting ? t("export.exporting") : t("export.button")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
              <DropdownMenuItem
                onClick={handleExportExcel}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileSpreadsheet className="size-4 text-emerald-600" />
                {t("export.excel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportCsv}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileText className="size-4 text-sky-600" />
                {t("export.csv")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPdf}
                className="cursor-pointer gap-2 text-xs"
              >
                <FileText className="size-4 text-rose-600" />
                {t("export.pdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            onClick={() => {
              setEditingId(null)
              setGenerateOpen(true)
            }}
            className="h-9 gap-1.5 rounded-none bg-primary text-xs font-semibold text-primary-foreground shadow-xs"
          >
            <Plus className="size-4" />
            {t("generate")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("kpi.total")}
          value={formatNumber(filteredVouchers.length, locale)}
          icon={BookText}
          iconWrapperClassName="bg-info/10 text-info"
        />
        <StatCard
          title={t("kpi.generated")}
          value={formatNumber(generatedCount, locale)}
          icon={Scale}
          iconWrapperClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title={t("kpi.debit")}
          value={formatCurrency(debitTotal, locale, "THB")}
          icon={BookText}
          iconWrapperClassName="bg-muted text-foreground"
        />
        <StatCard
          title={t("kpi.credit")}
          value={formatCurrency(creditTotal, locale, "THB")}
          icon={BookText}
          iconWrapperClassName="bg-muted text-foreground"
        />
      </div>

      <div className="space-y-4">
        <div className="rounded-none border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("filters.search")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-9 rounded-none pl-8 text-xs"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-36 rounded-none text-xs">
                  <SelectValue placeholder={t("filters.status")} />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">{t("filters.all_statuses")}</SelectItem>
                  <SelectItem value="DRAFT">{t("status.draft")}</SelectItem>
                  <SelectItem value="GENERATED">{t("status.generated")}</SelectItem>
                  <SelectItem value="POSTED">{t("status.posted")}</SelectItem>
                  <SelectItem value="FAILED">{t("status.failed")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="h-9 w-52 rounded-none text-xs">
                  <SelectValue placeholder={t("filters.store")} />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">{t("filters.all_stores")}</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={String(store.id)}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <ManualColumnControls
                columns={columnOptions}
                onToggleColumn={handleToggleColumn}
                onResetColumns={handleResetColumns}
              />
              <div className="text-xs text-muted-foreground">
                {t("filters.showing", {
                  count: filteredVouchers.length,
                  total: vouchers.length,
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-none border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted font-medium text-muted-foreground">
                <tr>
                  {visibleColumns.voucherNo && <th className={isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3"}>{t("table.voucher_no")}</th>}
                  {visibleColumns.category && <th className={isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3"}>{t("table.category")}</th>}
                  {visibleColumns.brief && <th className={isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3"}>{t("table.brief")}</th>}
                  {visibleColumns.item && <th className={isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3"}>{t("table.item")}</th>}
                  {visibleColumns.vendor && <th className={isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3"}>{t("table.vendor")}</th>}
                  {visibleColumns.store && <th className={isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3"}>{t("table.store")}</th>}
                  {visibleColumns.date && <th className={isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3"}>{t("table.date")}</th>}
                  {visibleColumns.debit && <th className={cn(isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3", "text-right")}>{t("table.debit")}</th>}
                  {visibleColumns.credit && <th className={cn(isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3", "text-right")}>{t("table.credit")}</th>}
                  {visibleColumns.status && <th className={cn(isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3", "text-center")}>{t("table.status")}</th>}
                  {visibleColumns.actions && <th className={cn(isCompact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-3", "text-right")}>{t("table.actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {vouchersQuery.isLoading ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount || 1}
                      className="py-12 text-center font-sans text-muted-foreground"
                    >
                      {t("loading")}
                    </td>
                  </tr>
                ) : filteredVouchers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleColumnCount || 1}
                      className="py-12 text-center font-sans text-muted-foreground"
                    >
                      {t("empty")}
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((voucher) => (
                    <tr
                      key={voucher.id}
                      onClick={() =>
                        navigate(ROUTES.dashboard.voucherDetail(voucher.id))
                      }
                      className="cursor-pointer transition-colors hover:bg-muted/30"
                    >
                      {visibleColumns.voucherNo && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "font-bold text-foreground")}>
                          {voucher.voucherNumber}
                        </td>
                      )}
                      {visibleColumns.category && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "font-sans")}>
                          {t(`category.${voucher.voucherCategory}`)}
                        </td>
                      )}
                      {visibleColumns.brief && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "font-sans text-muted-foreground")}>
                          {voucher.voucherBrief ?? "—"}
                        </td>
                      )}
                      {visibleColumns.item && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "font-sans")}>
                          {erpLookupLabel(itemsQuery.data, voucher.externalErpItemId)}
                        </td>
                      )}
                      {visibleColumns.vendor && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "font-sans")}>
                          {erpLookupLabel(vendorsQuery.data, voucher.externalErpVendorId)}
                        </td>
                      )}
                      {visibleColumns.store && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "font-sans text-muted-foreground")}>
                          <div className="flex items-center gap-1.5">
                            <Store className="size-3.5 shrink-0" />
                            <span className="max-w-[140px] truncate">
                              {voucher.storeName ?? "—"}
                            </span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.date && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "text-[11px] text-muted-foreground")}>
                          {voucher.voucherDate}
                        </td>
                      )}
                      {visibleColumns.debit && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "text-right")}>
                          {formatCurrency(voucher.debitTotal, locale, voucher.currency)}
                        </td>
                      )}
                      {visibleColumns.credit && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "text-right")}>
                          {formatCurrency(voucher.creditTotal, locale, voucher.currency)}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3", "text-center font-sans")}>
                          <VoucherStatusBadge
                            status={voucher.status}
                            label={t(`status.${voucher.status.toLowerCase()}`)}
                            description={voucherStatusTooltip(
                              voucher,
                              t(`status_description.${voucher.status.toLowerCase()}`)
                            )}
                          />
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className={cn(isCompact ? "px-2.5 py-1.5" : "px-4 py-3")}>
                          <VoucherRowActions
                            status={voucher.status}
                            onEdit={() => {
                              setEditingId(voucher.id)
                              setGenerateOpen(true)
                            }}
                            onPost={() => {
                              setPostError(null)
                              setPostingVoucher(voucher)
                            }}
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <GenerateVoucherDialog
        open={generateOpen}
        voucherId={editingId}
        onOpenChange={(open) => {
          setGenerateOpen(open)
          if (!open) {
            setEditingId(null)
          }
        }}
      />
      <ConfirmDialog
        open={postingVoucher != null}
        onOpenChange={(open) => {
          if (!open) {
            setPostingVoucher(null)
            setPostError(null)
          }
        }}
        title={t("post.confirm_title")}
        description={
          postError ??
          t("post.confirm_description", {
            number: postingVoucher?.voucherNumber ?? "",
          })
        }
        confirmLabel={t("post.confirm")}
        isLoading={postMutation.isPending}
        onConfirm={async () => {
          if (!postingVoucher) {
            return
          }
          try {
            await postMutation.mutateAsync(postingVoucher.id)
            setPostingVoucher(null)
          } catch (error) {
            setPostError(
              extractApiErrorMessage(error, t("errors.post_failed"))
            )
            throw error
          }
        }}
      />
    </div>
  )
}

export default VouchersPage
