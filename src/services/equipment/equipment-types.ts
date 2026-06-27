export type EquipmentStatus = 'draft' | 'published'

export interface EquipmentType {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  name: string
  slug: string
  icon: string | null
  parent_location_id: string | null
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  name: string
  slug: string
  reference_code: string
  status: EquipmentStatus
  notes: string
  image: string | null
  qrcode: string | null
  documents: string[] | null
  equipment_type_id: string
  location_id: string
  created_at: string
  updated_at: string
  equipmentType: EquipmentType
  location: Location
}

export interface EquipmentMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface EquipmentResponse {
  success: boolean
  data: Equipment[]
  meta: EquipmentMeta
}

export interface GetEquipmentResponse {
  success: boolean
  data: Equipment
}

export interface EquipmentStats {
  total: number
  published: number
  draft: number
  withQR: number
  withImages: number
}

export interface EquipmentStatsResponse {
  success: boolean
  data: EquipmentStats
}

export interface EquipmentFilters {
  page?: number
  limit?: number
  search?: string
  status?: EquipmentStatus
  location_id?: string
  equipment_type_id?: string
}

export interface CreateEquipmentInput {
  equipment_type_id: string
  location_id: string
  name: string
  reference_code: string
  notes: string
  status: EquipmentStatus
  image?: string
}

export interface UpdateEquipmentInput {
  name?: string
  notes?: string
  status?: EquipmentStatus
  image?: string
  documents?: string[]
}

export interface DeleteEquipmentResponse {
  success: boolean
  data: null
}
