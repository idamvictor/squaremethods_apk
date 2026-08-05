export type FailureModeStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type ContributionType =
  | 'Problem Solved'
  | 'Improvement'
  | 'Best Practice'
  | 'Lesson Learned'
  | 'Troubleshooting Tip'
  | 'Safety Observation'
  | 'PM Optimization'

interface FailureModeUserRef {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

export interface FailureMode {
  id: string
  equipment_id: string
  reported_by: string
  image: string | null
  title: string
  status: FailureModeStatus
  priority: ContributionType
  resolutions: string[]
  due_date: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  equipment?: { id: string; name: string; reference_code: string }
  reporter?: FailureModeUserRef
  approver?: FailureModeUserRef | null
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

export interface FailureModesPendingApprovalMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FailureModesPendingApprovalResponse {
  status: string
  data: FailureMode[]
  meta: FailureModesPendingApprovalMeta
}

export interface FailureModesPendingApprovalQueryParams {
  page?: number
  limit?: number
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
  status?: FailureModeStatus
  priority: ContributionType
  resolutions: string[]
  due_date?: string | null
  image?: string
}

export interface UpdateFailureModeInput {
  failureModeId: string
  title?: string
  status?: FailureModeStatus
  priority?: ContributionType
  resolutions?: string[]
  due_date?: string | null
  equipment_id?: string
  image?: string | null
}
