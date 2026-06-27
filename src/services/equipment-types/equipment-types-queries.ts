import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { EquipmentTypesFilters, EquipmentTypesResponse } from './equipment-types-types'

export function useEquipmentTypes(filters: EquipmentTypesFilters = { page: 1, limit: 100 }) {
  return useQuery({
    queryKey: ['equipment-types', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(filters.page ?? 1))
      params.append('limit', String(filters.limit ?? 100))
      if (filters.search) params.append('search', filters.search)
      const res = await apiClient.get<EquipmentTypesResponse>(`/equipment-types?${params}`)
      return res.data
    },
    placeholderData: (prev) => prev,
  })
}
