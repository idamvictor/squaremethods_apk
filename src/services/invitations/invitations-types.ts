export interface InvitationCreator {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
}

export interface Invitation {
  id: string
  token: string
  emails: string[] | null
  role: string
  created_by: string
  expires_at: string
  used_count: number
  max_uses: number | null
  creator: InvitationCreator
}

export interface InvitationsResponse {
  status: string
  data: Invitation[]
  pagination: { total: number; page: number; limit: number; pages: number }
}

export interface GenerateLinkInput {
  emails: string[]
  role: string
  expires_in_days: number
  max_uses?: number
}

export interface GenerateLinkResponse {
  status: string
  data: {
    id: string
    token: string
    link: string
    role: string
    emails: string[]
    expires_at: string
    max_uses: number | null
  }
}
