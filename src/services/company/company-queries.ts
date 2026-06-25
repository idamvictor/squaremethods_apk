import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { CompanyProfileResponse, UpdateCompanyPayload } from './company-types'

export function useCompanyProfile() {
  return useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      const res = await apiClient.get<CompanyProfileResponse>('/company/profile')
      return res.data
    },
  })
}

export function useUpdateCompanySettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateCompanyPayload) => {
      const res = await apiClient.put<CompanyProfileResponse>('/company/settings', payload)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company-profile'] })
    },
  })
}
