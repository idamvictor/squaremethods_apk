export type JobAidStatus = 'draft' | 'published'
export type JobAidCategory = 'Maintenance' | 'Safety' | 'Operations'

export interface JobAidCreator {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface JobAidEquipment {
  id: string
  equipment_type_id: string
  location_id: string
  name: string
  slug: string
  reference_code: string
  image: string | null
  status: string
  qrcode: string | null
}

export interface ProcedurePrecaution {
  id: string
  instruction: string
}

export interface Procedure {
  id: string
  job_aid_id: string
  title: string
  step: number
  instruction: string
  image: string | null
  type: 'procedure'
  precautions: ProcedurePrecaution[]
  createdAt: string
  updatedAt: string
}

export interface JobAid {
  id: string
  title: string
  slug: string
  category: JobAidCategory | null
  instruction: string
  status: JobAidStatus
  image: string | null
  estimated_duration: number | null
  qrcode: string | null
  view_count: number
  scan_count: number
  published_at: string | null
  createdAt: string
  updatedAt: string
  creator: JobAidCreator | null
  assignedEquipments: JobAidEquipment[]
  procedures: Procedure[]
}

export interface JobAidsPagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface JobAidsResponse {
  status: string
  data: JobAid[]
  pagination: JobAidsPagination
}

export interface JobAidResponse {
  status: string
  data: JobAid
}

export interface JobAidsQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: JobAidStatus
  equipment_id?: string
}

export interface CreateJobAidInput {
  title: string
  category: JobAidCategory
  instruction: string
  status: JobAidStatus
  image?: string
  estimated_duration?: number
  equipment_ids?: string[]
}

export interface UpdateJobAidInput {
  title?: string
  category?: JobAidCategory
  instruction?: string
  status?: JobAidStatus
  image?: string
  estimated_duration?: number
  equipment_ids?: string[]
}

export interface DuplicateJobAidInput {
  title: string
}

export interface CreateProcedureInput {
  job_aid_id: string
  title: string
  step: number
  instruction: string
  image?: string
  precautions?: { id?: string; instruction: string }[]
}

export interface UpdateProcedureInput {
  title?: string
  step?: number
  instruction?: string
  image?: string
  precautions?: { id?: string; instruction: string }[]
}

export interface ProceduresResponse {
  status: string
  data: Procedure[]
}

export interface ProcedureResponse {
  status: string
  data: Procedure
}

export interface UploadedFile {
  id: string
  name: string
  url: string
  file_type: string
  mime_type: string
  size: number
  folder: string
  formatted_size: string
  created_at: string
  updated_at: string
}

export interface UploadFileResponse {
  success: boolean
  message: string
  data: UploadedFile
}

export interface BrowseFile {
  key: string
  name: string
  url: string
  size: number
  lastModified: string
  mimetype: string
  originalName: string
}

export interface FilesResponse {
  success: boolean
  message: string
  data: BrowseFile[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
