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
import { useLocaleStore } from "@/shared/stores/locale-store"
import { formatCurrency } from "@/util/format"

interface OrderLineItemsProps {
  order: OrderDetail
}

export function OrderLineItems({ order }: OrderLineItemsProps) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)

  return (
    <section className="border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-heading text-sm font-semibold">
          {t("detail.sections.line_items")}
        </h2>
      </div>

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
                <TableCell className="px-4 py-3.5 text-sm font-medium">
                  {item.name}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
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

      <div className="border-t border-border px-5 py-4">
        <dl className="ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("detail.summary.subtotal")}</dt>
            <dd>{formatCurrency(order.subtotal, locale, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("detail.summary.shipping")}</dt>
            <dd>
              {order.shipping === 0
                ? t("detail.summary.free")
                : formatCurrency(order.shipping, locale, order.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("detail.summary.ex_vat")}</dt>
            <dd>{formatCurrency(order.amountExVat, locale, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("detail.summary.vat")}</dt>
            <dd>{formatCurrency(order.vatAmount, locale, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
            <dt>{t("detail.summary.total")}</dt>
            <dd>{formatCurrency(order.totalAmount, locale, order.currency)}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
