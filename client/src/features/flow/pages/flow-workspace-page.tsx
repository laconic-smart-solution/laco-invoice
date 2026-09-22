import { FlowDesktopShell } from "@/features/flow/components/flow-desktop-shell"

/**
 * UI-only Order → Voucher flow workspace prototype.
 * Route: /app/flow — full-bleed, outside DashboardLayout.
 * i18n and real APIs land when this pattern is ported into production pages.
 */
export function FlowWorkspacePage() {
  return <FlowDesktopShell />
}
