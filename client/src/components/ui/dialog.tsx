import * as React from "react"
import { useTranslation } from "react-i18next"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTopLayerDismissGuard } from "@/shared/hooks/use-top-layer-dismiss-guard"
import { isDialogNestedLayer } from "@/shared/utils/dialog-nested-layer"
import { CopyIcon, SquareIcon, XIcon } from "lucide-react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  showMaximizeButton = true,
  ref,
  onPointerDownOutside,
  onFocusOutside,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  showMaximizeButton?: boolean
}) {
  const { t } = useTranslation("common")
  const [isMaximized, setIsMaximized] = React.useState(false)
  const { layerRef, guardPointerDownOutside } =
    useTopLayerDismissGuard<HTMLDivElement>()

  const setContentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      layerRef.current = node

      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [layerRef, ref]
  )

  const showWindowControls = showMaximizeButton || showCloseButton

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-maximized={isMaximized ? "true" : "false"}
        ref={setContentRef}
        onPointerDownOutside={(event) => {
          if (isDialogNestedLayer(event.target)) {
            event.preventDefault()
          }
          onPointerDownOutside?.(event)
          if (!event.defaultPrevented) {
            guardPointerDownOutside(event)
          }
        }}
        onFocusOutside={(event) => {
          if (isDialogNestedLayer(event.target)) {
            event.preventDefault()
          }
          onFocusOutside?.(event)
        }}
        onInteractOutside={(event) => {
          if (isDialogNestedLayer(event.target)) {
            event.preventDefault()
          }
          onInteractOutside?.(event)
        }}
        className={cn(
          "group/dialog fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-none bg-popover p-4 text-xs/relaxed text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
          isMaximized &&
            "top-0 left-0 flex h-dvh w-dvw max-h-dvh max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden sm:max-w-none [&>form]:h-full [&>form]:max-h-full [&>form]:min-h-0"
        )}
        {...props}
      >
        {children}
        {showWindowControls ? (
          <div className="absolute top-2 right-2 z-20 flex items-center">
            {showMaximizeButton ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label={
                  isMaximized ? t("dialog.restore") : t("dialog.maximize")
                }
                onClick={() => setIsMaximized((current) => !current)}
              >
                {isMaximized ? <CopyIcon /> : <SquareIcon />}
                <span className="sr-only">
                  {isMaximized ? t("dialog.restore") : t("dialog.maximize")}
                </span>
              </Button>
            ) : null}
            {showCloseButton ? (
              <DialogPrimitive.Close data-slot="dialog-close" asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground"
                  size="icon-sm"
                >
                  <XIcon />
                  <span className="sr-only">{t("dialog.close")}</span>
                </Button>
              </DialogPrimitive.Close>
            ) : null}
          </div>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1 pr-16 text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-sm font-medium", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-xs/relaxed text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
