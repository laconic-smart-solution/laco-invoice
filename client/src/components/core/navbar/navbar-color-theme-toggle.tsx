import { Check, Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useColorTheme } from "@/shared/hooks/use-color-theme"

const themes = [
  { value: "red" as const, label: "Laco Red", swatchClass: "bg-[#c80212]" },
  { value: "teal" as const, label: "Financial Teal", swatchClass: "bg-[#1d5147]" },
]

export function NavbarColorThemeToggle() {
  const { colorTheme, setColorTheme } = useColorTheme()
  const selectedTheme = themes.find((theme) => theme.value === colorTheme) ?? themes[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={`Color theme: ${selectedTheme.label}`}
        >
          <Palette className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setColorTheme(theme.value)}
          >
            <span className={`size-3 rounded-full ${theme.swatchClass}`} aria-hidden />
            {theme.label}
            {colorTheme === theme.value ? <Check className="ml-auto" aria-label="Selected" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
