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
  const toggle = useSidebarStore((state) => state.toggle)

  const label = isCollapsed ? t("toggle.expand") : t("toggle.collapse")

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={cn(
        "size-7 rounded-full border-border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground",
        className
      )}
      onClick={toggle}
      aria-expanded={!isCollapsed}
      aria-controls="app-sidebar"
      aria-label={label}
      title={label}
    >
      {isCollapsed ? (
        <ChevronRight className="size-4" aria-hidden />
      ) : (
        <ChevronLeft className="size-4" aria-hidden />
      )}
    </Button>
  )
}
