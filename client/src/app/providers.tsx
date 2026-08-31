import { useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"

import i18n from "@/app/i18n"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { router } from "@/app/routes"
import { MockApiBanner } from "@/components/common/mock-api-banner"
import { AuthHydrate } from "@/features/auth/components/auth-hydrate"
import { queryClient } from "@/shared/queries/query-client"
import { useLocaleStore } from "@/shared/stores/locale-store"

interface AppProvidersProps {
  children?: React.ReactNode
}

function LocaleSync() {
  const locale = useLocaleStore((state) => state.locale)

  useEffect(() => {
    document.documentElement.lang = locale
    void i18n.changeLanguage(locale)
  }, [locale])

  return null
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthHydrate />
          <LocaleSync />
          <MockApiBanner />
          {children ?? <RouterProvider router={router} />}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
