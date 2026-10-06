import { Check, Palette } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  COLOR_THEMES,
  type ColorTheme,
  useColorTheme,
} from "@/shared/hooks/use-color-theme"

const THEME_SWATCH_CLASS: Record<ColorTheme, string> = {
  red: "theme-swatch-red",
  teal: "theme-swatch-teal",
  blue: "theme-swatch-blue",
  sunset: "theme-swatch-sunset",
}

interface NavbarColorThemeToggleProps {
  className?: string
}

export function NavbarColorThemeToggle({
  className = "text-muted-foreground",
}: NavbarColorThemeToggleProps) {
  const { t } = useTranslation("navbar")
  const { colorTheme, setColorTheme } = useColorTheme()
  const selectedLabel = t(`color_themes.${colorTheme}`)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={className}
          aria-label={t("color_theme", { name: selectedLabel })}
        >
          <Palette className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[300] w-48">
        {COLOR_THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme}
            onClick={() => setColorTheme(theme)}
          >
            <span
              className={`size-3 rounded-full ${THEME_SWATCH_CLASS[theme]}`}
              aria-hidden
            />
            {t(`color_themes.${theme}`)}
            {colorTheme === theme ? (
              <Check className="ml-auto" aria-label={t("color_theme_selected")} />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
