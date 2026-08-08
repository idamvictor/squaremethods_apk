export type IngestJobStatus = 'pending' | 'ready' | 'failed'

export interface IngestJob {
  job_id: string
  status: IngestJobStatus
  file_url: string | null
  filename: string | null
  chunks: number | null
  words: number | null
  error: string | null
  created_at: string
  updated_at: string
}

export interface IngestStatusParams {
  equipment_id: string
  company_id: string
  limit?: number
}

export interface IngestStatusResponse {
  equipment_id: string
  company_id: string
  jobs: IngestJob[]
}

export interface IngestDocumentInput {
  file_url: string
  equipment_id: string
  company_id: string
}

export interface DeleteIngestedDocumentInput {
  file_url: string
  company_id: string
}

export interface DeleteNodeInput {
  equipment_id: string
  company_id: string
}

export interface ChatApiAckResponse {
  status: string
  message: string
  data: unknown
}
