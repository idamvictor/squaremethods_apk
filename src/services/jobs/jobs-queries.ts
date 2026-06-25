import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type { JobsQueryParams, JobsResponse } from './jobs-types'

export function useJobs(params?: JobsQueryParams) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const res = await apiClient.get<JobsResponse>('/jobs', { params })
      return res.data
    },
  })
}

export function useUserJobs(userId: string, params?: JobsQueryParams) {
  return useQuery({
    queryKey: ['jobs', 'user', userId, params],
    queryFn: async () => {
      const res = await apiClient.get<JobsResponse>(`/jobs/user/${userId}`, { params })
      return res.data
    },
    enabled: !!userId,
  })
}
