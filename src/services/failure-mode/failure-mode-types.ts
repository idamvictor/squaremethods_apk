export type FailureModeStatus = 'open' | 'in_progress' | 'resolved'
export type FailureModePriority = 'low' | 'medium' | 'high'

export interface FailureMode {
  id: string
  equipment_id: string
  reported_by: string
  image: string | null
  title: string
  status: FailureModeStatus
  priority: FailureModePriority
  resolutions: string[]
  due_date: string | null
  created_at: string
  updated_at: string
  equipment?: { id: string; name: string; reference_code: string }
  reporter?: { id: string; first_name: string; last_name: string; email: string; role: string }
}

export interface FailureModesResponse {
  status: string
  data: FailureMode[]
  pagination: { total: number; page: number; limit: number; pages: number }
}

export interface FailureModeResponse {
  status: string
  data: FailureMode
  message: string
}

export interface FailureModesQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: FailureModeStatus
  equipment_id?: string
}

export interface CreateFailureModeInput {
  equipment_id: string
  reported_by: string
  title: string
  status: FailureModeStatus
  priority: FailureModePriority
  resolutions: string[]
  due_date?: string | null
  image?: string
}

export interface UpdateFailureModeInput {
  failureModeId: string
  title?: string
  status?: FailureModeStatus
  priority?: FailureModePriority
  resolutions?: string[]
  due_date?: string | null
  equipment_id?: string
  image?: string | null
}
