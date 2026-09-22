import { create } from "zustand"

import type { FlowStageId } from "@/features/flow/data/flow-constants"

export type FlowWindowType =
  | "stage"
  | "order-set"
  | "generate-voucher"
  | "voucher-detail"
  | "export"
  | "new-input"
  | "quick-start"

export interface FlowWindowState {
  id: string
  type: FlowWindowType
  title: string
  stageId?: FlowStageId
  entityId?: number
  voucherId?: number
  minimized: boolean
  maximized: boolean
  zIndex: number
  x: number
  y: number
  width: number
  height: number
}

interface FlowWindowsStore {
  windows: FlowWindowState[]
  activeWindowId: string | null
  nextZ: number
  openStage: (stageId: FlowStageId, title: string) => void
  openOrderSet: (orderSetId: number, title: string) => void
  openGenerateVoucher: (
    orderSetId: number,
    title: string,
    voucherId?: number
  ) => void
  openVoucherDetail: (voucherId: number, title: string) => void
  openExport: (voucherId: number, title: string) => void
  openNewInput: (title?: string) => void
  openQuickStart: (title?: string) => void
  closeAll: () => void
  focus: (id: string) => void
  minimize: (id: string) => void
  restore: (id: string) => void
  toggleMaximize: (id: string) => void
  close: (id: string) => void
  move: (id: string, x: number, y: number) => void
  cycleFocus: () => void
  reset: () => void
}

const STAGE_SIZE = { width: 520, height: 420 }
const ORDER_SET_SIZE = { width: 1180, height: 860 }
const VOUCHER_DETAIL_SIZE = { width: 1080, height: 780 }
const GENERATE_SIZE = { width: 980, height: 720 }

function cascadeOffset(index: number) {
  return {
    x: 48 + (index % 6) * 28,
    y: 56 + (index % 6) * 24,
  }
}

function fitViewportSize(width: number, height: number) {
  if (typeof window === "undefined") {
    return { width, height }
  }

  const taskbarHeight = 44
  const pad = 24

  return {
    width: Math.max(360, Math.min(width, window.innerWidth - pad * 2)),
    height: Math.max(
      280,
      Math.min(height, window.innerHeight - taskbarHeight - pad)
    ),
  }
}

function centeredPosition(width: number, height: number) {
  if (typeof window === "undefined") {
    return cascadeOffset(0)
  }

  const taskbarHeight = 44
  const availableHeight = window.innerHeight - taskbarHeight

  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(16, Math.round((availableHeight - height) / 2)),
  }
}

function upsertWindow(
  windows: FlowWindowState[],
  next: Omit<FlowWindowState, "zIndex" | "maximized"> & {
    zIndex?: number
    maximized?: boolean
  },
  nextZ: number
): { windows: FlowWindowState[]; nextZ: number; activeWindowId: string } {
  const existing = windows.find((w) => w.id === next.id)
  if (existing) {
    return {
      windows: windows.map((w) =>
        w.id === next.id
          ? {
              ...w,
              ...next,
              minimized: false,
              zIndex: nextZ,
            }
          : w
      ),
      nextZ: nextZ + 1,
      activeWindowId: next.id,
    }
  }

  const offset = cascadeOffset(windows.length)
  return {
    windows: [
      ...windows,
      {
        ...next,
        x: next.x ?? offset.x,
        y: next.y ?? offset.y,
        maximized: next.maximized ?? false,
        zIndex: nextZ,
        minimized: false,
      },
    ],
    nextZ: nextZ + 1,
    activeWindowId: next.id,
  }
}

