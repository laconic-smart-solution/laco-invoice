import { ArrowRight, AlertTriangle, CheckCircle2, FileInput, FileOutput, Receipt } from "lucide-react"
import { useTranslation } from "react-i18next"

import { FLOW_STAGES, type FlowStageId } from "@/features/flow/data/flow-constants"
import type { FlowStageCounts } from "@/features/flow/util/flow-eligibility"
import { cn } from "@/lib/utils"

const STAGE_ICONS = {
  import: FileInput,
  match: CheckCircle2,
  voucher: Receipt,
  export: FileOutput,
} as const

interface FlowPipelineProps {
  activeStage: FlowStageId
  onStageChange: (stage: FlowStageId) => void
  counts: FlowStageCounts
}

export function FlowPipeline({
  activeStage,
  onStageChange,
  counts,
}: FlowPipelineProps) {
  const { t } = useTranslation("flow")

  const stageMeta: Record<
    FlowStageId,
    { count: number; hint: string; warn?: boolean }
  > = {
    import: { count: counts.import, hint: t("pipeline.order_sets") },
    match: {
      count: counts.match,
      hint:
        counts.matchErrors > 0
          ? t("pipeline.need_review", { count: counts.matchErrors })
          : t("pipeline.reviewed"),
      warn: counts.matchErrors > 0,
    },
    voucher: {
      count: counts.vouchers,
      hint: t("pipeline.ready_to_generate", { count: counts.voucherReady }),
    },
    export: { count: counts.export, hint: t("pipeline.ready_to_download") },
  }

  return (
    <nav aria-label={t("pipeline.label")} className="flow-pipeline">
      <ol className="flow-pipeline__list">
        {FLOW_STAGES.map((stage, index) => {
          const Icon = STAGE_ICONS[stage.id]
          const meta = stageMeta[stage.id]
          const isActive = activeStage === stage.id
          const isPassed =
            FLOW_STAGES.findIndex((item) => item.id === activeStage) > index
          return (
            <li key={stage.id} className="flow-pipeline__item">
              <button
                type="button"
                className={cn(
                  "flow-pipeline__stage",
                  isActive && "flow-pipeline__stage--active",
                  isPassed && "flow-pipeline__stage--passed"
                )}
                aria-current={isActive ? "step" : undefined}
                onClick={() => onStageChange(stage.id)}
              >
                <span className="flow-pipeline__number">
                  {isPassed ? <CheckCircle2 className="size-4" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <Icon className="size-3.5" aria-hidden />
                    {t(stage.labelKey)}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {meta.count} {meta.hint}
                  </span>
                </span>
                {meta.warn ? (
                  <AlertTriangle
                    className="size-3.5 shrink-0 text-warning"
                    aria-label={t("pipeline.needs_attention")}
                  />
                ) : null}
                <span className="sr-only">{t(stage.descriptionKey)}</span>
              </button>
              {index < FLOW_STAGES.length - 1 ? (
                <button
                  type="button"
                  className="flow-pipeline__arrow-btn"
                  aria-label={t("pipeline.go_to", {
                    stage: t(FLOW_STAGES[index + 1].labelKey),
                  })}
                  onClick={() => onStageChange(FLOW_STAGES[index + 1].id)}
                >
                  <ArrowRight className="flow-pipeline__arrow" aria-hidden />
                </button>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
