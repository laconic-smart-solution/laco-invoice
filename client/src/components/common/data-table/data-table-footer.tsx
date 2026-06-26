import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PAGE_SIZE_OPTIONS } from "@/shared/hooks/use-pagination"

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, totalPages, currentPage])

  if (currentPage > 1) {
    pages.add(currentPage - 1)
  }

  if (currentPage < totalPages) {
    pages.add(currentPage + 1)
  }

  if (currentPage <= 3) {
    pages.add(2)
    pages.add(3)
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1)
    pages.add(totalPages - 2)
  }

  return Array.from(pages).sort((a, b) => a - b)
}

interface DataTableFooterProps {
  page: number
  totalPages: number
  totalCount: number
  start: number
  end: number
  limit: number
  limitOptions?: readonly number[]
  canGoPrev: boolean
  canGoNext: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  showingLabel: (start: number, end: number, total: number) => string
  className?: string
}

export function DataTableFooter({
  page,
  totalPages,
  totalCount,
  start,
  end,
  limit,
  limitOptions = PAGE_SIZE_OPTIONS,
  canGoPrev,
  canGoNext,
  onPageChange,
  onLimitChange,
  showingLabel,
  className,
}: DataTableFooterProps) {
  const { t } = useTranslation("common")
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("pagination.rows_per_page")}</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => onLimitChange(Number.parseInt(value, 10))}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground">
          {showingLabel(start, end, totalCount)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
        >
          {t("pagination.previous")}
        </Button>

        {visiblePages.map((pageNumber, index) => {
          const prevPage = visiblePages[index - 1]
          const showEllipsis = prevPage !== undefined && pageNumber - prevPage > 1

          return (
            <span key={pageNumber} className="inline-flex items-center gap-1">
              {showEllipsis ? (
                <span className="px-1 text-xs text-muted-foreground">...</span>
              ) : null}
              <Button
                variant={pageNumber === page ? "default" : "outline"}
                size="sm"
                className="min-w-8"
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            </span>
          )
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          {t("pagination.next")}
        </Button>
      </div>
    </div>
  )
}
