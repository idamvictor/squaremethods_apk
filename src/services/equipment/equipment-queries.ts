import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { EquipmentListResponse } from './equipment-types'

export function useEquipment(search?: string) {
  return useQuery({
    queryKey: ['equipment', search],
    queryFn: async () => {
      const res = await apiClient.get<EquipmentListResponse>('/equipment', {
        params: { page: 1, limit: 100, search: search || undefined },
      })
      return res.data
    },
  })
}
