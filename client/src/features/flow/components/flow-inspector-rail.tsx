import { PanelRight } from "lucide-react"
import { useTranslation } from "react-i18next"

interface FlowInspectorRailProps {
  onExpand: () => void
}

export function FlowInspectorRail({ onExpand }: FlowInspectorRailProps) {
  const { t } = useTranslation("flow")

  return (
    <aside className="flow-inspector-rail" aria-label={t("inspector.label")}>
      <button
        type="button"
        className="flow-inspector-rail__expand"
        aria-label={t("show_inspector")}
        title={t("show_inspector")}
        onClick={onExpand}
      >
        <PanelRight className="size-4" aria-hidden />
      </button>
    </aside>
  )
}
