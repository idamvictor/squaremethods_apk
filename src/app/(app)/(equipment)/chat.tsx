import { useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { useCompanyStore } from '@/store/company-store'
import {
  useChatSessions,
  useSendChatMessage,
  useSessionMessages,
} from '@/services/chat/chat-queries'
import type { ChatMessage, ChatSession } from '@/services/chat/chat-types'

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '')
}

function buildEquipmentPath(equipmentId: string, locationName: string) {
  let path = useCompanyStore.getState().companySlug ?? ''
  if (locationName) path += `/${slugify(locationName)}`
  path += `/${equipmentId}`
  return path
}

function getSessionTitle(session: ChatSession) {
  if (session.title && session.title.trim()) return session.title
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const parts = session.equipment_path.split('/').filter((p) => p && !uuidPattern.test(p))
  if (parts.length === 0) return 'Untitled Session'
  return parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatSessionDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <View className={`px-4 ${isUser ? 'items-end' : 'items-start'} mb-3`}>
      <View
        className={`max-w-[85%] rounded-[22px] px-4 py-3 ${
          isUser ? 'bg-[#208AEF] rounded-tr-md' : 'bg-white border border-gray-200 rounded-tl-md'
        }`}
      >
        <Text className={`text-sm leading-5 ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {message.content}
        </Text>
      </View>
    </View>
  )
}

function TypingIndicator() {
  return (
    <View className="px-4 items-start mb-3">
      <View className="bg-white border border-gray-200 rounded-[22px] rounded-tl-md px-4 py-3 flex-row gap-x-1">
        <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      </View>
    </View>
  )
}

export default function EquipmentChatScreen() {
  const insets = useSafeAreaInsets()
  const { equipment_id, equipment_name, location_name } = useLocalSearchParams<{
    equipment_id: string
    equipment_name?: string
    location_name?: string
  }>()
  const company = useAuthStore((s) => s.company)
  const user = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const listRef = useRef<FlatList>(null)

  const equipmentPath = useMemo(
    () => buildEquipmentPath(equipment_id, location_name ?? ''),
    [equipment_id, location_name]
  )

  const { data: sessionsData, isLoading: sessionsLoading } = useChatSessions(
    company?.id,
    user?.id,
    activeTab === 'history'
  )
  const sessions = sessionsData?.sessions ?? []

  const sendMessageMutation = useSendChatMessage()
  const sessionMessagesMutation = useSessionMessages()

  function handleNewConversation() {
    setSessionId(null)
    setMessages([])
    setActiveTab('chat')
  }

  async function handleLoadSession(session: ChatSession) {
    if (!company?.id || !user?.id) return
    try {
      const result = await sessionMessagesMutation.mutateAsync({
        sessionId: session.id,
        companyId: company.id,
        userId: user.id,
      })
      setMessages(result.messages)
      setSessionId(session.id)
      setActiveTab('chat')
    } catch (e) {
      Alert.alert('Load Conversation', e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  async function handleSend() {
    const query = inputText.trim()
    if (!query || !company?.id || !user?.id || sendMessageMutation.isPending) return

    setInputText('')
    setMessages((prev) => [...prev, { role: 'user', content: query }])

    try {
      const result = await sendMessageMutation.mutateAsync({
        query,
        equipment_path: equipmentPath,
        company_id: company.id,
        user_id: user.id,
        session_id: sessionId,
      })
      setSessionId(result.session_id)
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer }])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Lost connection to the AI service.'
      Alert.alert('Chat', message)
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${message}` }])
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 gap-y-3"
      >
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="flex-1 text-base font-bold text-gray-900" numberOfLines={1}>
            AI Assistant{equipment_name ? ` · ${equipment_name}` : ''}
          </Text>
        </View>

        <View className="flex-row bg-gray-100 rounded-xl p-1">
          <Pressable
            onPress={() => setActiveTab('chat')}
            className={`flex-1 items-center py-2 rounded-lg ${activeTab === 'chat' ? 'bg-white' : ''}`}
          >
            <Text className={`text-sm font-semibold ${activeTab === 'chat' ? 'text-gray-900' : 'text-gray-500'}`}>
              Chat
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('history')}
            className={`flex-1 items-center py-2 rounded-lg ${activeTab === 'history' ? 'bg-white' : ''}`}
          >
            <Text className={`text-sm font-semibold ${activeTab === 'history' ? 'text-gray-900' : 'text-gray-500'}`}>
              History
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === 'chat' ? (
        <>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
            renderItem={({ item }) => <MessageBubble message={item} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={sendMessageMutation.isPending ? <TypingIndicator /> : null}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center gap-y-3 py-24">
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
                <Text className="text-sm text-gray-400">Ask me anything about this equipment</Text>
              </View>
            }
          />

          <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
            <View
              style={{ paddingBottom: insets.bottom + 12 }}
              className="flex-row items-end gap-x-2 px-4 pt-3 border-t border-gray-100 bg-white"
            >
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message…"
                placeholderTextColor="#9CA3AF"
                multiline
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-800 max-h-28"
              />
              <Pressable
                onPress={handleSend}
                disabled={!inputText.trim() || sendMessageMutation.isPending}
                className="w-10 h-10 rounded-full bg-[#208AEF] items-center justify-center active:opacity-80 disabled:opacity-40"
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </KeyboardStickyView>
        </>
      ) : (
        <View className="flex-1">
          <Pressable
            onPress={handleNewConversation}
            className="flex-row items-center gap-x-2 mx-4 mt-4 mb-2 bg-white border border-gray-200 rounded-xl px-4 py-3 active:opacity-80"
          >
            <Ionicons name="add-circle-outline" size={18} color="#208AEF" />
            <Text className="text-sm font-semibold text-[#208AEF]">New Conversation</Text>
          </Pressable>

          {sessionsLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#208AEF" />
            </View>
          ) : (
            <FlatList
              data={sessions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingTop: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleLoadSession(item)}
                  className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between active:opacity-80"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                      {getSessionTitle(item)}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                      {item.equipment_path}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {formatSessionDate(item.updated_at || item.created_at)}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center gap-y-3 py-24">
                  <Ionicons name="time-outline" size={48} color="#D1D5DB" />
                  <Text className="text-sm text-gray-400">No past conversations</Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </View>
  )
}
