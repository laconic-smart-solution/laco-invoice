import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AuthFormError } from "@/features/auth/components/auth-form-error"
import { CustomerForm } from "@/features/customers/components/customer-form"
import type { CustomerFormValues } from "@/features/customers/schemas/customer-form-schema"
import { OrderDetailHeader } from "@/features/orders/components/order-detail-header"
import { OrderDetailInfo } from "@/features/orders/components/order-detail-info"
import { OrderLineItems } from "@/features/orders/components/order-line-items"
import { mapOrderDetailDtoToOrderDetail } from "@/features/orders/util/map-order"
import { ProductDetailContent } from "@/features/products/components/product-detail-content"
import { ProductDetailHeader } from "@/features/products/components/product-detail-header"
import { getEnabledMarketplaces } from "@/features/stores/config/marketplaces"
import { MarketplaceConnectionsSection } from "@/features/stores/components/marketplace-connections-section"
import {
  getAdminUserErrorMessage,
  useAdminUserDetailQuery,
} from "@/shared/queries/admin-user.query"
import {
  getCustomerErrorMessage,
  useCustomerQuery,
  useUpdateCustomerMutation,
} from "@/shared/queries/customer.query"
import { useMarketplaceProductDetailQuery } from "@/shared/queries/marketplace-product.query"
import {
  getOrderErrorMessage,
  useOrderDetailQuery,
  useTriggerOrderSyncMutation,
} from "@/shared/queries/order.query"
import {
  getStoreErrorMessage,
  useStoreQuery,
} from "@/shared/queries/store.query"
import type { ClassicDetail } from "@/shared/stores/classic-workspace-store"
import { useLocaleStore } from "@/shared/stores/locale-store"
import type { UserRole } from "@/shared/types/auth.types"
import { formatDateTime } from "@/util/format"

interface ClassicDetailSheetProps {
  detail: ClassicDetail | null
  onClose: () => void
}

export function ClassicDetailSheet({ detail, onClose }: ClassicDetailSheetProps) {
  const { t } = useTranslation("classic")
  const open = detail != null

  const titleKey =
    detail != null ? (`detail.${detail.type}` as const) : "detail.close"

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
        }
      }}
    >
      <SheetContent
        side="right"
        className={
          detail?.type === "order"
            ? "w-full gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl"
            : "w-full gap-0 overflow-y-auto sm:max-w-2xl"
        }
      >
        <SheetHeader className="shrink-0 border-b border-border pb-3">
          <SheetTitle>{t(titleKey)}</SheetTitle>
        </SheetHeader>
        <div
          className={
            detail?.type === "order"
              ? "min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4"
              : "p-4"
          }
        >
          {detail?.type === "order" ? (
            <OrderDetailBody id={detail.id} />
          ) : null}
          {detail?.type === "store" ? (
            <StoreDetailBody id={detail.id} />
          ) : null}
          {detail?.type === "product" ? (
            <ProductDetailBody id={detail.id} />
          ) : null}
          {detail?.type === "customer" ? (
            <CustomerDetailBody id={detail.id} onSaved={onClose} />
          ) : null}
          {detail?.type === "user" ? <UserDetailBody id={detail.id} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function getUserInitials(name: string | null, email: string): string {
  const source = name?.trim() || email
  return source
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function getRoleLabelKey(role: UserRole): string {
  return `table.roles.${role.toLowerCase()}`
}

function getRoleBadgeVariant(
  role: UserRole
): "default" | "secondary" | "outline" {
  if (role === "ADMIN") {
    return "default"
  }
  if (role === "OWNER") {
    return "secondary"
  }
  return "outline"
}

function UserDetailBody({ id }: { id: string }) {
  const { t } = useTranslation("users")
  const locale = useLocaleStore((state) => state.locale)
  const numericId = Number.parseInt(id, 10)
  const { data: user, isLoading, error } = useAdminUserDetailQuery(
    Number.isFinite(numericId) ? numericId : 0
  )

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">{t("detail.loading")}</p>
    )
  }

  if (error != null || !user) {
    return (
      <AuthFormError
        message={
          error
            ? getAdminUserErrorMessage(error, t("detail.not_found_description"))
            : t("detail.not_found_title")
        }
      />
    )
  }

  const displayName = user.fullName?.trim() || user.email

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="size-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getUserInitials(user.fullName, user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold">
            {displayName}
          </p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {t(getRoleLabelKey(user.role))}
        </Badge>
        <Badge
          variant="outline"
          className={
            user.active
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }
        >
          {user.active ? t("table.status.active") : t("table.status.inactive")}
        </Badge>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-muted-foreground">{t("detail.fields.joined")}</dt>
          <dd>{formatDateTime(user.createdAt, locale)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-border py-2">
          <dt className="text-muted-foreground">
            {t("detail.fields.last_updated")}
          </dt>
          <dd>{formatDateTime(user.updatedAt, locale)}</dd>
        </div>
      </dl>
    </div>
  )
}

