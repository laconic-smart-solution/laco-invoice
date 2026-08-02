import { useTranslation } from "react-i18next"

import { APP_SHORTCUTS } from "@/features/shortcuts/constants/app-shortcuts"
import { useIsMacPlatform } from "@/features/shortcuts/hooks/use-is-mac-platform"

export function ShortcutsPage() {
  const { t } = useTranslation("shortcuts")
  const isMac = useIsMacPlatform()

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <section className="border border-border bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {APP_SHORTCUTS.map((shortcut) => {
            const baseKeys =
              isMac && shortcut.macKeys ? shortcut.macKeys : shortcut.keys
            const keys = shortcut.chordPrefix
              ? [shortcut.chordPrefix, ...baseKeys]
              : baseKeys

            return (
              <li
                key={shortcut.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-foreground">
                  {t(shortcut.descriptionKey)}
                </p>
                <span className="inline-flex flex-wrap items-center gap-1">
                  {keys.map((key, index) => (
                    <span
                      key={`${shortcut.id}-${key}-${index}`}
                      className="inline-flex items-center gap-1"
                    >
                      {index > 0 ? (
                        <span className="text-xs text-muted-foreground" aria-hidden>
                          {shortcut.chordPrefix && index === 1
                            ? t("chord_then")
                            : "+"}
                        </span>
                      ) : null}
                      <kbd className="inline-flex min-w-7 items-center justify-center border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
                        {key}
                      </kbd>
                    </span>
                  ))}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  )
}
