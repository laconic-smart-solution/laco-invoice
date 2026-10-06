import { useEffect, useState } from "react"

export const COLOR_THEMES = ["red", "teal", "blue", "sunset"] as const

export type ColorTheme = (typeof COLOR_THEMES)[number]

const STORAGE_KEY = "laco-color-theme"

function isColorTheme(value: string | null): value is ColorTheme {
  return COLOR_THEMES.some((theme) => theme === value)
}

export function getStoredColorTheme(): ColorTheme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isColorTheme(stored) ? stored : "red"
}

export function applyColorTheme(theme: ColorTheme) {
  document.documentElement.dataset.colorTheme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}

export function applyStoredColorTheme() {
  applyColorTheme(getStoredColorTheme())
}

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(getStoredColorTheme)

  useEffect(() => {
    applyColorTheme(colorTheme)
  }, [colorTheme])

  return { colorTheme, setColorTheme }
}
