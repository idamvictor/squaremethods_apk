export type JobStatus =
  | 'on_hold'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type JobPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  job_id: string
  procedure_id: string
  title: string
  description: string
  step_number: number
  status: 'pending' | 'completed'
  notes: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AssignedUser {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
}

export interface JobTeam {
  id: string
  name: string
}

export interface JobAid {
  id: string
  title: string
}

export interface JobEquipment {
  id: string
  name: string
  serial_number: string
}

export interface Job {
  id: string
  company_id: string
  title: string
  description: string
  job_aid_id: string
  equipment_id: string | null
  team_id: string
  assigned_to: string
  created_by: string
  status: JobStatus
  priority: JobPriority
  due_date: string
  started_at: string | null
  completed_at: string | null
  estimated_duration: number
  actual_duration: number | null
  safety_notes: string
  completion_notes: string | null
  created_at: string
  updated_at: string
  jobAid: JobAid
  equipment: JobEquipment | null
  team: JobTeam
  assignedUser: AssignedUser
  tasks: Task[]
}

export interface JobsResponse {
  success: boolean
  data: Job[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface JobsQueryParams {
  page?: number
  limit?: number
  status?: JobStatus
  priority?: JobPriority
  search?: string
  team_id?: string
  assigned_to?: string
}
