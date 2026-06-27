export interface EquipmentType {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  created_at: string
  updated_at: string
}

export interface EquipmentTypesPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface EquipmentTypesResponse {
  success: boolean
  data: EquipmentType[]
  meta: EquipmentTypesPagination
}

export interface EquipmentTypesFilters {
  page?: number
  limit?: number
  search?: string
}