function OrderDetailBody({ id }: { id: string }) {
  const { t } = useTranslation("orders")
  const locale = useLocaleStore((state) => state.locale)
  const numericOrderId = Number.parseInt(id, 10)

  const {
    data: orderDetail,
    isLoading,
    isError,
    error,
  } = useOrderDetailQuery(Number.isFinite(numericOrderId) ? numericOrderId : null)
  const syncMutation = useTriggerOrderSyncMutation()

  const order = useMemo(
    () => (orderDetail ? mapOrderDetailDtoToOrderDetail(orderDetail) : null),
    [orderDetail]
  )

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">{t("detail.loading")}</p>
    )
  }

  if (!order) {
    return (
      <AuthFormError
        message={
          isError && error
            ? getOrderErrorMessage(error, t("errors.load_failed"))
            : t("detail.not_found_title")
        }
      />
    )
  }

  return (
    <div className="min-w-0 space-y-4">
      <OrderDetailHeader
        order={order}
        locale={locale}
        variant="sheet"
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
      />
      <OrderDetailInfo order={order} locale={locale} variant="sheet" />
      <OrderLineItems order={order} variant="sheet" />
    </div>
  )
}

function StoreDetailBody({ id }: { id: string }) {
  const { t } = useTranslation("stores")
  const parsedStoreId = Number(id)
  const enabledMarketplaces = getEnabledMarketplaces()
  const { data: store, isLoading, isError, error } = useStoreQuery(parsedStoreId)

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">{t("table.loading")}</p>
    )
  }

  if (!store) {
    return (
      <AuthFormError
        message={
          isError && error
            ? getStoreErrorMessage(error, t("errors.load_failed"))
            : t("errors.load_failed")
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-heading text-base font-semibold">{store.name}</p>
        <Badge variant={store.active ? "secondary" : "destructive"}>
          {store.active
            ? t("table.status.active")
            : t("table.status.inactive")}
        </Badge>
      </div>
      {parsedStoreId > 0
        ? enabledMarketplaces.map((marketplace) => (
            <MarketplaceConnectionsSection
              key={marketplace.code}
              storeId={parsedStoreId}
              marketplace={marketplace}
            />
          ))
        : null}
    </div>
  )
}

function ProductDetailBody({ id }: { id: string }) {
  const { t } = useTranslation("products")
  const locale = useLocaleStore((state) => state.locale)
  const productId = Number(id)
  const { data: product, isLoading, isError } =
    useMarketplaceProductDetailQuery(productId)

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">{t("detail.loading")}</p>
    )
  }

  if (!product || isError) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("detail.not_found_title")}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <ProductDetailHeader product={product} locale={locale} />
      <ProductDetailContent product={product} locale={locale} />
    </div>
  )
}

function CustomerDetailBody({
  id,
  onSaved,
}: {
  id: string
  onSaved: () => void
}) {
  const { t } = useTranslation("customers")
  const customerId = Number(id)
  const { data: customer, isLoading, isError, error } =
    useCustomerQuery(customerId)
  const updateMutation = useUpdateCustomerMutation()
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (values: CustomerFormValues) => {
    setFormError(null)
    try {
      await updateMutation.mutateAsync({ id: customerId, payload: values })
      onSaved()
    } catch (err: unknown) {
      setFormError(getCustomerErrorMessage(err, t("errors.save_failed")))
    }
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">{t("table.loading")}</p>
    )
  }

  if (!customer) {
    return (
      <AuthFormError
        message={
          isError && error
            ? getCustomerErrorMessage(error, t("errors.load_failed"))
            : t("errors.load_failed")
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <AuthFormError message={formError} />
      <CustomerForm
        formId="classic-customer-edit-form"
        defaultValues={{
          name: customer.name,
          email: customer.email ?? "",
          phone: customer.phone ?? "",
          gender: customer.gender ?? "",
          address: customer.address ?? "",
        }}
        onSubmit={handleSubmit}
      />
      <Button
        type="submit"
        form="classic-customer-edit-form"
        disabled={updateMutation.isPending}
      >
        {t("form.submit_update")}
      </Button>
    </div>
  )
}
