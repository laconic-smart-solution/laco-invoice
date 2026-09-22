import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isEditableKeyboardTarget,
  isFlowWorkspaceShortcut,
  shouldOpenFlowWorkspace,
} from "./flow-shortcut.ts"

test("Ctrl+Shift+S is the flow workspace shortcut", () => {
  assert.equal(
    isFlowWorkspaceShortcut({
      key: "s",
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
    }),
    true
  )
  assert.equal(
    isFlowWorkspaceShortcut({
      key: "S",
      ctrlKey: false,
      metaKey: true,
      shiftKey: true,
      altKey: false,
    }),
    true
  )
})

test("other modified keys are not the flow shortcut", () => {
  assert.equal(
    isFlowWorkspaceShortcut({
      key: "s",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    }),
    false
  )
  assert.equal(
    isFlowWorkspaceShortcut({
      key: "m",
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
    }),
    false
  )
})

test("shouldOpenFlowWorkspace ignores repeats and editable targets", () => {
  const input = { tagName: "INPUT", isContentEditable: false }
  const body = { tagName: "DIV", isContentEditable: false }
  assert.equal(isEditableKeyboardTarget(input), true)
  assert.equal(isEditableKeyboardTarget(body), false)
  assert.equal(
    shouldOpenFlowWorkspace({
      key: "s",
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
      repeat: true,
      target: body,
    }),
    false
  )
  assert.equal(
    shouldOpenFlowWorkspace({
      key: "s",
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
      repeat: false,
      target: input,
    }),
    false
  )
  assert.equal(
    shouldOpenFlowWorkspace({
      key: "s",
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      altKey: false,
      repeat: false,
      target: body,
    }),
    true
  )
})
