import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { LocationsResponse } from './locations-types'

export function useLocationsWithEquipment(search?: string) {
  return useQuery({
    queryKey: ['locations', 'with-equipment', search],
    queryFn: async () => {
      const res = await apiClient.get<LocationsResponse>('/locations/list', {
        params: { search: search || undefined },
      })
      return res.data
    },
  })
}

export function useLocationsTree() {
  return useQuery({
    queryKey: ['locations', 'tree'],
    queryFn: async () => {
      const res = await apiClient.get<LocationsResponse>('/locations', {
        params: { tree: true, limit: 500 },
      })
      return res.data
    },
  })
}

export function useLocations(search?: string) {
  return useQuery({
    queryKey: ['locations', search],
    queryFn: async () => {
      const res = await apiClient.get<LocationsResponse>('/locations', {
        params: { limit: 100, search: search || undefined },
      })
      return res.data
    },
    placeholderData: (prev) => prev,
  })
}
