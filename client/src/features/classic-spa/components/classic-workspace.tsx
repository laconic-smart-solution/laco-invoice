import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ClassicEmbedProvider } from "@/features/classic-spa/classic-embed-context"
import { ClassicDetailSheet } from "@/features/classic-spa/components/classic-detail-sheet"
import { ClassicOverviewPanel } from "@/features/classic-spa/components/classic-overview-panel"
import type { ClassicRouteMatch } from "@/features/classic-spa/util/classic-route"
import { classicPanelPath } from "@/features/classic-spa/util/classic-route"
import { CustomersPage } from "@/features/customers/pages/customers-page"
import { InvoicesPage } from "@/features/invoices/pages/invoices-page"
import { OrdersPage } from "@/features/orders/pages/orders-page"
import { ProductsPage } from "@/features/products/pages/products-page"
import { CreateStoreDialog } from "@/features/stores/components/create-store-dialog"
import { StoresPage } from "@/features/stores/pages/stores-page"
import { UsersPage } from "@/features/users/pages/users-page"
import { useClassicWorkspaceStore } from "@/shared/stores/classic-workspace-store"

interface ClassicWorkspaceProps {
  route: ClassicRouteMatch
}

export function ClassicWorkspace({ route }: ClassicWorkspaceProps) {
  const { t } = useTranslation("classic")
  const navigate = useNavigate()
  const syncFromRoute = useClassicWorkspaceStore((state) => state.syncFromRoute)
  const setSetup = useClassicWorkspaceStore((state) => state.setSetup)

  useEffect(() => {
    syncFromRoute({
      panel: route.panel,
      detail: route.detail,
      setup: route.setup,
    })
  }, [route.detail, route.panel, route.setup, syncFromRoute])

  const closeDetail = () => {
    void navigate(classicPanelPath(route.panel), { replace: true })
  }

  const openStoreSetup = () => {
    setSetup("store")
    void navigate("/stores/new", { replace: true })
  }

  const closeStoreSetup = (open: boolean) => {
    if (open) {
      return
    }
    setSetup(null)
    void navigate(classicPanelPath(route.panel === "overview" ? "stores" : route.panel), {
      replace: true,
    })
  }

  const showSetupStore =
    route.panel === "orders" ||
    route.panel === "stores" ||
    route.panel === "overview"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-1.5">
        <h2 className="mr-auto text-xs font-semibold tracking-wide text-foreground uppercase">
          {t(`panels.${route.panel}`)}
        </h2>
        {showSetupStore ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={openStoreSetup}
          >
            {t("toolbar.setup_store")}
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {route.panel === "overview" ? (
          <ClassicOverviewPanel />
        ) : (
          <ClassicEmbedProvider>
            <div className="classic-embed [&_.space-y-6]:space-y-3 [&>div]:p-3">
              {route.panel === "orders" ? <OrdersPage /> : null}
              {route.panel === "products" ? <ProductsPage /> : null}
              {route.panel === "stores" ? <StoresPage /> : null}
              {route.panel === "invoices" ? <InvoicesPage /> : null}
              {route.panel === "customers" ? <CustomersPage /> : null}
              {route.panel === "users" ? <UsersPage /> : null}
            </div>
          </ClassicEmbedProvider>
        )}
      </div>

      <ClassicDetailSheet detail={route.detail} onClose={closeDetail} />
      <CreateStoreDialog
        open={route.setup === "store"}
        onOpenChange={closeStoreSetup}
        onCreated={() => {
          void navigate(classicPanelPath("stores"), { replace: true })
        }}
      />
    </div>
  )
}
