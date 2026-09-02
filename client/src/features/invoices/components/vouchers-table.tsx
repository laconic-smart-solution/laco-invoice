import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Eye,
  FilterX,
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/util/format"
import type { Locale } from "@/app/i18n"
import type { PaymentVoucher } from "../types/voucher"
import { VoucherDetailDialog } from "./voucher-detail-dialog"

interface VouchersTableProps {
  vouchers: PaymentVoucher[]
  isLoading?: boolean
}

export function VouchersTable({ vouchers, isLoading }: VouchersTableProps) {
  const { i18n } = useTranslation()
  const locale = i18n.language as Locale

  const [search, setSearch] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<string>("all")
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const filteredVouchers = useMemo(() => {
    return (vouchers || []).filter((v) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const match =
          v.voucherNumber.toLowerCase().includes(q) ||
          (v.customerName?.toLowerCase().includes(q) ?? false) ||
          (v.bankReference && v.bankReference.toLowerCase().includes(q)) ||
          v.allocations.some((a) => a.externalOrderId.toLowerCase().includes(q))
        if (!match) return false
      }

      if (selectedMethod !== "all" && v.paymentMethod !== selectedMethod) {
        return false
      }

      return true
    })
  }, [vouchers, search, selectedMethod])

  const handleViewDetail = (voucher: PaymentVoucher) => {
    setSelectedVoucher(voucher)
    setShowDetail(true)
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="border border-border bg-card shadow-sm p-4 rounded-none space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Keyword Search */}
            <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Voucher No, Customer, Slip..."
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

            {/* Payment Method Dropdown */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="h-9 border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring rounded-none font-medium text-foreground"
            >
              <option value="all">All Payment Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer (โอนเงิน)</option>
              <option value="PROMPTPAY">PromptPay (พร้อมเพย์)</option>
              <option value="CREDIT_CARD">Credit Card (บัตรเครดิต)</option>
              <option value="PLATFORM_PAYOUT">Platform Settlement (แพลตฟอร์ม)</option>
              <option value="CASH">Cash (เงินสด)</option>
            </select>

            {(search || selectedMethod !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setSelectedMethod("all")
                }}
                className="h-9 text-xs rounded-none text-muted-foreground hover:text-destructive gap-1.5"
              >
                <FilterX className="size-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Showing <strong className="font-mono text-foreground">{filteredVouchers.length}</strong> of{" "}
            <span className="font-mono">{vouchers.length}</span> payment vouchers
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="border border-border bg-card shadow-sm rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted font-medium text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">VOUCHER NO.</th>
                <th className="px-4 py-3">DATE</th>
                <th className="px-4 py-3">CUSTOMER / PAYER</th>
                <th className="px-4 py-3">METHOD & SLIP REF</th>
                <th className="px-4 py-3 text-center">LINKED ORDERS</th>
                <th className="px-4 py-3 text-right">TOTAL RECEIVED</th>
                <th className="px-4 py-3 text-right text-primary">ALLOCATED AMOUNT</th>
                <th className="px-4 py-3 text-right">CREDIT BALANCE</th>
                <th className="px-4 py-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground font-sans">
                    Loading payment vouchers...
                  </td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground font-sans">
                    No payment vouchers found.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v, idx) => (
                  <tr
                    key={v.id}
                    onClick={() => handleViewDetail(v)}
                    className="transition-colors hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-muted-foreground font-sans">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-foreground hover:text-primary transition-colors">
                      {v.voucherNumber}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.date}</td>
                    <td className="px-4 py-3 font-sans font-medium text-foreground">
                      {v.customerName ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-sans text-[11px] text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{v.paymentMethod}</span>
                        {v.bankReference && (
                          <span className="font-mono text-[10px]">{v.bankReference}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-muted rounded-none border border-border">
                        {v.allocations.length} orders
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {formatCurrency(v.totalAmount, locale, "THB")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      {formatCurrency(v.allocatedAmount, locale, "THB")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                      {formatCurrency(v.unallocatedAmount, locale, "THB")}
                    </td>
                    <td className="px-4 py-3 text-center font-sans">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetail(v)
                        }}
                        className="h-7 px-2.5 text-xs rounded-none hover:bg-primary/10 hover:text-primary gap-1"
                      >
                        <Eye className="size-3.5" />
                        <span>View</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Detail Modal */}
      <VoucherDetailDialog
        voucher={selectedVoucher}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  )
}
