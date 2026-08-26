import { createContext, useContext } from "react"

const ClassicEmbedContext = createContext(false)

export function ClassicEmbedProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClassicEmbedContext.Provider value={true}>
      {children}
    </ClassicEmbedContext.Provider>
  )
}

/** True when a feature page is rendered inside ClassicWorkspace. */
export function useIsClassicEmbed() {
  return useContext(ClassicEmbedContext)
}
