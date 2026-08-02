import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type {
  OrderBulkGenerateRun,
  OrderBulkGenerateStatus,
} from "@/shared/services/order.service"

interface OrderBulkGenerateState {
  runId: number | null
  status: OrderBulkGenerateStatus | null
  totalCount: number
  processedCount: number
  successCount: number
  failedCount: number
  errorMessage: string | null
  isMinimized: boolean
  downloadTriggered: boolean
  downloadFailed: boolean
  startRun: (run: OrderBulkGenerateRun) => void
  applyProgress: (run: OrderBulkGenerateRun) => void
  setMinimized: (isMinimized: boolean) => void
  markDownloadTriggered: () => void
  setDownloadFailed: (failed: boolean) => void
  dismiss: () => void
}

const INITIAL_STATE = {
  runId: null as number | null,
  status: null as OrderBulkGenerateStatus | null,
  totalCount: 0,
  processedCount: 0,
  successCount: 0,
  failedCount: 0,
  errorMessage: null as string | null,
  isMinimized: false,
  downloadTriggered: false,
  downloadFailed: false,
}

export const useOrderBulkGenerateStore = create<OrderBulkGenerateState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      startRun: (run) =>
        set({
          runId: run.id,
          status: run.status,
          totalCount: run.totalCount,
          processedCount: run.processedCount,
          successCount: run.successCount,
          failedCount: run.failedCount,
          errorMessage: run.errorMessage,
          isMinimized: false,
          downloadTriggered: false,
          downloadFailed: false,
        }),
      applyProgress: (run) =>
        set((state) => {
          if (state.runId != null && state.runId !== run.id) {
            return state
          }
          return {
            runId: run.id,
            status: run.status,
            totalCount: run.totalCount,
            processedCount: run.processedCount,
            successCount: run.successCount,
            failedCount: run.failedCount,
            errorMessage: run.errorMessage,
          }
        }),
      setMinimized: (isMinimized) => set({ isMinimized }),
      markDownloadTriggered: () =>
        set({ downloadTriggered: true, downloadFailed: false }),
      setDownloadFailed: (downloadFailed) => set({ downloadFailed }),
      dismiss: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: "order-bulk-generate",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        runId: state.runId,
        status: state.status,
        totalCount: state.totalCount,
        processedCount: state.processedCount,
        successCount: state.successCount,
        failedCount: state.failedCount,
        errorMessage: state.errorMessage,
        isMinimized: state.isMinimized,
        downloadTriggered: state.downloadTriggered,
        downloadFailed: state.downloadFailed,
      }),
    }
  )
)

export function selectIsBulkGenerateRunning(state: OrderBulkGenerateState) {
  return state.runId != null && state.status === "RUNNING"
}
