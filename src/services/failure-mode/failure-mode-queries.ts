import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  FailureModesResponse,
  FailureModeResponse,
  FailureModesQueryParams,
  FailureModesPendingApprovalResponse,
  FailureModesPendingApprovalQueryParams,
  CreateFailureModeInput,
  UpdateFailureModeInput,
} from './failure-mode-types'

export function useFailureModes(
  params?: FailureModesQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['failure-modes', params],
    queryFn: async () => {
      const res = await apiClient.get<FailureModesResponse>('/failure-modes', { params })
      return res.data
    },
    enabled: options?.enabled ?? true,
  })
}

export function useFailureModesPendingApproval(
  params?: FailureModesPendingApprovalQueryParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['failure-modes-pending-approval', params],
    queryFn: async () => {
      const res = await apiClient.get<FailureModesPendingApprovalResponse>(
        '/failure-modes/pending-approval',
        { params },
      )
      return res.data
    },
    enabled: options?.enabled ?? true,
  })
}

export function useFailureModeById(id?: string) {
  return useQuery({
    queryKey: ['failure-modes', id],
    queryFn: async () => {
      const res = await apiClient.get<FailureModeResponse>(`/failure-modes/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateFailureMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateFailureModeInput) => {
      const res = await apiClient.post('/failure-modes', input)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['failure-modes'] })
      qc.invalidateQueries({ queryKey: ['failure-modes-pending-approval'] })
      qc.invalidateQueries({ queryKey: ['equipment'] })
    },
  })
}

export function useUpdateFailureMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ failureModeId, ...body }: UpdateFailureModeInput) => {
      const res = await apiClient.put(`/failure-modes/${failureModeId}`, body)
      return res.data
    },
    onSuccess: (_data, { failureModeId }) => {
      qc.invalidateQueries({ queryKey: ['failure-modes', failureModeId] })
      qc.invalidateQueries({ queryKey: ['failure-modes'] })
      qc.invalidateQueries({ queryKey: ['failure-modes-pending-approval'] })
      qc.invalidateQueries({ queryKey: ['equipment'] })
    },
  })
}

export function useDeleteFailureMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/failure-modes/${id}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['failure-modes'] })
      qc.invalidateQueries({ queryKey: ['failure-modes-pending-approval'] })
      qc.invalidateQueries({ queryKey: ['equipment'] })
    },
  })
}
