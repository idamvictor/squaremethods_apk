import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  TeamListResponse,
  TeamMembersResponse,
  TeamDetailResponse,
  TeamStatsResponse,
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput,
  RemoveTeamMemberInput,
} from './teams-types'

export function useTeams(params?: { search?: string }) {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: async () => {
      const res = await apiClient.get<TeamListResponse>('/teams', {
        params: { page: 1, limit: 100, ...params },
      })
      return res.data
    },
  })
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: async () => {
      const res = await apiClient.get<TeamMembersResponse>(`/teams/${teamId}/members`)
      return res.data
    },
    enabled: !!teamId,
  })
}

export function useTeamById(teamId?: string) {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: async () => {
      const res = await apiClient.get<TeamDetailResponse>(`/teams/${teamId}`)
      return res.data.data
    },
    enabled: !!teamId,
  })
}

export function useTeamStats(teamId?: string) {
  return useQuery({
    queryKey: ['teams', teamId, 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<TeamStatsResponse>(`/teams/${teamId}/stats`)
      return res.data.data
    },
    enabled: !!teamId,
  })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTeamInput) => {
      const res = await apiClient.post('/teams', input)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ teamId, ...body }: UpdateTeamInput) => {
      const res = await apiClient.put(`/teams/${teamId}`, body)
      return res.data
    },
    onSuccess: (_data, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId] })
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiClient.delete(`/teams/${teamId}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useAddTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ teamId, ...body }: AddTeamMemberInput) => {
      const res = await apiClient.post(`/teams/${teamId}/members`, body)
      return res.data
    },
    onSuccess: (_data, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId] })
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'members'] })
    },
  })
}

export function useRemoveTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ teamId, userId }: RemoveTeamMemberInput) => {
      const res = await apiClient.delete(`/teams/${teamId}/members/${userId}`)
      return res.data
    },
    onSuccess: (_data, { teamId }) => {
      qc.invalidateQueries({ queryKey: ['teams', teamId] })
      qc.invalidateQueries({ queryKey: ['teams', teamId, 'members'] })
    },
  })
}
