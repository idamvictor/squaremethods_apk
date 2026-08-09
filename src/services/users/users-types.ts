import type { UserRole } from '@/types/auth'

export interface UsersQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: 'active' | 'inactive'
  team_id?: string
}

export interface UpdateUserInput {
  userId: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
}

export interface InviteUsersInput {
  emails: string[]
  role: string
  expires_in_days?: number
}

export interface DashboardStats {
  job_aid_created: number
  total_equipment: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
}

export interface GraphDataPoint {
  date: string
  count: number
}

export interface DashboardGraphData {
  sop_created: GraphDataPoint[]
  equipment_registered: GraphDataPoint[]
  total_task: GraphDataPoint[]
  completed_task: GraphDataPoint[]
}

export interface AdminDashboardResponse {
  status: string
  data: {
    message: string
    stats: DashboardStats
    graphData: DashboardGraphData
  }
}

export interface Team {
  id: string
  name: string
  company_id: string
}

export interface UserProfile {
  id: string
  team_id: string
  first_name: string
  last_name: string
  username: string
  email: string
  phone: string | null
  role: UserRole
  status: 'active' | 'inactive'
  avatar_url: string | null
  email_verified: boolean
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
  teams: Team[]
}

export interface ProfileResponse {
  success: boolean
  message: string
  data: UserProfile
}

export interface CompanyUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  avatar_url: string | null
  status?: 'active' | 'inactive'
  is_active?: boolean
  email_verified?: boolean
  created_at?: string
  team?: { id: string; name: string } | null
}

export interface CompanyUsersResponse {
  success: boolean
  data: CompanyUser[]
  meta: { total: number; page: number; limit: number; totalPages: number }
  pagination?: { total: number; page: number; limit: number; pages: number }
}

export interface UsersResponse {
  success: boolean
  data: CompanyUser[]
  meta: { total: number; page: number; limit: number; totalPages: number }
  pagination?: { total: number; page: number; limit: number; pages: number }
}

export interface UserDetailResponse {
  success: boolean
  data: UserProfile
}
