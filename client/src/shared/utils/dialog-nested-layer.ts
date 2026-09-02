/** Radix layers portaled outside dialog content that should not dismiss the parent dialog. */
export function isDialogNestedLayer(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        [
          '[data-slot="select-content"]',
          '[data-slot="select-trigger"]',
          '[data-slot="select-item"]',
          '[data-radix-select-viewport]',
          '[data-slot="dropdown-menu-content"]',
          '[data-slot="dropdown-menu-sub-content"]',
          '[data-radix-popper-content-wrapper]',
        ].join(", ")
      )
    )
  )
}
