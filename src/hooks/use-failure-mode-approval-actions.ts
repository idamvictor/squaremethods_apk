import { useAuthStore } from '@/store/auth-store'
import { useUpdateFailureMode } from '@/services/failure-mode/failure-mode-queries'
import type { FailureMode } from '@/services/failure-mode/failure-mode-types'

export function useFailureModeApprovalActions(
  failureMode: Pick<FailureMode, 'id' | 'status' | 'reported_by'>,
) {
  const user = useAuthStore((s) => s.user)
  const updateMutation = useUpdateFailureMode()

  const isOwnReport = !!user && user.id === failureMode.reported_by
  const isPending = failureMode.status === 'open' || failureMode.status === 'in_progress'

  return {
    canApprove: isPending && !isOwnReport,
    isPendingOwnApproval: isPending && isOwnReport,
    canReopen: failureMode.status === 'resolved' || failureMode.status === 'closed',
    approve: () =>
      updateMutation.mutateAsync({ failureModeId: failureMode.id, status: 'resolved' }),
    reopen: () =>
      updateMutation.mutateAsync({ failureModeId: failureMode.id, status: 'open' }),
    isSaving: updateMutation.isPending,
  }
}
