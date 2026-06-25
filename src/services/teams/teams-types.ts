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
