import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { AdminDashboardResponse, ProfileResponse } from './users-types'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<AdminDashboardResponse>('/users/dashboard')
      return res.data
    },
  })
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiClient.get<ProfileResponse>('/users/profile')
      return res.data
    },
  })
}
