export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export interface SendChatMessageInput {
  query: string
  equipment_path: string
  company_id: string
  user_id: string
  session_id: string | null
}

export interface SendChatMessageResponse {
  answer: string
  session_id: string
}

export interface ChatSession {
  id: string
  title: string
  equipment_path: string
  created_at: string
  updated_at: string
}

export interface ChatSessionsResponse {
  sessions: ChatSession[]
}

export interface SessionMessagesResponse {
  messages: ChatMessage[]
}
