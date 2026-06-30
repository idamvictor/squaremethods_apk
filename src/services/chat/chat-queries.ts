import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import chatApiClient from '@/lib/chat-axios'
import type {
  ChatSessionsResponse,
  SendChatMessageInput,
  SendChatMessageResponse,
  SessionMessagesResponse,
} from './chat-types'

export const CHAT_SESSIONS_KEY = 'chat-sessions'

export function useChatSessions(
  companyId: string | undefined,
  userId: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: [CHAT_SESSIONS_KEY, companyId, userId],
    queryFn: async () => {
      const res = await chatApiClient.get<ChatSessionsResponse>('/sessions', {
        params: { company_id: companyId, user_id: userId, limit: 20 },
      })
      return res.data
    },
    enabled: enabled && !!companyId && !!userId,
  })
}

export function useSessionMessages() {
  return useMutation({
    mutationFn: ({
      sessionId,
      companyId,
      userId,
    }: {
      sessionId: string
      companyId: string
      userId: string
    }) =>
      chatApiClient
        .get<SessionMessagesResponse>(`/sessions/${sessionId}/messages`, {
          params: { company_id: companyId, user_id: userId },
        })
        .then((r) => r.data),
  })
}

export function useSendChatMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SendChatMessageInput) =>
      chatApiClient.post<SendChatMessageResponse>('/chat', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CHAT_SESSIONS_KEY] }),
  })
}
