export interface LocationEquipmentItem {
  id: string
  name: string
  reference_code: string
  status: string
  image: string | null
}

export interface Location {
  id: string
  name: string
  slug: string
  icon: string | null
  parent_location_id: string | null
  created_at: string
  updated_at: string
  children?: Location[]
  equipment?: LocationEquipmentItem[]
}

export interface LocationsResponse {
  success: boolean
  data: Location[]
}

export interface CreateLocationInput {
  name: string
  parent_location_id?: string
}

export interface LocationResponse {
  success: boolean
  data: Location
}

export interface DeleteLocationResponse {
  success: boolean
  data: null
}
