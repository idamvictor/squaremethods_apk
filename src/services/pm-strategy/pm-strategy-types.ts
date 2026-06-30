export interface GeneratePmStrategyInput {
  equipment_id: string
  company_id: string
}

export interface GeneratePmStrategyResponse {
  job_id: string
  status: 'pending'
}

export type PmJobStatus = 'pending' | 'ready' | 'failed'

export interface PmJobStatusResponse {
  status: PmJobStatus
  download_url?: string
  error?: string
}

export interface ImportPmStrategyInput {
  file: { uri: string; name: string; type: string }
  equipment_id: string
  company_id: string
  created_by: string
}

export interface ImportedJobAid {
  job_aid_id: string
  pm_code: string
  pm_name: string
  steps: number
}

export interface ImportPmStrategyResponse {
  equipment_id: string
  equipment_name: string
  job_aids_created: number
  job_aids: ImportedJobAid[]
}
