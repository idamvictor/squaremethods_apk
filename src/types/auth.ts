export type UserRole =
  | 'superadmin'
  | 'owner'
  | 'admin'
  | 'user'
  | 'viewer'
  | 'technician'

export interface User {
  id: string
  team_id: string
  first_name: string
  last_name: string
  username: string
  email: string
  phone: string
  role: UserRole
  status: 'active' | 'inactive'
  avatar_url: string
  email_verified: boolean
  is_active: boolean
  last_login: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  email: string
  address: string
  slug: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
    company: Company
  }
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  first_name: string
  last_name: string
  company_name: string
  email: string
  password: string
  phone?: string
  company_address?: string
  invitation_token?: string
}

export interface OtpPayload {
  email: string
  otp?: string
}

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  token: string
  password: string
}