export const useFlowWindowsStore = create<FlowWindowsStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  nextZ: 10,

  openStage: (stageId, title) => {
    const id = `stage-${stageId}`
    const { windows, nextZ } = get()
    const position = centeredPosition(STAGE_SIZE.width, STAGE_SIZE.height)
    const result = upsertWindow(
      windows,
      {
        id,
        type: "stage",
        title,
        stageId,
        minimized: false,
        ...position,
        ...STAGE_SIZE,
      },
      nextZ
    )
    set(result)
  },

  openOrderSet: (orderSetId, title) => {
    const id = `order-set-${orderSetId}`
    const { windows, nextZ } = get()
    const size = fitViewportSize(ORDER_SET_SIZE.width, ORDER_SET_SIZE.height)
    const position = centeredPosition(size.width, size.height)
    const result = upsertWindow(
      windows,
      {
        id,
        type: "order-set",
        title,
        entityId: orderSetId,
        minimized: false,
        maximized: true,
        ...position,
        ...size,
      },
      nextZ
    )
    set(result)
  },

  openGenerateVoucher: (orderSetId, title, voucherId) => {
    const id =
      voucherId != null
        ? `generate-voucher-${orderSetId}-${voucherId}`
        : `generate-voucher-${orderSetId}`
    const { windows, nextZ } = get()
    const size = fitViewportSize(GENERATE_SIZE.width, GENERATE_SIZE.height)
    const position = centeredPosition(size.width, size.height)
    const result = upsertWindow(
      windows,
      {
        id,
        type: "generate-voucher",
        title,
        entityId: orderSetId,
        voucherId,
        minimized: false,
        ...position,
        ...size,
      },
      nextZ
    )
    set(result)
  },

  openVoucherDetail: (voucherId, title) => {
    const id = `voucher-detail-${voucherId}`
    const { windows, nextZ } = get()
    const size = fitViewportSize(
      VOUCHER_DETAIL_SIZE.width,
      VOUCHER_DETAIL_SIZE.height
    )
    const position = centeredPosition(size.width, size.height)
    const result = upsertWindow(
      windows,
      {
        id,
        type: "voucher-detail",
        title,
        entityId: voucherId,
        minimized: false,
        maximized: true,
        ...position,
        ...size,
      },
      nextZ
    )
    set(result)
  },

  openExport: (voucherId, title) => {
    const id = `export-${voucherId}`
    const { windows, nextZ } = get()
    const size = { width: 480, height: 360 }
    const position = centeredPosition(size.width, size.height)
    const result = upsertWindow(
      windows,
      {
        id,
        type: "export",
        title,
        entityId: voucherId,
        minimized: false,
        ...position,
        ...size,
      },
      nextZ
    )
    set(result)
  },

  openNewInput: (title = "New order data input") => {
    const { windows, nextZ } = get()
    const size = { width: 620, height: 720 }
    const position = centeredPosition(size.width, size.height)
    const result = upsertWindow(
      windows,
      {
        id: "new-input",
        type: "new-input",
        title,
        minimized: false,
        ...position,
        ...size,
      },
      nextZ
    )
    set(result)
  },

  openQuickStart: (title = "Quick-start guide") => {
    const { windows, nextZ } = get()
    const size = { width: 760, height: 620 }
    const position = centeredPosition(size.width, size.height)
    const result = upsertWindow(
      windows,
      {
        id: "quick-start",
        type: "quick-start",
        title,
        minimized: false,
        ...position,
        ...size,
      },
      nextZ
    )
    set(result)
  },

  closeAll: () => {
    set({ windows: [], activeWindowId: null })
  },

  focus: (id) => {
    const { windows, nextZ } = get()
    if (!windows.some((w) => w.id === id)) return
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, minimized: false, zIndex: nextZ } : w
      ),
      nextZ: nextZ + 1,
      activeWindowId: id,
    })
  },

  minimize: (id) => {
    const { windows, activeWindowId } = get()
    const remaining = windows.filter((w) => w.id !== id || true)
    const updated = remaining.map((w) =>
      w.id === id ? { ...w, minimized: true } : w
    )
    const nextActive =
      activeWindowId === id
        ? updated
            .filter((w) => !w.minimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null
        : activeWindowId
    set({ windows: updated, activeWindowId: nextActive })
  },

  restore: (id) => {
    get().focus(id)
  },

  toggleMaximize: (id) => {
    const { windows, nextZ } = get()
    set({
      windows: windows.map((window) =>
        window.id === id
          ? {
              ...window,
              minimized: false,
              maximized: !window.maximized,
              zIndex: nextZ,
            }
          : window
      ),
      activeWindowId: id,
      nextZ: nextZ + 1,
    })
  },

  close: (id) => {
    const { windows, activeWindowId } = get()
    const updated = windows.filter((w) => w.id !== id)
    const nextActive =
      activeWindowId === id
        ? updated
            .filter((w) => !w.minimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null
        : activeWindowId
    set({ windows: updated, activeWindowId: nextActive })
  },

  move: (id, x, y) => {
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, x: Math.max(0, x), y: Math.max(0, y) } : w
      ),
    })
  },

  cycleFocus: () => {
    const visible = get()
      .windows.filter((w) => !w.minimized)
      .sort((a, b) => a.zIndex - b.zIndex)
    if (visible.length === 0) return
    const current = get().activeWindowId
    const idx = visible.findIndex((w) => w.id === current)
    const next = visible[(idx + 1) % visible.length]
    get().focus(next.id)
  },

  reset: () => set({ windows: [], activeWindowId: null, nextZ: 10 }),
}))
