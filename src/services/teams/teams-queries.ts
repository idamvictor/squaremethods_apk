import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { TeamListResponse, TeamMembersResponse } from './teams-types'

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await apiClient.get<TeamListResponse>('/teams', {
        params: { page: 1, limit: 100 },
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
