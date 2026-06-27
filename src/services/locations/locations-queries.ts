import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  CreateLocationInput,
  DeleteLocationResponse,
  LocationResponse,
  LocationsResponse,
} from './locations-types'

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLocationInput) =>
      apiClient.post<LocationResponse>('/locations', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient.put<LocationResponse>(`/locations/${id}`, { name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<DeleteLocationResponse>(`/locations/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  })
}

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
