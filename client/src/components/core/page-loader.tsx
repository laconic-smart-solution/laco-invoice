import { Suspense, type ComponentType, type JSX } from "react"

import { Loader } from "@/components/core/loader"

export function PageLoader<P extends JSX.IntrinsicAttributes>(
  Component: ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <Suspense fallback={<Loader />}>
        <Component {...props} />
      </Suspense>
    )
  }
}
