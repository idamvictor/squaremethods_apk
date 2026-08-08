import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  AdminCompaniesFilters,
  AdminCompaniesResponse,
  AdminCompanyDeleteResponse,
  AdminCompanyRestoreResponse,
  AdminCompanyUpdateResponse,
  AdminUserDeleteResponse,
  AdminUserRestoreResponse,
  AdminUserUpdateResponse,
  AdminUsersFilters,
  AdminUsersResponse,
  CreateEquipmentTypeDefaultInput,
  DeleteEquipmentTypeDefaultResponse,
  EquipmentTypeDefaultMutationResponse,
  EquipmentTypeDefaultsQueryParams,
  EquipmentTypeDefaultsResponse,
  SyncEquipmentTypeDefaultsInput,
  SyncEquipmentTypeDefaultsResponse,
  UpdateAdminCompanyRequest,
  UpdateAdminUserRequest,
  UpdateEquipmentTypeDefaultInput,
} from './admin-types'

const ADMIN_KEY = 'admin'
const EQUIP_KEY = 'equipment-type-defaults'

// ─── Companies ────────────────────────────────────────────────

export function useAdminCompanies(filters: AdminCompaniesFilters = { page: 1, limit: 15 }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'companies', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.limit) params.append('limit', String(filters.limit))
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.email) params.append('email', filters.email)
      if (filters.slug) params.append('slug', filters.slug)
      if (filters.deleted) params.append('deleted', filters.deleted)
      const res = await apiClient.get<AdminCompaniesResponse>(`/admin/companies?${params}`)
      return res.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useUpdateAdminCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminCompanyRequest }) =>
      apiClient.put<AdminCompanyUpdateResponse>(`/admin/companies/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}

export function useDeleteAdminCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<AdminCompanyDeleteResponse>(`/admin/companies/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}

export function useHardDeleteAdminCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, force = true }: { id: string; force?: boolean }) =>
      apiClient
        .delete<AdminCompanyDeleteResponse>(`/admin/companies/${id}/hard${force ? '?force=true' : ''}`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}

export function useRestoreAdminCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .post<AdminCompanyRestoreResponse>(`/admin/companies/${id}/restore`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}

// ─── Users ────────────────────────────────────────────────────

export function useAdminUsers(filters: AdminUsersFilters = { page: 1, limit: 15 }) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'users', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.limit) params.append('limit', String(filters.limit))
      if (filters.search) params.append('search', filters.search)
      if (filters.role) params.append('role', filters.role)
      if (filters.status) params.append('status', filters.status)
      if (filters.company_id) params.append('company_id', filters.company_id)
      if (filters.company_slug) params.append('company_slug', filters.company_slug)
      if (filters.company_name) params.append('company_name', filters.company_name)
      if (filters.team_id) params.append('team_id', filters.team_id)
      if (filters.email_verified !== undefined)
        params.append('email_verified', String(filters.email_verified))
      if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active))
      if (filters.deleted) params.append('deleted', filters.deleted)
      const res = await apiClient.get<AdminUsersResponse>(`/admin/users?${params}`)
      return res.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useUpdateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminUserRequest }) =>
      apiClient.put<AdminUserUpdateResponse>(`/admin/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}

export function useDeleteAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<AdminUserDeleteResponse>(`/admin/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}

export function useHardDeleteAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, force = true }: { id: string; force?: boolean }) =>
      apiClient
        .delete<AdminUserDeleteResponse>(`/admin/users/${id}/hard${force ? '?force=true' : ''}`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}

export function useRestoreAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<AdminUserRestoreResponse>(`/admin/users/${id}/restore`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_KEY] }),
  })
}

// ─── Equipment Type Defaults ──────────────────────────────────

export function useEquipmentTypeDefaults(params: EquipmentTypeDefaultsQueryParams = {}) {
  return useQuery({
    queryKey: [EQUIP_KEY, params],
    queryFn: async () => {
      const p = new URLSearchParams()
      p.append('page', String(params.page ?? 1))
      p.append('limit', String(params.limit ?? 20))
      if (params.search) p.append('search', params.search)
      const res = await apiClient.get<EquipmentTypeDefaultsResponse>(
        `/admin/equipment-type-defaults?${p}`,
      )
      return res.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useCreateEquipmentTypeDefault() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEquipmentTypeDefaultInput) =>
      apiClient
        .post<EquipmentTypeDefaultMutationResponse>('/admin/equipment-type-defaults', input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EQUIP_KEY] }),
  })
}

export function useUpdateEquipmentTypeDefault() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEquipmentTypeDefaultInput & { id: string }) =>
      apiClient
        .put<EquipmentTypeDefaultMutationResponse>(`/admin/equipment-type-defaults/${id}`, input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EQUIP_KEY] }),
  })
}

export function useDeleteEquipmentTypeDefault() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .delete<DeleteEquipmentTypeDefaultResponse>(`/admin/equipment-type-defaults/${id}`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EQUIP_KEY] }),
  })
}

export function useSyncEquipmentTypeDefaults() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SyncEquipmentTypeDefaultsInput = {}) =>
      apiClient
        .post<SyncEquipmentTypeDefaultsResponse>('/admin/equipment-type-defaults/sync', input)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EQUIP_KEY] })
      qc.invalidateQueries({ queryKey: ['equipment-types'] })
    },
  })
}
