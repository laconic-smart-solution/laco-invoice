import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataTablePaginationProps {
  totalCount: number
  start: number
  end: number
  canGoPrev: boolean
  canGoNext: boolean
  onPrevPage: () => void
  onNextPage: () => void
  showingLabel: (start: number, end: number, total: number) => string
  className?: string
}

export function DataTablePagination({
  totalCount,
  start,
  end,
  canGoPrev,
  canGoNext,
  onPrevPage,
  onNextPage,
  showingLabel,
  className,
}: DataTablePaginationProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-b border-border bg-card px-4 py-3",
        className
      )}
    >
      <span className="mr-auto text-xs text-muted-foreground sm:mr-0">
        {showingLabel(start, end, totalCount)}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onPrevPage}
        disabled={!canGoPrev}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onNextPage}
        disabled={!canGoNext}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
