import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { AdminDashboardResponse, ProfileResponse, CompanyUsersResponse } from './users-types'

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

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { first_name: string; last_name: string; phone?: string }) => {
      const res = await apiClient.put<ProfileResponse>('/users/profile', payload)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useChangePassword(userId: string) {
  return useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      const res = await apiClient.put(`/users/${userId}/password`, payload)
      return res.data
    },
  })
}

export function useDeleteAccount(userId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(`/users/${userId}`)
      return res.data
    },
  })
}

export function useCompanyUsers(search?: string) {
  return useQuery({
    queryKey: ['users', 'company', search],
    queryFn: async () => {
      const res = await apiClient.get<CompanyUsersResponse>('/users', {
        params: { page: 1, limit: 100, search: search || undefined },
      })
      return res.data
    },
  })
}
