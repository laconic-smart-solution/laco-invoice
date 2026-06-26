import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SUPPORTED_LOCALES, type Locale } from "@/app/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocaleStore } from "@/shared/stores/locale-store"

const LOCALE_LABEL_KEYS: Record<Locale, string> = {
  en: "locales.en",
  th: "locales.th",
  zh: "locales.zh",
}

export function NavbarLanguageToggle() {
  const { t } = useTranslation("navbar")
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger
        size="sm"
        className="h-9 w-auto gap-1.5 border-border bg-muted/40 px-2.5 text-muted-foreground"
        aria-label={t("language")}
      >
        <Globe className="size-4 shrink-0" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LOCALES.map((code) => (
          <SelectItem key={code} value={code}>
            {t(LOCALE_LABEL_KEYS[code])}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
