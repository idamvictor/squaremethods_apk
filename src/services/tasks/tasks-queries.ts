import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import type {
  CreateTaskInput,
  Task,
  TasksQueryParams,
  TasksResponse,
  UpdateTaskInput,
} from './tasks-types'

export const TASKS_KEY = 'tasks'

export function useTasks(params?: TasksQueryParams) {
  return useQuery({
    queryKey: [TASKS_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<TasksResponse>('/tasks', { params })
      return res.data
    },
  })
}

export function useTaskById(id?: string) {
  return useQuery({
    queryKey: [TASKS_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get<{ status: string; data: Task }>(`/tasks/${id}`)
      return res.data.data
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await apiClient.post('/tasks', input)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, ...body }: UpdateTaskInput) => {
      const res = await apiClient.put(`/tasks/${taskId}`, body)
      return res.data
    },
    onSuccess: (_data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY, taskId] })
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/tasks/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_KEY] })
    },
  })
}
