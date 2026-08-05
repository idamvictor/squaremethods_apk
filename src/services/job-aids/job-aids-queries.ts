import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/axios'
import chatApiClient from '@/lib/chat-axios'
import type {
  BrowseFile,
  CreateJobAidInput,
  CreateProcedureInput,
  DuplicateJobAidInput,
  FilesResponse,
  GenerateJobAidInput,
  GeneratedJobAidResponse,
  JobAidResponse,
  JobAidsQueryParams,
  JobAidsResponse,
  JobAidVersionResponse,
  JobAidVersionsListResponse,
  ProcedureResponse,
  ProceduresResponse,
  UpdateJobAidInput,
  UpdateProcedureInput,
  UploadFileResponse,
} from './job-aids-types'

export const JOB_AIDS_KEY = 'job-aids'
const PROCEDURES_KEY = 'procedures'
const FILES_KEY = 'files'

// ── Job Aid queries ──────────────────────────────────────────────────────────

export function useJobAids(params?: JobAidsQueryParams) {
  return useQuery({
    queryKey: [JOB_AIDS_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<JobAidsResponse>('/job-aids', { params })
      return res.data
    },
    placeholderData: (prev) => prev,
  })
}

export function useJobAidById(id: string) {
  return useQuery({
    queryKey: [JOB_AIDS_KEY, id],
    queryFn: async () => {
      const res = await apiClient.get<JobAidResponse>(`/job-aids/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

// ── Job Aid mutations ────────────────────────────────────────────────────────

export function useCreateJobAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateJobAidInput) =>
      apiClient.post<JobAidResponse>('/job-aids', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] }),
  })
}

export function useUpdateJobAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateJobAidInput & { id: string }) =>
      apiClient.put<JobAidResponse>(`/job-aids/${id}`, input).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, id] })
    },
  })
}

export function useDeleteJobAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/job-aids/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] }),
  })
}

export function useSubmitJobAidForApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<JobAidResponse>(`/job-aids/${id}/submit-for-approval`).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, id] })
    },
  })
}

export function usePublishJobAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<JobAidResponse>(`/job-aids/${id}/publish`).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, id] })
    },
  })
}

export function useUnpublishJobAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<JobAidResponse>(`/job-aids/${id}/unpublish`).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, id] })
    },
  })
}

export function useDuplicateJobAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: DuplicateJobAidInput & { id: string }) =>
      apiClient
        .post<JobAidResponse>(`/job-aids/${id}/duplicate`, { title })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] }),
  })
}

export function useGenerateJobAid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateJobAidInput) =>
      chatApiClient
        .post<GeneratedJobAidResponse>('/job-aids/generate', input)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] }),
  })
}

// ── Version history ──────────────────────────────────────────────────────────

export function useJobAidVersions(jobAidId: string) {
  return useQuery({
    queryKey: [JOB_AIDS_KEY, jobAidId, 'versions'],
    queryFn: async () => {
      const res = await apiClient.get<JobAidVersionsListResponse>(
        `/job-aids/${jobAidId}/versions`,
      )
      return res.data
    },
    enabled: !!jobAidId,
  })
}

export function useJobAidVersionDetails(jobAidId: string, versionId: string) {
  return useQuery({
    queryKey: [JOB_AIDS_KEY, jobAidId, 'versions', versionId],
    queryFn: async () => {
      const res = await apiClient.get<JobAidVersionResponse>(
        `/job-aids/${jobAidId}/versions/${versionId}`,
      )
      return res.data
    },
    enabled: !!jobAidId && !!versionId,
  })
}

export function useRestoreJobAidVersion(jobAidId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (versionId: string) =>
      apiClient
        .post<JobAidResponse>(`/job-aids/${jobAidId}/versions/${versionId}/restore`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, jobAidId] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, jobAidId, 'versions'] })
    },
  })
}

// ── Procedure queries ────────────────────────────────────────────────────────

export function useProcedures(jobAidId: string) {
  return useQuery({
    queryKey: [PROCEDURES_KEY, jobAidId],
    queryFn: async () => {
      const res = await apiClient.get<ProceduresResponse>(
        `/procedures/job-aid/${jobAidId}`,
      )
      return res.data
    },
    enabled: !!jobAidId,
  })
}

export function useCreateProcedure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProcedureInput) =>
      apiClient.post<ProcedureResponse>('/procedures', input).then((r) => r.data),
    onSuccess: (_, { job_aid_id }) => {
      qc.invalidateQueries({ queryKey: [PROCEDURES_KEY, job_aid_id] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, job_aid_id] })
    },
  })
}

export function useUpdateProcedure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      job_aid_id,
      ...input
    }: UpdateProcedureInput & { id: string; job_aid_id: string }) =>
      apiClient.put<ProcedureResponse>(`/procedures/${id}`, input).then((r) => r.data),
    onSuccess: (_, { job_aid_id }) => {
      qc.invalidateQueries({ queryKey: [PROCEDURES_KEY, job_aid_id] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, job_aid_id] })
    },
  })
}

export function useDeleteProcedure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string; job_aid_id: string }) =>
      apiClient.delete(`/procedures/${id}`).then((r) => r.data),
    onSuccess: (_, { job_aid_id }) => {
      qc.invalidateQueries({ queryKey: [PROCEDURES_KEY, job_aid_id] })
      qc.invalidateQueries({ queryKey: [JOB_AIDS_KEY, job_aid_id] })
    },
  })
}

// ── File operations ──────────────────────────────────────────────────────────

export function useFiles(page = 1) {
  return useQuery({
    queryKey: [FILES_KEY, page],
    queryFn: async () => {
      const res = await apiClient.get<FilesResponse>('/files', {
        params: { page, limit: 20 },
      })
      return res.data
    },
  })
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({
      uri,
      folder = 'job-aids',
    }: {
      uri: string
      folder?: string
    }): Promise<string> => {
      const filename = uri.split('/').pop() ?? 'image.jpg'
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg'
      const form = new FormData()
      form.append('file', { uri, name: filename, type } as unknown as Blob)
      form.append('folder', folder)
      const res = await apiClient.post<UploadFileResponse>('/upload/file', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.data.url
    },
  })
}

export function useDeleteFile() {
  return useMutation({
    mutationFn: (key: string) =>
      apiClient.delete(`/upload/file/${encodeURIComponent(key)}`).then((r) => r.data),
  })
}
