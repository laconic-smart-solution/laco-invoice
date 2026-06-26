import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

interface SidebarUserCardProps {
  name?: string
  accountTypeKey?: string
  avatarUrl?: string | null
  className?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function SidebarUserCard({
  name = "Alex Chen",
  accountTypeKey = "user.premium_account",
  avatarUrl = null,
  className,
}: SidebarUserCardProps) {
  const { t } = useTranslation("sidebar")

  return (
    <div
      className={cn(
        "flex items-center gap-3 border border-border bg-card p-3",
        className
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="size-9 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
        >
          {getInitials(name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{t(accountTypeKey)}</p>
      </div>
    </div>
  )
}
