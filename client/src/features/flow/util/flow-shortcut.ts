export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (target == null || typeof target !== "object") {
    return false
  }

  const element = target as {
    isContentEditable?: boolean
    tagName?: string
  }

  return (
    element.isContentEditable === true ||
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT"
  )
}

export function isFlowWorkspaceShortcut(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">
): boolean {
  const lower = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const hasMod = event.metaKey || event.ctrlKey
  return hasMod && event.shiftKey && !event.altKey && lower === "s"
}

export function shouldOpenFlowWorkspace(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey" | "repeat" | "target"
  >
): boolean {
  return (
    isFlowWorkspaceShortcut(event) &&
    !event.repeat &&
    !isEditableKeyboardTarget(event.target)
  )
}
