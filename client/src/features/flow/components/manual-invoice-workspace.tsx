import { useCallback, useEffect, useState } from "react"
import { Check, ChevronRight, FileText, PanelRightClose, ReceiptText } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { FlowCommandBar } from "@/features/flow/components/flow-command-bar"
import { FlowInspectorRail } from "@/features/flow/components/flow-inspector-rail"
import { ManualInvoiceQueue } from "@/features/flow/components/manual-invoice-queue"
import { ManualInvoiceQueueRail } from "@/features/flow/components/manual-invoice-queue-rail"
import { ManualInvoiceStageWorkspace } from "@/features/flow/components/manual-invoice-stage-workspace"
import { MANUAL_INVOICE_STAGES } from "@/features/flow/data/flow-constants"
import {
  useManualInvoiceWorkspace,
} from "@/features/flow/hooks/use-manual-invoice-workspace"
import { isEditableKeyboardTarget } from "@/features/flow/util/flow-shortcut"
import { manualInvoiceBlockers } from "@/features/flow/util/manual-invoice"
import { cn } from "@/lib/utils"
import "@/features/flow/styles/flow-workspace.css"

function formatMoney(value: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

export function ManualInvoiceWorkspace() {
  const { t, i18n } = useTranslation("flow")
  const workspace = useManualInvoiceWorkspace()
  const [isCompact, setIsCompact] = useState(false)
  const [showQueue, setShowQueue] = useState(true)
  const [showInspector, setShowInspector] = useState(true)
  const [showStats, setShowStats] = useState(true)
  const activeIndex = MANUAL_INVOICE_STAGES.indexOf(workspace.stage)
  const progress = ((activeIndex + 1) / MANUAL_INVOICE_STAGES.length) * 100
  const blockers = manualInvoiceBlockers(
    workspace.selectedInvoice,
    workspace.vouchers,
    workspace.stage
  )
  const stats = [
    ["draft", workspace.counts.draft],
    ["ready", workspace.counts.ready],
    ["issued", workspace.counts.issued],
    ["voucher", workspace.counts.voucher],
    ["export", workspace.counts.exportReady],
  ] as const

  const revealQueueSearch = useCallback(() => {
    setShowQueue(true)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLInputElement>('[data-shortcut-search="manual"]')
          ?.focus()
      })
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) {
        return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        if (document.getElementById("flow-panel-manual")?.hidden) {
          return
        }
        event.preventDefault()
        revealQueueSearch()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [revealQueueSearch])

  return (
    <div
      className={cn(
        "flow-workspace flow-workspace--tabbed",
        isCompact && "flow-workspace--compact"
      )}
    >
      <FlowCommandBar
        title={t("tabs.manual")}
        subtitle={t("manual.command_subtitle")}
        searchAriaLabel={t("manual.search_aria")}
        primaryActionLabel={t("manual.new_invoice")}
        onSearch={revealQueueSearch}
        onPrimaryAction={workspace.beginNewInvoice}
        isCompact={isCompact}
        showQueue={showQueue}
        showInspector={showInspector}
        showStats={showStats}
        onCompactChange={setIsCompact}
        onShowQueueChange={setShowQueue}
        onShowInspectorChange={setShowInspector}
        onShowStatsChange={setShowStats}
        onResetLayout={() => {
          workspace.setSearch("")
          workspace.setFilter("all")
          workspace.setStage("draft")
          setShowQueue(true)
          setShowInspector(true)
          setShowStats(true)
          setIsCompact(false)
        }}
      />
      {showStats ? (
      <section
        className="grid grid-cols-2 gap-2 border-b border-border bg-card px-4 py-2 sm:grid-cols-3 xl:grid-cols-7"
        aria-label={t("manual.stats.label")}
      >
        {stats.map(([key, value]) => (
          <article
            key={key}
            className="rounded-lg border border-border bg-background px-3 py-2"
          >
            <span className="block text-xs text-muted-foreground">
              {t(`manual.stats.${key}`)}
            </span>
            <strong className="text-lg">{value}</strong>
          </article>
        ))}
        <article className="rounded-lg border border-border bg-background px-3 py-2">
          <span className="block text-xs text-muted-foreground">
            {t("manual.stats.invoice_value")}
          </span>
          <strong className="text-sm">
            {formatMoney(
              workspace.counts.invoiceValue,
              workspace.counts.currency,
              i18n.language
            )}
          </strong>
        </article>
        <article className="rounded-lg border border-border bg-background px-3 py-2">
          <span className="block text-xs text-muted-foreground">
            {t("manual.stats.outstanding")}
          </span>
          <strong className="text-sm">
            {formatMoney(
              workspace.counts.outstandingValue,
              workspace.counts.currency,
              i18n.language
            )}
          </strong>
        </article>
      </section>
      ) : null}

      <nav className="flow-pipeline" aria-label={t("manual.pipeline.label")}>
        <ol className="flow-pipeline__list">
          {MANUAL_INVOICE_STAGES.map((stage, index) => (
            <li key={stage} className="flow-pipeline__item">
              <button
                type="button"
                className={cn(
                  "flow-pipeline__stage",
                  stage === workspace.stage && "flow-pipeline__stage--active",
                  index < activeIndex && "flow-pipeline__stage--passed"
                )}
                aria-current={stage === workspace.stage ? "step" : undefined}
                onClick={() => workspace.setStage(stage)}
              >
                <span className="flow-pipeline__number">
                  {index < activeIndex ? <Check className="size-4" /> : index + 1}
                </span>
                <span>
                  <strong className="block text-xs">
                    {t(`manual.pipeline.${stage}`)}
                  </strong>
                  <small className="text-[10px] text-muted-foreground">
                    {t(`manual.pipeline.${stage}_short`)}
                  </small>
                </span>
              </button>
              {index < MANUAL_INVOICE_STAGES.length - 1 ? (
                <ChevronRight className="flow-pipeline__arrow" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      <div
        className={cn(
          "flow-workspace__body",
          !showQueue && "flow-workspace__body--no-queue",
          !showInspector && "flow-workspace__body--no-inspector"
        )}
      >
        {showQueue ? (
        <ManualInvoiceQueue
          invoices={workspace.invoices}
          totalCount={workspace.counts.total}
          alertCount={workspace.counts.draft}
          selectedId={workspace.selectedInvoiceId}
          search={workspace.search}
          filter={workspace.filter}
          isLoading={workspace.isLoading}
          isFetching={workspace.isFetching}
          onSearchChange={workspace.setSearch}
          onFilterChange={workspace.setFilter}
          onSelect={workspace.selectInvoice}
          onHide={() => setShowQueue(false)}
        />
        ) : (
          <ManualInvoiceQueueRail
            invoices={workspace.invoices}
            selectedId={workspace.selectedInvoiceId}
            alertCount={workspace.counts.draft}
            onSelect={workspace.selectInvoice}
            onExpand={() => setShowQueue(true)}
          />
        )}
        <ManualInvoiceStageWorkspace
          stage={workspace.stage}
          invoice={workspace.selectedInvoice}
          vouchers={workspace.vouchers}
          onStageChange={workspace.setStage}
          onSaved={(invoiceId) => {
            workspace.selectInvoice(invoiceId)
            workspace.setStage("review")
            void workspace.refetch()
          }}
          onRefresh={() => void workspace.refetch()}
        />
        {showInspector ? (
        <aside className="flow-inspector" aria-label={t("manual.inspector.label")}>
          <section className="flow-inspector__section">
            <div className="flex items-center justify-between gap-2">
              <h2>{t("manual.inspector.progress")}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg"
                aria-label={t("hide_inspector")}
                title={t("hide_inspector")}
                onClick={() => setShowInspector(false)}
              >
                <PanelRightClose className="size-4" />
              </Button>
            </div>
            <div
              className="flow-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <ul className="flow-checklist">
              {MANUAL_INVOICE_STAGES.map((stage, index) => (
                <li
                  key={stage}
                  className={cn(index <= activeIndex && "flow-checklist__done")}
                >
                  {index <= activeIndex ? (
                    <Check aria-hidden />
                  ) : (
                    <span className="size-3 rounded-full border border-border" />
                  )}
                  {t(`manual.pipeline.${stage}`)}
                </li>
              ))}
            </ul>
          </section>
          <section className="flow-inspector__section">
            <h2>{t("manual.inspector.next")}</h2>
            {blockers.length ? (
              <ul className="mt-2 space-y-1 text-xs text-destructive">
                {blockers.map((blocker) => (
                  <li key={blocker}>{t(`manual.blockers.${blocker}`)}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {t(`manual.inspector.next_${workspace.stage}`)}
              </p>
            )}
          </section>
          <section className="flow-inspector__section">
            <h2>{t("manual.inspector.selected")}</h2>
            {workspace.selectedInvoice ? (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <FileText className="size-4 text-primary" />
                  <div>
                    <strong>{workspace.selectedInvoice.title}</strong>
                    <p className="text-muted-foreground">
                      {workspace.selectedInvoice.invoiceNumber}
                    </p>
                    <p className="mt-1 font-mono">
                      {formatMoney(
                        Number(workspace.selectedInvoice.grandTotal),
                        workspace.selectedInvoice.currency,
                        i18n.language
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ReceiptText className="size-4 text-primary" />
                  <p>
                    {t("manual.inspector.vouchers", {
                      count: workspace.vouchers.length,
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("manual.inspector.new_invoice")}
              </p>
            )}
          </section>
        </aside>
        ) : (
          <FlowInspectorRail onExpand={() => setShowInspector(true)} />
        )}
      </div>
    </div>
  )
}
