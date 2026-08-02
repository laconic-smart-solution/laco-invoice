import { useTranslation } from "react-i18next"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { OrderDetail } from "@/features/orders/types/order"
import { cn } from "@/lib/utils"
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency } from "@/util/format"

interface OrderLineItemsProps {
  order: OrderDetail
  variant?: "page" | "sheet"
}

export function OrderLineItems({
  order,
  variant = "page",
}: OrderLineItemsProps) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)
  const isSheet = variant === "sheet"

  return (
    <section
      className={cn(
        "min-w-0 border border-border bg-card shadow-sm",
        isSheet && "shadow-none"
      )}
    >
      <div
        className={cn(
          "border-b border-border",
          isSheet ? "px-3 py-3" : "px-5 py-4"
        )}
      >
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sections.line_items")}
        </h2>
      </div>

      {isSheet ? (
        <ul className="divide-y divide-border">
          {order.lineItems.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted-foreground">—</li>
          ) : (
            order.lineItems.map((item) => {
              const lineTotal = item.quantity * item.unitPrice
              return (
                <li key={item.id} className="min-w-0 space-y-2 px-3 py-3">
                  <p className="text-sm font-medium break-words whitespace-normal">
                    {item.name}
                  </p>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="min-w-0 break-all">
                      {t("detail.line_items.sku")}: {item.sku || "—"}
                    </span>
                    <span className="shrink-0">
                      {t("detail.line_items.qty")} {item.quantity} ·{" "}
                      {formatCurrency(item.unitPrice, locale, order.currency)}
                    </span>
                  </div>
                  <p className="text-right text-sm font-semibold">
                    {formatCurrency(lineTotal, locale, order.currency)}
                  </p>
                </li>
              )
            })
          )}
        </ul>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("detail.line_items.product")}
              </TableHead>
              <TableHead className="h-11 bg-muted/40 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("detail.line_items.sku")}
              </TableHead>
              <TableHead className="h-11 bg-muted/40 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("detail.line_items.qty")}
              </TableHead>
              <TableHead className="h-11 bg-muted/40 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("detail.line_items.unit_price")}
              </TableHead>
              <TableHead className="h-11 bg-muted/40 px-4 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("detail.line_items.total")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lineItems.map((item) => {
              const lineTotal = item.quantity * item.unitPrice

              return (
                <TableRow key={item.id} className="border-b border-border/80">
                  <TableCell className="max-w-md px-4 py-3.5 text-sm font-medium whitespace-normal break-words">
                    {item.name}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-sm text-muted-foreground whitespace-normal break-all">
                    {item.sku}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right text-sm">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right text-sm">
                    {formatCurrency(item.unitPrice, locale, order.currency)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right text-sm font-medium">
                    {formatCurrency(lineTotal, locale, order.currency)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <div
        className={cn(
          "border-t border-border",
          isSheet ? "px-3 py-3" : "px-5 py-4"
        )}
      >
        <dl className="ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("detail.summary.subtotal")}
            </dt>
            <dd>{formatCurrency(order.subtotal, locale, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("detail.summary.shipping")}
            </dt>
            <dd>
              {order.shipping === 0
                ? t("detail.summary.free")
                : formatCurrency(order.shipping, locale, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("detail.summary.ex_vat")}
            </dt>
            <dd>
              {formatCurrency(order.amountExVat, locale, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("detail.summary.vat")}</dt>
            <dd>
              {formatCurrency(order.vatAmount, locale, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
            <dt>{t("detail.summary.total")}</dt>
            <dd>
              {formatCurrency(order.totalAmount, locale, order.currency)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
