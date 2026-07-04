import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  CreateEquipmentInput,
  DeleteEquipmentResponse,
  EquipmentFilters,
  EquipmentQRCodeResponse,
  EquipmentResponse,
  EquipmentStatsResponse,
  GetEquipmentResponse,
  UpdateEquipmentInput,
} from './equipment-types'

const EQ_KEY = 'equipment'

export function useEquipment(filters: EquipmentFilters = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: [EQ_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', String(filters.page))
      if (filters.limit) params.append('limit', String(filters.limit))
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.location_id) params.append('location_id', filters.location_id)
      if (filters.equipment_type_id) params.append('equipment_type_id', filters.equipment_type_id)
      const res = await apiClient.get<EquipmentResponse>(`/equipment?${params}`)
      return res.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useEquipmentById(id: string | undefined) {
  return useQuery({
    queryKey: [EQ_KEY, id],
    queryFn: async () => {
      const res = await apiClient.get<GetEquipmentResponse>(`/equipment/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useEquipmentStats() {
  return useQuery({
    queryKey: [EQ_KEY, 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<EquipmentStatsResponse>('/equipment/stats')
      return res.data
    },
  })
}

export function useCreateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateEquipmentInput) =>
      apiClient.post<GetEquipmentResponse>('/equipment', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EQ_KEY] }),
  })
}

export function useUpdateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentInput }) =>
      apiClient.put<GetEquipmentResponse>(`/equipment/${id}`, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [EQ_KEY] })
      qc.invalidateQueries({ queryKey: [EQ_KEY, id] })
    },
  })
}

export function useEquipmentQRCode(id: string | undefined) {
  return useQuery({
    queryKey: [EQ_KEY, id, 'qrcode'],
    queryFn: async () => {
      const res = await apiClient.get<EquipmentQRCodeResponse>(`/equipment/${id}/qrcode`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useRegenerateEquipmentQRCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<EquipmentQRCodeResponse>(`/equipment/${id}/qrcode/regenerate`).then((r) => r.data),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: [EQ_KEY, id, 'qrcode'] }),
  })
}

export function useEquipmentByScan() {
  return useMutation({
    mutationFn: (code: string) =>
      apiClient.get<GetEquipmentResponse>(`/equipment/scan?code=${encodeURIComponent(code)}`).then((r) => r.data),
  })
}

export function useDeleteEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<DeleteEquipmentResponse>(`/equipment/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [EQ_KEY] }),
  })
}
