import { useMemo, useState } from "react"

import { FLOW_RUNS_PAGE_SIZE } from "@/features/flow/data/flow-constants"
import {
  deriveFlowStageCounts,
  reconcileSelectedRunId,
} from "@/features/flow/util/flow-eligibility"
import { useDebounce } from "@/shared/hooks/use-debounce"
import {
  useOrderInputRunDetailQuery,
  useOrderInputRunsPageQuery,
} from "@/shared/queries/order-input-run.query"
import {
  useVouchersByOrderInputRunQuery,
  useVouchersQuery,
} from "@/features/vouchers/queries/voucher.query"

export function useFlowWorkspace() {
  const [search, setSearch] = useState("")
  const [selectedRunId, setSelectedRunId] = useState<
    number | null | undefined
  >(undefined)
  const debouncedSearch = useDebounce(search)

  const pageRequest = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: FLOW_RUNS_PAGE_SIZE,
      sortBy: "createdAt",
      sortOrder: "DESC" as const,
      ...(debouncedSearch.trim()
        ? { filter: { title: debouncedSearch.trim() } }
        : {}),
    }),
    [debouncedSearch]
  )

  const runsQuery = useOrderInputRunsPageQuery(pageRequest)
  const runs = useMemo(() => runsQuery.data?.data ?? [], [runsQuery.data])
  const resolvedSelectedId = reconcileSelectedRunId(runs, selectedRunId)

  const detailQuery = useOrderInputRunDetailQuery(resolvedSelectedId)
  const selectedRun = detailQuery.data ??
    runs.find((run) => run.id === resolvedSelectedId) ??
    null

  const vouchersQuery = useVouchersQuery()
  const allVouchers = useMemo(
    () => vouchersQuery.data ?? [],
    [vouchersQuery.data]
  )
  const runVouchersQuery = useVouchersByOrderInputRunQuery(resolvedSelectedId)
  const runVouchers = useMemo(
    () => runVouchersQuery.data ?? [],
    [runVouchersQuery.data]
  )
  const counts = useMemo(
    () => deriveFlowStageCounts(runs, allVouchers),
    [runs, allVouchers]
  )

  return {
    search,
    setSearch,
    selectedRunId: resolvedSelectedId,
    setSelectedRunId,
    runs,
    selectedRun,
    runVouchers,
    allVouchers,
    counts,
    isListLoading: runsQuery.isLoading,
    isListFetching: runsQuery.isFetching,
    isDetailLoading: detailQuery.isLoading && !selectedRun,
    listError: runsQuery.error,
    detailError: detailQuery.error,
    refetchRuns: runsQuery.refetch,
  }
}
