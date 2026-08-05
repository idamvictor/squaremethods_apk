import { useAuthStore } from '@/store/auth-store'
import {
  usePublishJobAid,
  useSubmitJobAidForApproval,
  useUnpublishJobAid,
} from '@/services/job-aids/job-aids-queries'
import type { JobAid } from '@/services/job-aids/job-aids-types'

export function useJobAidApprovalActions(
  jobAid: Pick<JobAid, 'id' | 'status' | 'created_by'>,
) {
  const user = useAuthStore((s) => s.user)
  const submitMutation = useSubmitJobAidForApproval()
  const approveMutation = usePublishJobAid()
  const unpublishMutation = useUnpublishJobAid()

  const isOwnJobAid = !!user && user.id === jobAid.created_by

  return {
    canSubmitForApproval: jobAid.status === 'draft',
    canApprove: jobAid.status === 'pending_approval' && !isOwnJobAid,
    isPendingOwnApproval: jobAid.status === 'pending_approval' && isOwnJobAid,
    canUnpublish: jobAid.status === 'published',
    submitForApproval: () => submitMutation.mutateAsync(jobAid.id),
    approve: () => approveMutation.mutateAsync(jobAid.id),
    unpublish: () => unpublishMutation.mutateAsync(jobAid.id),
    isSubmitting: submitMutation.isPending,
    isApproving: approveMutation.isPending,
    isUnpublishing: unpublishMutation.isPending,
  }
}
