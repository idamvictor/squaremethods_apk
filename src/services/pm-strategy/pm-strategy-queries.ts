import { useMutation, useQueryClient } from '@tanstack/react-query'
import chatApiClient from '@/lib/chat-axios'
import { JOB_AIDS_KEY } from '@/services/job-aids/job-aids-queries'
import type {
  GeneratePmStrategyInput,
  GeneratePmStrategyResponse,
  ImportPmStrategyInput,
  ImportPmStrategyResponse,
  PmJobStatusResponse,
} from './pm-strategy-types'

export function useGeneratePmStrategy() {
  return useMutation({
    mutationFn: (input: GeneratePmStrategyInput) => {
      const formData = new FormData()
      formData.append('equipment_id', input.equipment_id)
      formData.append('company_id', input.company_id)
      return chatApiClient
        .post<GeneratePmStrategyResponse>('/pm-strategy/generate', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
  })
}

export async function getPmJobStatus(jobId: string, companyId: string) {
  const res = await chatApiClient.get<PmJobStatusResponse>(`/jobs/status/${jobId}`, {
    params: { company_id: companyId },
  })
  return res.data
}

export function useImportPmStrategy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ImportPmStrategyInput) => {
      const formData = new FormData()
      formData.append('file', input.file as unknown as Blob)
      formData.append('equipment_id', input.equipment_id)
      formData.append('company_id', input.company_id)
      formData.append('created_by', input.created_by)
      return chatApiClient
        .post<ImportPmStrategyResponse>('/pm-strategy/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] })
    },
  })
}
