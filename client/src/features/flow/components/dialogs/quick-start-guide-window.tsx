import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSearch,
  FileUp,
  Receipt,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import type { FlowStageId } from "@/features/flow/data/flow-constants"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"

interface QuickStartGuideWindowProps {
  onStageChange: (stage: FlowStageId) => void
}

const GUIDE_STEPS: {
  stage: FlowStageId
  titleKey: string
  descriptionKey: string
  icon: typeof FileUp
}[] = [
  {
    stage: "import",
    titleKey: "guide.import_title",
    descriptionKey: "guide.import_description",
    icon: FileUp,
  },
  {
    stage: "match",
    titleKey: "guide.match_title",
    descriptionKey: "guide.match_description",
    icon: FileSearch,
  },
  {
    stage: "voucher",
    titleKey: "guide.voucher_title",
    descriptionKey: "guide.voucher_description",
    icon: Receipt,
  },
  {
    stage: "export",
    titleKey: "guide.export_title",
    descriptionKey: "guide.export_description",
    icon: Download,
  },
]

export function QuickStartGuideWindow({
  onStageChange,
}: QuickStartGuideWindowProps) {
  const { t } = useTranslation("flow")
  const close = useFlowWindowsStore((state) => state.close)
  const openNewInput = useFlowWindowsStore((state) => state.openNewInput)

  const goToStage = (stage: FlowStageId) => {
    onStageChange(stage)
    close("quick-start")
  }

  return (
    <div className="space-y-5">
      <header>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
          <CheckCircle2 className="size-3.5" aria-hidden />
          {t("guide.badge")}
        </span>
        <h3 className="mt-3 font-heading text-xl font-semibold text-foreground">
          {t("guide.title")}
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("guide.intro")}
        </p>
      </header>

      <ol className="grid gap-3 sm:grid-cols-2" aria-label={t("guide.steps")}>
        {GUIDE_STEPS.map((step, index) => {
          const Icon = step.icon
          const title = t(step.titleKey)
          return (
            <li
              key={step.stage}
              className="rounded-xl border border-border bg-muted/20 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {t("guide.step", { number: index + 1 })}
                  </p>
                  <h4 className="mt-0.5 text-sm font-semibold text-foreground">
                    {title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(step.descriptionKey)}
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto rounded-lg px-0 text-xs"
                    onClick={() => goToStage(step.stage)}
                    aria-label={t("guide.open_step", {
                      number: index + 1,
                      title,
                    })}
                  >
                    {t("guide.open_label", { title })}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <section
        className="rounded-xl border border-border bg-card p-4"
        aria-labelledby="guide-shortcuts-heading"
      >
        <h4 id="guide-shortcuts-heading" className="text-sm font-semibold">
          {t("guide.shortcuts")}
        </h4>
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <dt>{t("guide.search_queue")}</dt>
            <dd>
              <kbd>Ctrl K</kbd>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <dt>{t("guide.cycle")}</dt>
            <dd>
              <kbd>Ctrl `</kbd>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <dt>{t("guide.close")}</dt>
            <dd>
              <kbd>Esc</kbd>
            </dd>
          </div>
        </dl>
      </section>

      <footer className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          onClick={() => close("quick-start")}
        >
          {t("guide.close_guide")}
        </Button>
        <Button
          type="button"
          className="rounded-lg"
          onClick={() => {
            close("quick-start")
            openNewInput(t("window.new_input"))
          }}
        >
          <FileUp className="size-4" />
          {t("guide.create_first")}
        </Button>
      </footer>
    </div>
  )
}
