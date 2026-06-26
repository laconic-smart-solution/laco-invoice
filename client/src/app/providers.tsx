import { useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"

import i18n from "@/app/i18n"
import { ThemeProvider } from "@/components/theme-provider"
import { router } from "@/app/routes"
import { queryClient } from "@/shared/queries/query-client"
import { useLocaleStore } from "@/shared/stores/locale-store"

interface AppProvidersProps {
  children?: React.ReactNode
}

function LocaleSync() {
  const locale = useLocaleStore((state) => state.locale)

  useEffect(() => {
    void i18n.changeLanguage(locale)
  }, [locale])

  return null
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocaleSync />
        {children ?? <RouterProvider router={router} />}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
