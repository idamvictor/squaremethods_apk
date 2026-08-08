import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  InvitationsResponse,
  GenerateLinkInput,
  GenerateLinkResponse,
} from './invitations-types'

export const INVITATIONS_KEY = 'invitations'

export function useInvitations(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [INVITATIONS_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<InvitationsResponse>('/invitations', { params })
      return res.data
    },
  })
}

export function useRevokeInvitation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/invitations/${id}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVITATIONS_KEY] })
    },
  })
}

export function useGenerateInvitationLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: GenerateLinkInput) => {
      const res = await apiClient.post<GenerateLinkResponse>('/invitations/generate-link', payload)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INVITATIONS_KEY] })
    },
  })
}
