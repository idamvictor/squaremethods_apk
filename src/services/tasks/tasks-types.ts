import type { JobAid } from '@/services/job-aids/job-aids-types'

export type { JobAid }

export interface TaskEquipment {
  id: string
  name: string
  reference_code: string
}

export interface Task {
  id: string
  title: string
  equipment_ids: string[]
  jobAids: JobAid[]
  equipments: TaskEquipment[]
  createdAt: string
  updatedAt: string
}

export interface TasksResponse {
  status: string
  data: Task[]
  pagination: { total: number; page: number; limit: number; pages: number }
}

export interface TaskResponse {
  status: string
  data: Task
}

export interface TasksQueryParams {
  page?: number
  limit?: number
  search?: string
  equipment_id?: string
}

export interface CreateTaskInput {
  title: string
  job_aid_ids: string[]
  equipment_ids?: string[]
}

export interface UpdateTaskInput {
  taskId: string
  title?: string
  equipment_ids?: string[]
}
