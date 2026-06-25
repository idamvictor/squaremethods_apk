export interface CompanyProfile {
  id: string
  name: string
  email: string
  address: string
  slug: string
  logo_url?: string | null
  created_at: string
  updated_at: string
}

export interface CompanyProfileResponse {
  success: boolean
  message: string
  data: CompanyProfile
}

export interface UpdateCompanyPayload {
  name: string
  address: string
}
