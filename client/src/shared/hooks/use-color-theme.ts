import { useEffect, useState } from "react"

export type ColorTheme = "red" | "teal"

const STORAGE_KEY = "laco-color-theme"

function getStoredColorTheme(): ColorTheme {
  return localStorage.getItem(STORAGE_KEY) === "teal" ? "teal" : "red"
}

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(getStoredColorTheme)

  useEffect(() => {
    document.documentElement.dataset.colorTheme = colorTheme
    localStorage.setItem(STORAGE_KEY, colorTheme)
  }, [colorTheme])

  return { colorTheme, setColorTheme }
}
