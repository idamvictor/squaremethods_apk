import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { JobAidsQueryParams, JobAidsResponse } from './job-aids-types'

export const JOB_AIDS_KEY = 'job-aids'

export function useJobAids(params?: JobAidsQueryParams) {
  return useQuery({
    queryKey: [JOB_AIDS_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<JobAidsResponse>('/job-aids', { params })
      return res.data
    },
  })
}
