import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  AdminDashboardResponse,
  ProfileResponse,
  CompanyUsersResponse,
  UsersResponse,
  UserDetailResponse,
  UsersQueryParams,
  UpdateUserInput,
  InviteUsersInput,
} from './users-types'

export const USERS_KEY = 'users'

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

export function useUsers(params?: UsersQueryParams) {
  return useQuery({
    queryKey: [USERS_KEY, 'list', params],
    queryFn: async () => {
      const res = await apiClient.get<UsersResponse>('/users', { params })
      return res.data
    },
  })
}

export function useUserById(id?: string) {
  return useQuery({
    queryKey: [USERS_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get<UserDetailResponse>(`/users/${id}`)
      return res.data.data
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, ...payload }: UpdateUserInput) => {
      const res = await apiClient.put(`/users/${userId}`, payload)
      return res.data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [USERS_KEY, variables.userId] })
      qc.invalidateQueries({ queryKey: [USERS_KEY, 'list'] })
    },
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.put(`/users/${id}/activate`)
      return res.data
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [USERS_KEY, id] })
      qc.invalidateQueries({ queryKey: [USERS_KEY, 'list'] })
    },
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.put(`/users/${id}/deactivate`)
      return res.data
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [USERS_KEY, id] })
      qc.invalidateQueries({ queryKey: [USERS_KEY, 'list'] })
    },
  })
}

export function useAdminDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/users/${id}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY, 'list'] })
    },
  })
}

export function useInviteUsers() {
  return useMutation({
    mutationFn: async (payload: InviteUsersInput) => {
      const res = await apiClient.post('/invitations/send-invites', payload)
      return res.data
    },
  })
}
