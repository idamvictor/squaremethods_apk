export interface Team {
  id: string
  name: string
  description: string
  company_id: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  avatar_url: string | null
  created_at?: string
}

export interface TeamListResponse {
  success: boolean
  data: Team[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface TeamMembersResponse {
  success: boolean
  data: TeamMember[]
}

export interface TeamDetail extends Team {
  members: TeamMember[]
}

export interface TeamStats {
  memberCount: number
  activeJobs: number
  completedJobs: number
  overdueJobs: number
}

export interface TeamDetailResponse {
  success: boolean
  message: string
  data: TeamDetail
}

export interface TeamStatsResponse {
  success: boolean
  data: TeamStats
}

export interface CreateTeamInput {
  name: string
  description: string
}

export interface UpdateTeamInput {
  teamId: string
  name: string
  description: string
}

export interface AddTeamMemberInput {
  teamId: string
  user_id: string
  role: 'manager' | 'member'
}

export interface RemoveTeamMemberInput {
  teamId: string
  userId: string
}
