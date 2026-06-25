export type JobAidStatus = 'draft' | 'published'

export interface JobAid {
  id: string
  title: string
  slug: string
  category: string | null
  status: JobAidStatus
  estimated_duration: number | null
  createdAt: string
  updatedAt: string
}

export interface JobAidsResponse {
  status: string
  data: JobAid[]
  pagination: { total: number; page: number; limit: number; pages: number }
}

export interface JobAidsQueryParams {
  page?: number
  limit?: number
  search?: string
}
