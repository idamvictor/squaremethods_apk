export type AdminCompanyStatus = 'active' | 'inactive' | 'suspended'

export interface AdminCompany {
  id: string
  name: string
  address: string | null
  email: string
  slug: string
  domain: string | null
  logo_url: string | null
  timezone: string
  currency: string
  status: AdminCompanyStatus
  created_at: string
  updated_at: string
  deleted_at?: string | null
  user_count: number
}

export interface AdminPagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface AdminCompaniesResponse {
  status: string
  data: AdminCompany[]
  pagination: AdminPagination
}

export interface AdminCompaniesFilters {
  page?: number
  limit?: number
  search?: string
  status?: AdminCompanyStatus
  email?: string
  slug?: string
  deleted?: 'true' | 'false' | 'all'
}

export interface UpdateAdminCompanyRequest {
  name?: string
  email?: string
  slug?: string
  domain?: string
  address?: string
  logo_url?: string
  timezone?: string
  currency?: string
  status?: AdminCompanyStatus
}

export interface AdminCompanyUpdateResponse {
  status: string
  data: AdminCompany
  message: string
}

export interface AdminCompanyDeleteResponse {
  status: string
  message: string
}

export interface AdminCompanyRestoreResponse {
  status: string
  message: string
  data?: AdminCompany
}

// ─── Admin Users ──────────────────────────────────────────────

export type AdminUserRole =
  | 'superadmin'
  | 'owner'
  | 'admin'
  | 'editor'
  | 'viewer'
  | 'technician'

export type AdminUserStatus = AdminCompanyStatus

export interface AdminUser {
  id: string
  first_name: string
  last_name: string
  username: string
  email: string
  phone: string | null
  role: AdminUserRole
  team_id: string | null
  avatar_url: string | null
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
  company: {
    id: string
    name: string
    slug: string
    domain: string | null
    status: AdminCompanyStatus
  }
  team: {
    id: string
    name: string
  } | null
}

export interface AdminUsersResponse {
  status: string
  data: AdminUser[]
  pagination: AdminPagination
}

export interface AdminUsersFilters {
  page?: number
  limit?: number
  search?: string
  role?: AdminUserRole
  status?: AdminUserStatus
  company_id?: string
  company_slug?: string
  company_name?: string
  team_id?: string
  email_verified?: boolean
  is_active?: boolean
  deleted?: 'true' | 'false' | 'all'
}

export interface UpdateAdminUserRequest {
  first_name?: string
  last_name?: string
  username?: string
  email?: string
  phone?: string
  avatar_url?: string
  role?: AdminUserRole
  status?: AdminUserStatus
  is_active?: boolean
  email_verified?: boolean
  company_id?: string
  team_id?: string
}

export interface AdminUserUpdateResponse {
  status: string
  data: AdminUser
  message: string
}

export interface AdminUserDeleteResponse {
  status: string
  message: string
}

export interface AdminUserRestoreResponse {
  status: string
  message: string
  data?: AdminUser
}

// ─── Equipment Type Defaults ──────────────────────────────────

export interface EquipmentTypeDefault {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EquipmentTypeDefaultsQueryParams {
  page?: number
  limit?: number
  search?: string
}

export interface EquipmentTypeDefaultsResponse {
  status: string
  message: string
  data: EquipmentTypeDefault[]
  pagination: AdminPagination
}

export interface EquipmentTypeDefaultResponse {
  status: string
  message: string
  data: EquipmentTypeDefault
}

export interface CreateEquipmentTypeDefaultInput {
  name: string
  description?: string
  icon?: string
  is_active?: boolean
}

export interface UpdateEquipmentTypeDefaultInput {
  name?: string
  description?: string
  icon?: string
  is_active?: boolean
}

export interface EquipmentTypeDefaultMutationResponse {
  status: string
  message: string
  data: EquipmentTypeDefault
}

export interface DeleteEquipmentTypeDefaultResponse {
  status: string
  message: string
  data: null
}

export interface SyncEquipmentTypeDefaultsInput {
  companyId?: string
  dryRun?: boolean
}

export interface SyncEquipmentTypeDefaultsResponse {
  status: string
  message: string
  data: {
    dryRun: boolean
    companiesProcessed: number
    totalAdded: number
    perCompany: Array<{
      companyId: string
      addedCount: number
      skippedCount: number
      added: string[]
    }>
  }
}
