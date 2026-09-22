import { useState, type ReactNode } from "react"
import { CheckCircle2, Circle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  canGenerateFlowVoucher,
  flowGenerateRequirements,
} from "@/features/flow/util/flow-eligibility"
import { useFlowWindowsStore } from "@/features/flow/hooks/use-flow-windows"
import { cn } from "@/lib/utils"
import type { ApiOrderInputRunDto } from "@/shared/services/order-input-run.service"

interface FlowGenerateBlockedDialogProps {
  run: ApiOrderInputRunDto
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FlowGenerateBlockedDialog({
  run,
  open,
  onOpenChange,
}: FlowGenerateBlockedDialogProps) {
  const { t } = useTranslation("flow")
  const openOrderSet = useFlowWindowsStore((state) => state.openOrderSet)
  const requirements = flowGenerateRequirements(run)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showMaximizeButton={false}
        className="z-[1200] sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{t("blocked.title")}</DialogTitle>
          <DialogDescription>{t("blocked.description")}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          {requirements.map((requirement) => (
            <li
              key={requirement.id}
              className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {requirement.passed ? (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-success"
                  aria-hidden
                />
              ) : (
                <Circle
                  className="mt-0.5 size-4 shrink-0 text-warning"
                  aria-hidden
                />
              )}
              <span className={requirement.passed ? "text-muted-foreground" : ""}>
                {t(`blocked.${requirement.id}`)}
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("blocked.close")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false)
              openOrderSet(
                run.id,
                t("window.order_set", { id: run.id, title: run.title })
              )
            }}
          >
            {t("blocked.open_detail")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface FlowGenerateVoucherButtonProps {
  run: ApiOrderInputRunDto
  variant?: "default" | "outline"
  size?: "default" | "sm"
  className?: string
  children: ReactNode
}

export function FlowGenerateVoucherButton({
  run,
  variant = "default",
  size = "default",
  className,
  children,
}: FlowGenerateVoucherButtonProps) {
  const { t } = useTranslation("flow")
  const openGenerateVoucher = useFlowWindowsStore(
    (state) => state.openGenerateVoucher
  )
  const [whyOpen, setWhyOpen] = useState(false)
  const canGenerate = canGenerateFlowVoucher(run)

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(canGenerate ? className : cn("cursor-help opacity-50", className))}
        aria-disabled={!canGenerate}
        onClick={() => {
          if (!canGenerate) {
            setWhyOpen(true)
            return
          }
          openGenerateVoucher(run.id, t("window.generate", { id: run.id }))
        }}
      >
        {children}
      </Button>
      <FlowGenerateBlockedDialog
        run={run}
        open={whyOpen}
        onOpenChange={setWhyOpen}
      />
    </>
  )
}

export function useFlowGenerateGate(run: ApiOrderInputRunDto | null) {
  const { t } = useTranslation("flow")
  const openGenerateVoucher = useFlowWindowsStore(
    (state) => state.openGenerateVoucher
  )
  const [whyOpen, setWhyOpen] = useState(false)
  const canGenerate = run ? canGenerateFlowVoucher(run) : false

  const tryGenerate = () => {
    if (!run) return
    if (!canGenerate) {
      setWhyOpen(true)
      return
    }
    openGenerateVoucher(run.id, t("window.generate", { id: run.id }))
  }

  return { canGenerate, whyOpen, setWhyOpen, tryGenerate }
}
