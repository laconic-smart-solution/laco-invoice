import { create } from "zustand"
import { persist } from "zustand/middleware"

import i18n, { SUPPORTED_LOCALES, type Locale } from "@/app/i18n"

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => {
        const nextLocale = isSupportedLocale(locale) ? locale : "en"
        void i18n.changeLanguage(nextLocale)
        set({ locale: nextLocale })
      },
    }),
    {
      name: "locale",
      onRehydrateStorage: () => (state) => {
        if (state && !isSupportedLocale(state.locale)) {
          state.setLocale("en")
        }
      },
    }
  )
)
