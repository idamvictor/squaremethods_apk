export interface EquipmentItem {
  id: string
  name: string
  reference_code: string
  status: string
}

export interface EquipmentListResponse {
  success: boolean
  data: EquipmentItem[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}
