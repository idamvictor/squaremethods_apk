import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import chatApiClient from '@/lib/chat-axios'
import type {
  ChatApiAckResponse,
  DeleteIngestedDocumentInput,
  IngestDocumentInput,
  IngestStatusParams,
  IngestStatusResponse,
} from './documents-types'

export const INGEST_STATUS_KEY = 'ingest-status'

export function useIngestStatus(params?: Partial<IngestStatusParams>) {
  return useQuery({
    queryKey: [INGEST_STATUS_KEY, params?.equipment_id, params?.company_id],
    queryFn: async () => {
      const res = await chatApiClient.get<IngestStatusResponse>('/documents/ingest/status', {
        params,
      })
      return res.data
    },
    enabled: !!params?.equipment_id && !!params?.company_id,
    refetchInterval: (query) =>
      query.state.data?.jobs.some((j) => j.status === 'pending') ? 5000 : false,
  })
}

export function useIngestDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IngestDocumentInput) =>
      chatApiClient.post<ChatApiAckResponse>('/documents/ingest', input).then((r) => r.data),
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: [INGEST_STATUS_KEY, input.equipment_id] })
    },
  })
}

export function useDeleteIngestedDocument() {
  return useMutation({
    mutationFn: (input: DeleteIngestedDocumentInput) =>
      chatApiClient
        .delete<ChatApiAckResponse>('/documents/delete', { data: input })
        .then((r) => r.data),
  })
}
