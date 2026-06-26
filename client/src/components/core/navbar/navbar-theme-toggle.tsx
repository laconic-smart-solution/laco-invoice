import { Moon, Sun } from "lucide-react"
import { useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

function subscribeToDarkMode(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  mediaQuery.addEventListener("change", onStoreChange)

  return () => {
    observer.disconnect()
    mediaQuery.removeEventListener("change", onStoreChange)
  }
}

function getIsDarkSnapshot() {
  return document.documentElement.classList.contains("dark")
}

function getIsDarkServerSnapshot() {
  return false
}

export function NavbarThemeToggle() {
  const { t } = useTranslation("navbar")
  const { setTheme } = useTheme()
  const isDark = useSyncExternalStore(
    subscribeToDarkMode,
    getIsDarkSnapshot,
    getIsDarkServerSnapshot
  )

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground"
      onClick={handleToggle}
      aria-label={isDark ? t("theme_light") : t("theme_dark")}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  )
}
