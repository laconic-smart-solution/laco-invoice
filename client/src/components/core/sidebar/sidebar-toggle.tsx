import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/shared/stores/sidebar-store"

interface SidebarToggleProps {
  className?: string
}

export function SidebarToggle({ className }: SidebarToggleProps) {
  const { t } = useTranslation("sidebar")
  const isCollapsed = useSidebarStore((state) => state.isCollapsed)

  const label = isCollapsed ? t("toggle.expand") : t("toggle.collapse")

  const handleToggle = () => {
    useSidebarStore.getState().toggle()
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(
        "size-10 rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted hover:text-foreground dark:bg-background dark:hover:bg-card",
        className
      )}
      onClick={handleToggle}
      aria-expanded={!isCollapsed}
      aria-controls="app-sidebar"
      aria-label={label}
      title={label}
    >
      {isCollapsed ? (
        <ChevronRight className="size-5" aria-hidden />
      ) : (
        <ChevronLeft className="size-5" aria-hidden />
      )}
    </Button>
  )
}
