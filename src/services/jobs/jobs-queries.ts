import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  JobsQueryParams,
  JobsResponse,
  JobWithRelations,
  CreateJobInput,
  UpdateJobInput,
  CompleteJobInput,
  UpdateTaskInput,
} from './jobs-types'

export const JOBS_KEY = 'jobs'

export function useJobs(params?: JobsQueryParams) {
  return useQuery({
    queryKey: [JOBS_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<JobsResponse>('/jobs', { params })
      return res.data
    },
  })
}

export function useUserJobs(userId: string, params?: JobsQueryParams) {
  return useQuery({
    queryKey: [JOBS_KEY, 'user', userId, params],
    queryFn: async () => {
      const res = await apiClient.get<JobsResponse>(`/jobs/user/${userId}`, { params })
      return res.data
    },
    enabled: !!userId,
  })
}

export function useJobById(jobId: string | undefined) {
  return useQuery({
    queryKey: [JOBS_KEY, jobId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; message: string; data: JobWithRelations }>(`/jobs/${jobId}`)
      return res.data.data
    },
    enabled: !!jobId,
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const res = await apiClient.post('/jobs', input)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] })
    },
  })
}

export function useUpdateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, ...fields }: UpdateJobInput) => {
      const res = await apiClient.put(`/jobs/${jobId}`, fields)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY, variables.jobId] })
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] })
    },
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiClient.delete(`/jobs/${jobId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] })
    },
  })
}

export function useStartJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiClient.post(`/jobs/${jobId}/start`)
      return res.data
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY, jobId] })
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] })
    },
  })
}

export function useCompleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ jobId, completionNotes }: { jobId: string; completionNotes: string }) => {
      const payload: CompleteJobInput = { completion_notes: completionNotes }
      const res = await apiClient.post(`/jobs/${jobId}/complete`, payload)
      return res.data
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY, jobId] })
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY] })
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      jobId,
      taskId,
      status,
      notes,
    }: { jobId: string; taskId: string; status: 'pending' | 'completed'; notes: string }) => {
      const payload: UpdateTaskInput = { status, notes }
      const res = await apiClient.patch(`/jobs/${jobId}/tasks/${taskId}`, payload)
      return res.data
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: [JOBS_KEY, jobId] })
    },
  })
}
